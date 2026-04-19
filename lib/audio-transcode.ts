/**
 * Transcode audio files to compressed format before upload.
 * WAV/FLAC (~40MB) → WebM Opus (~2-4MB) using browser-native APIs.
 */

const TARGET_BITRATE = 128_000; // 128kbps — good quality, small size
const MAX_DURATION_SEC = 600;   // 10 min cap

/**
 * Transcode an audio File to WebM/Opus using MediaRecorder.
 * Falls back to original file if transcoding fails or file is already compressed.
 */
export async function transcodeAudio(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<File> {
  // Skip if already a compressed format and < 10MB
  const compressedTypes = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm'];
  if (compressedTypes.some((t) => file.type.startsWith(t)) && file.size < 10 * 1024 * 1024) {
    return file;
  }

  // Check MediaRecorder support
  const mimeType = getMimeType();
  if (!mimeType) {
    console.warn('MediaRecorder: no supported audio codec, skipping transcode');
    return file;
  }

  try {
    onProgress?.(0.05);

    // Decode audio
    const audioCtx = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(0.15);

    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();
    onProgress?.(0.3);

    if (audioBuffer.duration > MAX_DURATION_SEC) {
      throw new Error(`Audio too long: ${Math.round(audioBuffer.duration)}s (max ${MAX_DURATION_SEC}s)`);
    }

    // Create offline context to render audio
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate,
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    onProgress?.(0.5);

    // Encode via MediaRecorder
    const encoded = await encodeWithMediaRecorder(rendered, mimeType, onProgress);
    onProgress?.(0.95);

    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'm4a' : 'ogg';
    const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
    const result = new File([encoded], newName, { type: mimeType });

    // Only use transcoded if it's actually smaller
    if (result.size >= file.size * 0.9) {
      console.log('Transcode did not reduce size enough, using original');
      return file;
    }

    console.log(`Transcoded: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(result.size / 1024 / 1024).toFixed(1)}MB`);
    onProgress?.(1);
    return result;
  } catch (err) {
    console.warn('Transcode failed, using original file:', err);
    return file;
  }
}

function getMimeType(): string | null {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

function encodeWithMediaRecorder(
  audioBuffer: AudioBuffer,
  mimeType: string,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create a real-time context to feed MediaRecorder
    const ctx = new AudioContext({ sampleRate: audioBuffer.sampleRate });
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const dest = ctx.createMediaStreamDestination();
    source.connect(dest);

    const recorder = new MediaRecorder(dest.stream, {
      mimeType,
      audioBitsPerSecond: TARGET_BITRATE,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      ctx.close();
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.onerror = (e) => {
      ctx.close();
      reject(e);
    };

    // Track progress based on time
    const duration = audioBuffer.duration;
    const interval = setInterval(() => {
      if (ctx.state === 'closed') {
        clearInterval(interval);
        return;
      }
      const pct = Math.min(ctx.currentTime / duration, 1);
      onProgress?.(0.5 + pct * 0.4); // 50% → 90%
    }, 200);

    recorder.start();
    source.start(0);

    source.onended = () => {
      clearInterval(interval);
      // Small delay to ensure all data is captured
      setTimeout(() => recorder.stop(), 100);
    };
  });
}
