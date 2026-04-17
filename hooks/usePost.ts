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

      const { object } = await suiClient.core.getObject({
        objectId: postId,
        include: { json: true },
      });

      const fields = object.json as Record<string, unknown> | null;
      if (!fields) return null;

      // vector<u8> may come back as base64 string or number[]
      const raw = fields.encrypted_content;
      let encryptedContent: number[];
      if (typeof raw === 'string') {
        // base64 → decode to bytes
        const binary = atob(raw);
        encryptedContent = Array.from(binary, (c) => c.charCodeAt(0));
      } else {
        encryptedContent = Array.from((raw as number[]) ?? []);
      }

      return {
        objectId: postId,
        author:           String(fields.author ?? ''),
        title:            String(fields.title ?? ''),
        encryptedContent,
        price:            BigInt(String(fields.price ?? 0)),
        maxSupply:        Number(fields.max_supply ?? 0),
        minted:           Number(fields.minted ?? 0),
        createdAt:        Number(fields.created_at ?? 0),
      };
    },
    enabled: !!postId,
    staleTime: 10_000,
  });
}
