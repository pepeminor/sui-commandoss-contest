'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';
import { buildCreatePostTx, buildCreatePostWithMediaTx } from '@/lib/transactions';
import { encryptContent, encryptRaw } from '@/lib/seal';
import { generateAESKey, exportKey, encryptMedia } from '@/lib/media-crypto';
import { uploadToWalrus } from '@/lib/walrus';
import { parseTransactionErrorI18n } from '@/lib/errors';

export interface CreatePostInput {
  title: string;
  content: string;
  price: bigint;        // MIST
  maxSupply: bigint;
  audioFile?: File;     // optional audio file
  onUploadProgress?: (stage: string, progress: number) => void;
}

export function useCreatePost() {
  const { address, getSigner } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, content, price, maxSupply, audioFile, onUploadProgress }: CreatePostInput) => {
      if (!address) throw new Error('Not logged in');

      const signer = await getSigner();

      if (audioFile) {
        // ── Audio post flow ──────────────────────────────────────────────
        onUploadProgress?.('encrypt', 0);

        // 1. Generate AES key & encrypt audio
        const aesKey = await generateAESKey();
        const audioBuffer = await audioFile.arrayBuffer();
        const encryptedAudio = await encryptMedia(audioBuffer, aesKey);

        onUploadProgress?.('upload', 0.2);

        // 2. Upload encrypted audio to Walrus
        const { blobId } = await uploadToWalrus(encryptedAudio);

        onUploadProgress?.('seal', 0.6);

        // 3. Seal-encrypt the AES key (32 bytes — fast)
        const rawKey = await exportKey(aesKey);
        const sealedKey = await encryptRaw(rawKey);

        // 4. Encrypt text content with Seal (lyrics/description)
        const encryptedContent = await encryptContent(content);

        onUploadProgress?.('chain', 0.8);

        // 5. Build and submit transaction
        const tx = buildCreatePostWithMediaTx({
          title,
          encryptedContent,
          mediaType: 1, // audio
          mediaBlobId: blobId,
          encryptionKey: sealedKey,
          price,
          maxSupply,
        });
        tx.setSender(address);

        let result;
        try {
          result = await suiClient.signAndExecuteTransaction({ transaction: tx, signer });
        } catch (e) {
          const parsed = parseTransactionErrorI18n(e);
          throw Object.assign(new Error(parsed.key), { i18n: parsed });
        }

        if (result.$kind === 'FailedTransaction') {
          const parsed = parseTransactionErrorI18n(result.FailedTransaction?.status?.error);
          throw Object.assign(new Error(parsed.key), { i18n: parsed });
        }

        await suiClient.core.waitForTransaction({ result });
        onUploadProgress?.('done', 1);
        return result;

      } else {
        // ── Text-only post flow (unchanged) ──────────────────────────────
        const encryptedContent = await encryptContent(content);

        const tx = buildCreatePostTx({ title, encryptedContent, price, maxSupply });
        tx.setSender(address);

        let result;
        try {
          result = await suiClient.signAndExecuteTransaction({ transaction: tx, signer });
        } catch (e) {
          const parsed = parseTransactionErrorI18n(e);
          throw Object.assign(new Error(parsed.key), { i18n: parsed });
        }

        if (result.$kind === 'FailedTransaction') {
          const parsed = parseTransactionErrorI18n(result.FailedTransaction?.status?.error);
          throw Object.assign(new Error(parsed.key), { i18n: parsed });
        }

        await suiClient.core.waitForTransaction({ result });
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
