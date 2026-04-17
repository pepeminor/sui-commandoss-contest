'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';
import { buildMintNFTTx } from '@/lib/transactions';

export function useMintNFT() {
  const { address, getSigner } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, price }: { postId: string; price: bigint }) => {
      if (!address) throw new Error('Not logged in');

      const signer = await getSigner();
      const tx = buildMintNFTTx({ postId, price, senderAddress: address });
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
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}
