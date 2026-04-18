'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';
import { buildMintNFTTx } from '@/lib/transactions';
import { parseTransactionError } from '@/lib/errors';

export function useMintNFT() {
  const { address, getSigner } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, price }: { postId: string; price: bigint }) => {
      if (!address) throw new Error('Not logged in');

      const signer = await getSigner();
      const tx = buildMintNFTTx({ postId, price, senderAddress: address });
      tx.setSender(address);

      let result;
      try {
        result = await suiClient.signAndExecuteTransaction({
          transaction: tx,
          signer,
        });
      } catch (e) {
        throw new Error(parseTransactionError(e));
      }

      if (result.$kind === 'FailedTransaction') {
        throw new Error(parseTransactionError(result.FailedTransaction?.status?.error));
      }

      await suiClient.core.waitForTransaction({ result });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}
