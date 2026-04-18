'use client';

import { useQuery } from '@tanstack/react-query';
import { suiClient } from '@/lib/sui-client';
import { PACKAGE_ID } from '@/config';
import { useAuth } from '@/auth/useAuth';

export interface NFTData {
  objectId: string;
  postId: string;
  postTitle: string;
  author: string;
  edition: number;
  mintedAt: number;
}

export function useMyNFTs() {
  const { address } = useAuth();

  return useQuery<NFTData[]>({
    queryKey: ['myNFTs', address, PACKAGE_ID],
    queryFn: async () => {
      if (!address || !PACKAGE_ID) return [];

      const resp = await suiClient.core.listOwnedObjects({
        owner: address,
        type: `${PACKAGE_ID}::nft::ContentNFT`,
        include: { json: true },
      });

      const nfts = resp.objects.flatMap((obj) => {
        const fields = obj.json as Record<string, unknown> | null;
        if (!fields) return [];
        return [{
          objectId:  obj.objectId,
          postId:    String(fields.post_id ?? ''),
          postTitle: String(fields.post_title ?? ''),
          author:    String(fields.author ?? ''),
          edition:   Number(fields.edition ?? 0),
          mintedAt:  Number(fields.minted_at ?? 0),
        }];
      });
      return nfts.sort((a, b) => b.mintedAt - a.mintedAt);
    },
    enabled: !!address && !!PACKAGE_ID,
    staleTime: 15_000,
  });
}

export function useHasAccess(postId: string | undefined): boolean {
  const { data } = useMyNFTs();
  if (!postId || !data) return false;
  return data.some((nft) => nft.postId === postId);
}

export function useNFTForPost(postId: string | undefined): NFTData | undefined {
  const { data } = useMyNFTs();
  if (!postId || !data) return undefined;
  return data.find((nft) => nft.postId === postId);
}

export function useNFTsForPost(postId: string | undefined): NFTData[] {
  const { data } = useMyNFTs();
  if (!postId || !data) return [];
  return data.filter((nft) => nft.postId === postId).sort((a, b) => a.edition - b.edition);
}
