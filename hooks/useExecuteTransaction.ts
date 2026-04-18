'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '@mysten/sui/transactions';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';
import { parseTransactionError } from '@/lib/errors';

interface ExecuteOptions {
  buildTx: () => Transaction | Promise<Transaction>;
  invalidateKeys?: string[][];
  onSuccess?: (result: any) => void;
  onError?: (err: Error) => void;
}

export function useExecuteTransaction() {
  const { address, getSigner } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ buildTx }: ExecuteOptions) => {
      if (!address) throw new Error('Not logged in');

      const signer = await getSigner();
      const tx = await buildTx();
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
    onSuccess: (_data, variables) => {
      if (variables.invalidateKeys) {
        for (const key of variables.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      variables.onSuccess?.(_data);
    },
    onError: (err, variables) => {
      variables.onError?.(err instanceof Error ? err : new Error(String(err)));
    },
  });
}
