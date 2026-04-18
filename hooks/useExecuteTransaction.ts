'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '@mysten/sui/transactions';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';
import { parseTransactionErrorI18n } from '@/lib/errors';

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
