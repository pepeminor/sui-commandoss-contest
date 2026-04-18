/**
 * Walrus decentralized storage — upload and download blobs.
 * Testnet publisher + aggregator endpoints.
 */

const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

export interface WalrusUploadResult {
  blobId: string;
}

/**
 * Upload encrypted bytes to Walrus.
 * Returns the blob ID for retrieval.
 */
export async function uploadToWalrus(
  data: Uint8Array,
  onProgress?: (loaded: number, total: number) => void,
): Promise<WalrusUploadResult> {
  // Walrus publisher accepts PUT /v1/blobs with raw bytes
  const url = `${WALRUS_PUBLISHER}/v1/blobs`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: data.buffer as ArrayBuffer,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Walrus upload failed (${response.status}): ${text}`);
  }

  const result = await response.json();

  // Walrus returns { newlyCreated: { blobObject: { blobId } } } or { alreadyCertified: { blobId } }
  const blobId =
    result.newlyCreated?.blobObject?.blobId ??
    result.alreadyCertified?.blobId ??
    null;

  if (!blobId) {
    throw new Error('Walrus upload: no blobId in response');
  }

  return { blobId };
}

/**
 * Download blob from Walrus aggregator.
 * Returns raw bytes.
 */
export async function downloadFromWalrus(blobId: string): Promise<Uint8Array> {
  const url = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Walrus download failed (${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
