'use client';

import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/sui-client';
import { PACKAGE_ID } from '@/config';

export interface FeedPost {
  postId: string;
  author: string;
  title: string;
  price: bigint;
  maxSupply: number;
  createdAt: string;
}

const GET_POSTS_QUERY = `
  query GetPosts($eventType: String!) {
    events(filter: { type: $eventType }, last: 50) {
      nodes {
        contents { json }
        timestamp
      }
    }
  }
`;

export function useFeed() {
  return useQuery<FeedPost[]>({
    queryKey: ['feed', PACKAGE_ID],
    queryFn: async () => {
      if (!PACKAGE_ID) return [];

      const result = await graphqlClient.query({
        query: GET_POSTS_QUERY,
        variables: { eventType: `${PACKAGE_ID}::post::PostCreated` },
      });

      const nodes: any[] = (result.data as any)?.events?.nodes ?? [];
      return nodes
        .map((node: any) => {
          const json = node.contents?.json ?? {};
          return {
            postId:    String(json.post_id ?? ''),
            author:    String(json.author ?? ''),
            title:     String(json.title ?? ''),
            price:     BigInt(json.price ?? 0),
            maxSupply: Number(json.max_supply ?? 0),
            createdAt: String(json.created_at ?? node.timestamp ?? Date.now()),
          } satisfies FeedPost;
        })
        .filter((p: FeedPost) => p.postId)
        .reverse();
    },
    staleTime: 30_000,
    enabled: !!PACKAGE_ID,
  });
}
