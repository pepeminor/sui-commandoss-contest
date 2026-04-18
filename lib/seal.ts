'use client';

import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import type { Signer } from '@mysten/sui/cryptography';
import { suiClient, graphqlClient } from './sui-client';
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

  // Official Seal example pattern: create WITHOUT signer, then manually sign
  // and call setPersonalMessageSignature(). This ensures local verification
  // of the zkLogin signature before sending to key servers.
  const sessionKey = await SessionKey.create({
    address,
    packageId: PACKAGE_ID,
    ttlMin: 10,
    suiClient: graphqlClient,
  });

  // Sign the personal message with the Enoki keypair (zkLogin signer)
  const personalMessage = sessionKey.getPersonalMessage();
  const { signature } = await signer.signPersonalMessage(personalMessage);

  // setPersonalMessageSignature verifies the signature locally first
  // (uses graphqlClient for zkLogin proof verification on-chain)
  await sessionKey.setPersonalMessageSignature(signature);

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
