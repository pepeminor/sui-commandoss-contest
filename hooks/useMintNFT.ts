'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { signAndExecute } from '@/lib/sui-client';
import { buildMintNFTTx } from '@/lib/transactions';

export function useMintNFT() {
  const { address, getSigner } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, price }: { postId: string; price: bigint }) => {
      if (!address) throw new Error('Not logged in');

      const signer = await getSigner();
      const tx = buildMintNFTTx({ postId, price, senderAddress: address });
      return signAndExecute(tx, signer, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['myNFTs:all'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}
