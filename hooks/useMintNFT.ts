'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';
import { buildMintNFTTx } from '@/lib/transactions';
import { parseTransactionError, formatGasEstimate } from '@/lib/errors';

export function useMintNFT() {
  const { address, getSigner } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, price }: { postId: string; price: bigint }) => {
      if (!address) throw new Error('Not logged in');

      const signer = await getSigner();
      const tx = buildMintNFTTx({ postId, price, senderAddress: address });
      tx.setSender(address);

      // Pre-flight: check balance and estimate gas
      const totalNeeded = price; // price + gas
      try {
        const { balance } = await suiClient.core.getBalance({ owner: address });
        const balanceMist = BigInt(balance.balance);
        console.log('[MintNFT] Balance:', formatGasEstimate(0n, balanceMist));
        console.log('[MintNFT] NFT price:', (Number(price) / 1e9).toFixed(4), 'SUI');
        console.log('[MintNFT] Address:', address);
      } catch (e) {
        console.warn('[MintNFT] Could not fetch balance:', e);
      }

      // Dry run to estimate gas
      try {
        const simResult = await suiClient.core.simulateTransaction({
          transaction: tx,
          include: { effects: true },
        });
        const gas = simResult.Transaction?.effects?.gasUsed;
        if (gas) {
          console.log('[MintNFT] Gas estimate (dry run):', JSON.stringify(gas, null, 2));
        }
      } catch (e) {
        console.warn('[MintNFT] Dry run failed (expected if low balance):', String(e).slice(0, 200));
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
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}
