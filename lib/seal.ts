'use client';

import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import type { Signer } from '@mysten/sui/cryptography';
import { suiClient } from './sui-client';
import { buildSealApproveTx } from './transactions';
import { PACKAGE_ID } from '@/config';

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

export function clearSessionKey(address: string): void {
  sessionKeyCache.delete(address);
}

async function getOrCreateSessionKey(address: string, signer: Signer): Promise<SessionKey> {
  const cached = sessionKeyCache.get(address);
  if (cached && !cached.isExpired()) return cached;

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

// ─── Shared helpers ─────────────────────────────────────────────────────────

async function sealEncrypt(data: Uint8Array, packageId: string): Promise<Uint8Array> {
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

interface DecryptParams {
  data: Uint8Array;
  nftObjectId: string;
  postObjectId: string;
  userAddress: string;
  signer: Signer;
}

async function sealDecrypt({ data, nftObjectId, postObjectId, userAddress, signer }: DecryptParams): Promise<Uint8Array> {
  const sealClient = getSealClient();
  const innerId = EncryptedObject.parse(data).id;

  const attemptDecrypt = async (sessionKey: SessionKey) => {
    const tx = buildSealApproveTx(innerId, nftObjectId, postObjectId);
    tx.setSender(userAddress);
    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
    return sealClient.decrypt({ data, sessionKey, txBytes });
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

// ─── Public API ─────────────────────────────────────────────────────────────

/** Encrypt string content with Seal */
export async function encryptContent(content: string, packageId = PACKAGE_ID): Promise<Uint8Array> {
  return sealEncrypt(new TextEncoder().encode(content), packageId);
}

/** Encrypt raw bytes (e.g. AES key) with Seal */
export async function encryptRaw(data: Uint8Array, packageId = PACKAGE_ID): Promise<Uint8Array> {
  return sealEncrypt(data, packageId);
}

/** Decrypt raw bytes — returns Uint8Array */
export async function decryptRaw({
  encryptedData, nftObjectId, postObjectId, userAddress, signer,
}: {
  encryptedData: Uint8Array;
  nftObjectId: string;
  postObjectId: string;
  userAddress: string;
  signer: Signer;
}): Promise<Uint8Array> {
  return sealDecrypt({ data: encryptedData, nftObjectId, postObjectId, userAddress, signer });
}

/** Decrypt content — returns string */
export async function decryptContent({
  encryptedContent, nftObjectId, postObjectId, userAddress, signer,
}: {
  encryptedContent: Uint8Array | number[];
  nftObjectId: string;
  postObjectId: string;
  userAddress: string;
  signer: Signer;
}): Promise<string> {
  const bytes = encryptedContent instanceof Uint8Array ? encryptedContent : new Uint8Array(encryptedContent);
  const decrypted = await sealDecrypt({ data: bytes, nftObjectId, postObjectId, userAddress, signer });
  return new TextDecoder().decode(decrypted);
}
