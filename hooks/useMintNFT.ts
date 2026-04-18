'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';
import { buildMintNFTTx } from '@/lib/transactions';
import { parseTransactionErrorI18n } from '@/lib/errors';

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
        const parsed = parseTransactionErrorI18n(e);
        throw Object.assign(new Error(parsed.key), { i18n: parsed });
      }

      if (result.$kind === 'FailedTransaction') {
        const parsed = parseTransactionErrorI18n(result.FailedTransaction?.status?.error);
        throw Object.assign(new Error(parsed.key), { i18n: parsed });
      }

      await suiClient.core.waitForTransaction({ result });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['myNFTs:all'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}
