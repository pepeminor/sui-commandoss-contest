/**
 * WAV header parsing and partial WAV blob construction
 * for progressive/streaming audio playback.
 */

export interface WavHeader {
  headerBytes: Uint8Array; // raw bytes before PCM data
  dataOffset: number;      // byte offset where PCM data starts
  dataSize: number;        // original data chunk size
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
  blockAlign: number;
}

/**
 * Parse WAV header. Handles variable-length headers (extra chunks before "data").
 * Returns null if not a valid WAV file.
 */
export function parseWavHeader(data: Uint8Array): WavHeader | null {
  if (data.length < 44) return null;
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // "RIFF" + "WAVE"
  if (data[0] !== 0x52 || data[1] !== 0x49 || data[2] !== 0x46 || data[3] !== 0x46) return null;
  if (data[8] !== 0x57 || data[9] !== 0x41 || data[10] !== 0x56 || data[11] !== 0x45) return null;

  let offset = 12;
  let sampleRate = 44100;
  let numChannels = 2;
  let bitsPerSample = 16;
  let blockAlign = 4;

  while (offset + 8 <= data.length) {
    const id = String.fromCharCode(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    const size = dv.getUint32(offset + 4, true);

    if (id === 'fmt ' && offset + 24 <= data.length) {
      numChannels = dv.getUint16(offset + 10, true);
      sampleRate = dv.getUint32(offset + 12, true);
      blockAlign = dv.getUint16(offset + 20, true);
      bitsPerSample = dv.getUint16(offset + 22, true);
    }

    if (id === 'data') {
      const dataOffset = offset + 8;
      return {
        headerBytes: data.slice(0, dataOffset),
        dataOffset,
        dataSize: size,
        sampleRate,
        numChannels,
        bitsPerSample,
        blockAlign,
      };
    }

    offset += 8 + size;
    if (size % 2) offset++; // WAV chunks are 2-byte aligned
  }

  return null;
}

/**
 * Build a playable WAV blob from header info + PCM data.
 * Updates RIFF size and data chunk size to match the actual data length.
 */
export function buildWavBlob(header: WavHeader, pcmData: Uint8Array): Blob {
  const hdr = new Uint8Array(header.headerBytes); // clone header
  const hv = new DataView(hdr.buffer, hdr.byteOffset, hdr.byteLength);

  // RIFF chunk size = (header length - 8) + pcmData length
  hv.setUint32(4, hdr.length - 8 + pcmData.length, true);
  // data sub-chunk size (last 4 bytes of header = the "data" chunk size field)
  hv.setUint32(hdr.length - 4, pcmData.length, true);

  return new Blob([hdr.buffer as ArrayBuffer, pcmData.buffer as ArrayBuffer], { type: 'audio/wav' });
}
