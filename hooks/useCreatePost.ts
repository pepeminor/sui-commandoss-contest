'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';
import { buildCreatePostTx } from '@/lib/transactions';
import { encryptContent } from '@/lib/seal';
import { parseTransactionError, formatGasEstimate } from '@/lib/errors';

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

      // Pre-flight: check balance and estimate gas
      try {
        const { balance } = await suiClient.core.getBalance({ owner: address });
        const balanceMist = BigInt(balance.balance);
        console.log('[CreatePost] Balance:', formatGasEstimate(0n, balanceMist));
        console.log('[CreatePost] Address:', address);
      } catch (e) {
        console.warn('[CreatePost] Could not fetch balance:', e);
      }

      // Dry run to estimate gas
      try {
        const simResult = await suiClient.core.simulateTransaction({
          transaction: tx,
          include: { effects: true },
        });
        const gas = simResult.Transaction?.effects?.gasUsed;
        if (gas) {
          console.log('[CreatePost] Gas estimate (dry run):', JSON.stringify(gas, null, 2));
        }
      } catch (e) {
        console.warn('[CreatePost] Dry run failed (expected if low balance):', String(e).slice(0, 200));
      }

      let result;
      try {
        result = await suiClient.core.signAndExecuteTransaction({
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
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
