'use client';

import { SealClient, SessionKey } from '@mysten/seal';
import type { Signer } from '@mysten/sui/cryptography';
import { suiClient } from './sui-client';
import { buildSealApproveTx } from './transactions';
import { PACKAGE_ID } from '@/config';

// Testnet Seal key servers (from official docs: https://seal-docs.wal.app)
const TESTNET_SERVER_CONFIGS = [
  {
    objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    weight: 1,
  },
  {
    objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
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

  // Pass signer directly so SessionKey lazily signs via getCertificate().
  // This avoids the local verifyPersonalMessageSignature call which can fail
  // for zkLogin (Enoki) signers — the Seal key servers verify instead.
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
    threshold: 2,
    packageId,
    id: Array.from(id).map((b) => b.toString(16).padStart(2, '0')).join(''),
    data,
  });

  return result.encryptedObject;
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
  const sessionKey = await getOrCreateSessionKey(userAddress, signer);

  const tx = buildSealApproveTx(nftObjectId, postObjectId);
  tx.setSender(userAddress);
  const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

  const bytes =
    encryptedContent instanceof Uint8Array ? encryptedContent : new Uint8Array(encryptedContent);

  const decryptedBytes = await sealClient.decrypt({ data: bytes, sessionKey, txBytes });
  return new TextDecoder().decode(decryptedBytes);
}
