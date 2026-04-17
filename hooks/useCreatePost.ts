'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';
import { buildCreatePostTx } from '@/lib/transactions';
import { encryptContent } from '@/lib/seal';

export interface CreatePostInput {
  title: string;
  content: string;
  price: bigint;        // MIST
  maxSupply: bigint;
}

export function useCreatePost() {
  const { address, getSigner } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, content, price, maxSupply }: CreatePostInput) => {
      if (!address) throw new Error('Not logged in');

      const encryptedContent = await encryptContent(content);
      const signer = await getSigner();

      const tx = buildCreatePostTx({ title, encryptedContent, price, maxSupply });
      tx.setSender(address);

      const result = await suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
      });

      if ((result as any).$kind === 'FailedTransaction') {
        throw new Error(
          (result as any).FailedTransaction?.status?.error?.message ?? 'Transaction failed',
        );
      }

      const digest = (result as any).digest ?? (result as any).Digest;
      if (digest) await suiClient.waitForTransaction({ digest });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
