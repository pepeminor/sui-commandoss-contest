'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { signAndExecute } from '@/lib/sui-client';
import { buildCreatePostTx, buildCreatePostWithMediaTx } from '@/lib/transactions';
import { encryptContent, encryptRaw } from '@/lib/seal';
import { generateAESKey, exportKey } from '@/lib/media-crypto';
import { encryptChunked } from '@/lib/chunked-crypto';
import { uploadToWalrus } from '@/lib/walrus';

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
      const encryptedContent = await encryptContent(content);

      let tx;
      if (audioFile) {
        onUploadProgress?.('encrypt', 0);
        const aesKey = await generateAESKey();
        const audioBuffer = await audioFile.arrayBuffer();
        const encryptedAudio = await encryptChunked(audioBuffer, aesKey);

        onUploadProgress?.('upload', 0.2);
        const { blobId } = await uploadToWalrus(encryptedAudio);

        onUploadProgress?.('seal', 0.6);
        const rawKey = await exportKey(aesKey);
        const sealedKey = await encryptRaw(rawKey);

        onUploadProgress?.('chain', 0.8);
        tx = buildCreatePostWithMediaTx({
          title, encryptedContent,
          mediaType: 1, mediaBlobId: blobId, encryptionKey: sealedKey,
          price, maxSupply,
        });
      } else {
        tx = buildCreatePostTx({ title, encryptedContent, price, maxSupply });
      }

      const result = await signAndExecute(tx, signer, address);
      if (audioFile) onUploadProgress?.('done', 1);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
