'use client';

import { useQuery } from '@tanstack/react-query';
import { suiClient } from '@/lib/sui-client';

export interface PostData {
  objectId: string;
  author: string;
  title: string;
  encryptedContent: number[];
  price: bigint;
  maxSupply: number;
  minted: number;
  createdAt: number;
}

export function usePost(postId: string | undefined) {
  return useQuery<PostData | null>({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) return null;

      const obj = await suiClient.getObject({
        id: postId,
        options: { showContent: true },
      });

      if (obj.data?.content?.dataType !== 'moveObject') return null;
      const fields = obj.data.content.fields as any;

      return {
        objectId: postId,
        author:           String(fields.author ?? ''),
        title:            String(fields.title ?? ''),
        encryptedContent: Array.from(fields.encrypted_content ?? []),
        price:            BigInt(fields.price ?? 0),
        maxSupply:        Number(fields.max_supply ?? 0),
        minted:           Number(fields.minted ?? 0),
        createdAt:        Number(fields.created_at ?? 0),
      };
    },
    enabled: !!postId,
    staleTime: 10_000,
  });
}
