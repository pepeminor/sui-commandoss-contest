'use client';

import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import type { Signer } from '@mysten/sui/cryptography';
import { suiClient } from './sui-client';
import { buildSealApproveTx } from './transactions';
import { PACKAGE_ID } from '@/config';

// Independent testnet key server (Overclock — Open mode)
// Docs: https://seal-docs.wal.app/Pricing
const TESTNET_SERVER_CONFIGS = [
  {
    objectId: '0x9c949e53c36ab7a9c484ed9e8b43267a77d4b8d70e79aa6b39042e3d4c434105',
    weight: 1,
  },
];

// ─── Singleton SealClient ─────────────────────────────────────────────────────

let _sealClient: SealClient | null = null;

export function getSealClient(): SealClient {
  if (!_sealClient) {
    _sealClient = new SealClient({
      suiClient,
      serverConfigs: TESTNET_SERVER_CONFIGS,
      verifyKeyServers: false,
    });
  }
  return _sealClient;
}

// ─── SessionKey cache (TTL 10 min per address) ──────────────────────────────

const sessionKeyCache = new Map<string, SessionKey>();

/** Clear cached session key for an address (call on decrypt failure to force fresh key) */
export function clearSessionKey(address: string): void {
  sessionKeyCache.delete(address);
}

async function getOrCreateSessionKey(address: string, signer: Signer): Promise<SessionKey> {
  const cached = sessionKeyCache.get(address);
  if (cached && !cached.isExpired()) return cached;

  // Pass signer directly — SessionKey.getCertificate() will lazy-sign
  // the personal message when needed, avoiding the local
  // verifyPersonalMessageSignature() call that can fail with zkLogin.
  const sessionKey = await SessionKey.create({
    address,
    packageId: PACKAGE_ID,
    ttlMin: 10,
    signer,
    suiClient,
  });

  sessionKeyCache.set(address, sessionKey);
  setTimeout(() => sessionKeyCache.delete(address), 10 * 60 * 1000);
  return sessionKey;
}

// ─── Encrypt ─────────────────────────────────────────────────────────────────

export async function encryptContent(content: string, packageId = PACKAGE_ID): Promise<Uint8Array> {
  const sealClient = getSealClient();
  const data = new TextEncoder().encode(content);
  const id = crypto.getRandomValues(new Uint8Array(32));

  const result = await sealClient.encrypt({
    threshold: 1,
    packageId,
    id: Array.from(id).map((b) => b.toString(16).padStart(2, '0')).join(''),
    data,
  });

  return result.encryptedObject;
}

/** Encrypt raw bytes (e.g. AES key) — returns sealed bytes */
export async function encryptRaw(data: Uint8Array, packageId = PACKAGE_ID): Promise<Uint8Array> {
  const sealClient = getSealClient();
  const id = crypto.getRandomValues(new Uint8Array(32));

  const result = await sealClient.encrypt({
    threshold: 1,
    packageId,
    id: Array.from(id).map((b) => b.toString(16).padStart(2, '0')).join(''),
    data,
  });

  return result.encryptedObject;
}

/** Decrypt raw bytes (returns Uint8Array instead of string) */
export async function decryptRaw({
  encryptedData,
  nftObjectId,
  postObjectId,
  userAddress,
  signer,
}: {
  encryptedData: Uint8Array;
  nftObjectId: string;
  postObjectId: string;
  userAddress: string;
  signer: Signer;
}): Promise<Uint8Array> {
  const sealClient = getSealClient();

  const innerId = EncryptedObject.parse(encryptedData).id;

  const attemptDecrypt = async (sessionKey: SessionKey) => {
    const tx = buildSealApproveTx(innerId, nftObjectId, postObjectId);
    tx.setSender(userAddress);
    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
    return sealClient.decrypt({ data: encryptedData, sessionKey, txBytes });
  };

  let sessionKey = await getOrCreateSessionKey(userAddress, signer);
  try {
    return await attemptDecrypt(sessionKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('InvalidSignature') || msg.includes('InvalidCertificate') || msg.includes('Invalid user signature')) {
      clearSessionKey(userAddress);
      sessionKey = await getOrCreateSessionKey(userAddress, signer);
      return await attemptDecrypt(sessionKey);
    }
    throw err;
  }
}

// ─── Decrypt ─────────────────────────────────────────────────────────────────

export async function decryptContent({
  encryptedContent,
  nftObjectId,
  postObjectId,
  userAddress,
  signer,
}: {
  encryptedContent: Uint8Array | number[];
  nftObjectId: string;
  postObjectId: string;
  userAddress: string;
  signer: Signer;
}): Promise<string> {
  const sealClient = getSealClient();

  const bytes =
    encryptedContent instanceof Uint8Array ? encryptedContent : new Uint8Array(encryptedContent);

  // Extract the inner ID baked into the encrypted blob during encrypt
  const innerId = EncryptedObject.parse(bytes).id;

  const attemptDecrypt = async (sessionKey: SessionKey) => {
    const tx = buildSealApproveTx(innerId, nftObjectId, postObjectId);
    tx.setSender(userAddress);
    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
    return sealClient.decrypt({ data: bytes, sessionKey, txBytes });
  };

  // First attempt with (possibly cached) session key
  let sessionKey = await getOrCreateSessionKey(userAddress, signer);
  try {
    const decryptedBytes = await attemptDecrypt(sessionKey);
    return new TextDecoder().decode(decryptedBytes);
  } catch (err) {
    // On signature/session errors, clear cache and retry with a fresh session key
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('InvalidSignature') || msg.includes('InvalidCertificate') || msg.includes('Invalid user signature')) {
      clearSessionKey(userAddress);
      sessionKey = await getOrCreateSessionKey(userAddress, signer);
      const decryptedBytes = await attemptDecrypt(sessionKey);
      return new TextDecoder().decode(decryptedBytes);
    }
    throw err;
  }
}
