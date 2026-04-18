import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import { PACKAGE_ID, CLOCK_OBJECT_ID } from '@/config';

export interface CreatePostParams {
  title: string;
  encryptedContent: Uint8Array;
  price: bigint;       // in MIST
  maxSupply: bigint;
}

export interface CreatePostWithMediaParams extends CreatePostParams {
  mediaType: number;         // 0=text, 1=audio, 2=video, 3=image
  mediaBlobId: string;       // Walrus blob ID
  encryptionKey: Uint8Array; // Seal-encrypted AES key
}

export interface MintNFTParams {
  postId: string;
  price: bigint;       // in MIST — taken from Post object
  senderAddress: string;
}

/** Build a PTB for creating a new text-only Post (artist flow) */
export function buildCreatePostTx({ title, encryptedContent, price, maxSupply }: CreatePostParams): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(20_000_000); // 0.02 SUI
  tx.moveCall({
    target: `${PACKAGE_ID}::post::create_post`,
    arguments: [
      tx.pure.string(title),
      tx.pure.vector('u8', Array.from(encryptedContent)),
      tx.pure.u64(price),
      tx.pure.u64(maxSupply),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

/** Build a PTB for creating a Post with media (audio/video/image via Walrus) */
export function buildCreatePostWithMediaTx({
  title, encryptedContent, mediaType, mediaBlobId, encryptionKey, price, maxSupply,
}: CreatePostWithMediaParams): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(20_000_000); // 0.02 SUI
  tx.moveCall({
    target: `${PACKAGE_ID}::post::create_post_with_media`,
    arguments: [
      tx.pure.string(title),
      tx.pure.vector('u8', Array.from(encryptedContent)),
      tx.pure.u8(mediaType),
      tx.pure.string(mediaBlobId),
      tx.pure.vector('u8', Array.from(encryptionKey)),
      tx.pure.u64(price),
      tx.pure.u64(maxSupply),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

/** Build a PTB for minting a ContentNFT (buyer flow) */
export function buildMintNFTTx({ postId, price, senderAddress }: MintNFTParams): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(10_000_000); // 0.01 SUI
  const [payment] = tx.splitCoins(tx.gas, [price]);
  const [nft] = tx.moveCall({
    target: `${PACKAGE_ID}::post::mint_nft`,
    arguments: [tx.object(postId), payment, tx.object(CLOCK_OBJECT_ID)],
  });
  tx.transferObjects([nft], senderAddress);
  return tx;
}

/** Build a PTB for Seal decrypt verification (seal_approve dry-run) */
export function buildSealApproveTx(innerId: string, nftObjectId: string, postObjectId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::seal_policy::seal_approve`,
    arguments: [
      tx.pure.vector('u8', fromHex(innerId)),
      tx.object(nftObjectId),
      tx.object(postObjectId),
    ],
  });
  return tx;
}
