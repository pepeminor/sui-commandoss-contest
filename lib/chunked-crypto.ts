/**
 * Chunked AES-256-GCM encryption for streaming decryption.
 *
 * Format:
 *   Header (12 bytes): MAGIC "SCHK" (4B) + chunkSize:u32LE (4B) + originalSize:u32LE (4B)
 *   Frames (repeated):  IV (12B) + ciphertext+tag (plainSize + 16B)
 *
 * Each chunk is independently encrypted → can be decrypted as soon as it arrives.
 */

const MAGIC = 0x4b484353; // "SCHK" LE
const HEADER_SIZE = 12;
const IV_SIZE = 12;
const TAG_SIZE = 16;
const DEFAULT_CHUNK_SIZE = 512 * 1024; // 512KB ≈ 3s of CD-quality WAV

export function isChunkedFormat(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return view.getUint32(0, true) === MAGIC;
}

/** Encrypt data in independently-decryptable chunks. */
export async function encryptChunked(
  data: ArrayBuffer,
  key: CryptoKey,
  chunkSize = DEFAULT_CHUNK_SIZE,
): Promise<Uint8Array> {
  const src = new Uint8Array(data);
  const numChunks = Math.ceil(src.length / chunkSize);

  // Calculate total output size
  let outputSize = HEADER_SIZE;
  for (let i = 0; i < numChunks; i++) {
    const plainSize = Math.min(chunkSize, src.length - i * chunkSize);
    outputSize += IV_SIZE + plainSize + TAG_SIZE;
  }

  const output = new Uint8Array(outputSize);
  const hv = new DataView(output.buffer);
  hv.setUint32(0, MAGIC, true);
  hv.setUint32(4, chunkSize, true);
  hv.setUint32(8, src.length, true);

  let pos = HEADER_SIZE;
  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const plaintext = src.slice(start, Math.min(start + chunkSize, src.length));

    const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
    const enc = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext),
    );

    output.set(iv, pos);
    pos += IV_SIZE;
    output.set(enc, pos);
    pos += enc.length;
  }

  return output;
}

/** Decrypt chunked data all at once (for non-streaming fallback). */
export async function decryptChunkedFull(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const chunkSize = dv.getUint32(4, true);
  const originalSize = dv.getUint32(8, true);

  const output = new Uint8Array(originalSize);
  let rPos = HEADER_SIZE;
  let wPos = 0;

  while (wPos < originalSize) {
    const plainSize = Math.min(chunkSize, originalSize - wPos);
    const iv = data.slice(rPos, rPos + IV_SIZE);
    rPos += IV_SIZE;
    const ct = data.slice(rPos, rPos + plainSize + TAG_SIZE);
    rPos += plainSize + TAG_SIZE;

    const dec = new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct),
    );
    output.set(dec, wPos);
    wPos += dec.length;
  }

  return output;
}

/**
 * Streaming decrypt: reads from fetch body, decrypts chunk-by-chunk,
 * calls onChunk after each decrypted chunk with accumulated progress.
 *
 * @returns The full decrypted data.
 */
export async function decryptChunkedStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  contentLength: number,
  key: CryptoKey,
  onChunk: (output: Uint8Array, decrypted: number, originalSize: number) => void,
): Promise<Uint8Array> {
  // ── Buffered reader ────────────────────────────────────────────────────────
  // Pre-allocate if content-length known, otherwise grow dynamically.
  let buf = new Uint8Array(contentLength > 0 ? contentLength : 1024 * 1024);
  let bufLen = 0;
  let done = false;

  async function fill(need: number) {
    while (bufLen < need && !done) {
      const r = await reader.read();
      if (r.done) { done = true; return; }
      const v = r.value;
      if (bufLen + v.length > buf.length) {
        const next = new Uint8Array(Math.max(buf.length * 2, bufLen + v.length));
        next.set(buf.slice(0, bufLen));
        buf = next;
      }
      buf.set(v, bufLen);
      bufLen += v.length;
    }
  }

  // ── Read header ────────────────────────────────────────────────────────────
  await fill(HEADER_SIZE);
  const hv = new DataView(buf.buffer, buf.byteOffset, HEADER_SIZE);
  if (hv.getUint32(0, true) !== MAGIC) {
    throw new Error('Not chunked format');
  }
  const chunkSize = hv.getUint32(4, true);
  const originalSize = hv.getUint32(8, true);

  const output = new Uint8Array(originalSize);
  let rPos = HEADER_SIZE;
  let wPos = 0;

  // ── Decrypt chunks as they arrive ─────────────────────────────────────────
  while (wPos < originalSize) {
    const plainSize = Math.min(chunkSize, originalSize - wPos);
    const frameEnd = rPos + IV_SIZE + plainSize + TAG_SIZE;

    await fill(frameEnd);

    const iv = buf.slice(rPos, rPos + IV_SIZE);
    rPos += IV_SIZE;
    const ct = buf.slice(rPos, rPos + plainSize + TAG_SIZE);
    rPos += plainSize + TAG_SIZE;

    const dec = new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct),
    );
    output.set(dec, wPos);
    wPos += dec.length;

    onChunk(output, wPos, originalSize);
  }

  return output;
}
