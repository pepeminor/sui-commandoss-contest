/**
 * AES-256-GCM encryption/decryption for large media files.
 * Uses Web Crypto API (browser-native, no dependencies).
 */

const AES_ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/** Generate a random AES-256 key */
export async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: AES_ALGO, length: KEY_LENGTH },
    true, // extractable — we need to export it for Seal encryption
    ['encrypt', 'decrypt'],
  );
}

/** Export AES key to raw bytes (32 bytes) */
export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(raw);
}

/** Import raw bytes back to CryptoKey */
export async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    raw.buffer as ArrayBuffer,
    { name: AES_ALGO, length: KEY_LENGTH },
    false,
    ['decrypt'],
  );
}

/**
 * Encrypt a file/blob with AES-256-GCM.
 * Returns: [12-byte IV] + [ciphertext + 16-byte tag]
 */
export async function encryptMedia(data: ArrayBuffer, key: CryptoKey): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_ALGO, iv },
    key,
    data,
  );

  // Prepend IV to ciphertext
  const result = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), IV_LENGTH);
  return result;
}

/**
 * Decrypt AES-256-GCM encrypted data.
 * Expects: [12-byte IV] + [ciphertext + tag]
 */
export async function decryptMedia(encrypted: Uint8Array, key: CryptoKey): Promise<ArrayBuffer> {
  const iv = encrypted.slice(0, IV_LENGTH);
  const ciphertext = encrypted.slice(IV_LENGTH);

  return crypto.subtle.decrypt(
    { name: AES_ALGO, iv },
    key,
    ciphertext,
  );
}
