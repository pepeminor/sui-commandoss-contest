'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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

const PAGE_SIZE = 5;

interface NFTPage {
  nfts: NFTData[];
  nextCursor: string | null;
}

function parseNFTs(objects: any[]): NFTData[] {
  return objects.flatMap((obj) => {
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
}

export function useMyNFTs() {
  const { address } = useAuth();

  const query = useInfiniteQuery<NFTPage>({
    queryKey: ['myNFTs', address, PACKAGE_ID],
    queryFn: async ({ pageParam }) => {
      if (!address || !PACKAGE_ID) return { nfts: [], nextCursor: null };

      const resp = await suiClient.core.listOwnedObjects({
        owner: address,
        type: `${PACKAGE_ID}::nft::ContentNFT`,
        include: { json: true },
        limit: PAGE_SIZE,
        cursor: (pageParam as string) || undefined,
      });

      const nfts = parseNFTs(resp.objects);

      return {
        nfts,
        nextCursor: resp.hasNextPage ? resp.cursor : null,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!address && !!PACKAGE_ID,
    staleTime: 15_000,
  });

  const allNFTs = (query.data?.pages.flatMap((p) => p.nfts) ?? [])
    .sort((a, b) => b.mintedAt - a.mintedAt);

  return {
    data: allNFTs,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

// Light query that loads ALL nfts for access checks (no pagination)
function useAllMyNFTs() {
  const { address } = useAuth();

  return useQuery<NFTData[]>({
    queryKey: ['myNFTs:all', address, PACKAGE_ID],
    queryFn: async () => {
      if (!address || !PACKAGE_ID) return [];

      const resp = await suiClient.core.listOwnedObjects({
        owner: address,
        type: `${PACKAGE_ID}::nft::ContentNFT`,
        include: { json: true },
      });

      return parseNFTs(resp.objects);
    },
    enabled: !!address && !!PACKAGE_ID,
    staleTime: 15_000,
  });
}

export function useHasAccess(postId: string | undefined): boolean {
  const { data } = useAllMyNFTs();
  if (!postId || !data) return false;
  return data.some((nft) => nft.postId === postId);
}

export function useNFTForPost(postId: string | undefined): NFTData | undefined {
  const { data } = useAllMyNFTs();
  if (!postId || !data) return undefined;
  return data.find((nft) => nft.postId === postId);
}

export function useNFTsForPost(postId: string | undefined): NFTData[] {
  const { data } = useAllMyNFTs();
  if (!postId || !data) return [];
  return data.filter((nft) => nft.postId === postId).sort((a, b) => a.edition - b.edition);
}
