'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/sui-client';
import { suiClient } from '@/lib/sui-client';
import { PACKAGE_ID } from '@/config';
import { useAuth } from '@/auth/useAuth';

export interface MyPost {
  postId: string;
  title: string;
  price: bigint;
  maxSupply: number;
  minted: number;
  createdAt: string;
}

const PAGE_SIZE = 20;

const GET_MY_POSTS_QUERY = `
  query GetMyPosts($eventType: String!, $sender: String!, $first: Int!, $after: String) {
    events(
      filter: { type: $eventType, sender: $sender }
      last: $first
      before: $after
    ) {
      pageInfo {
        hasPreviousPage
        startCursor
      }
      nodes {
        contents { json }
        timestamp
      }
    }
  }
`;

interface MyPostPage {
  posts: MyPost[];
  nextCursor: string | null;
}

export function useMyPosts() {
  const { address } = useAuth();

  const query = useInfiniteQuery<MyPostPage>({
    queryKey: ['myPosts', address, PACKAGE_ID],
    queryFn: async ({ pageParam }) => {
      if (!address || !PACKAGE_ID) return { posts: [], nextCursor: null };

      const result = await graphqlClient.query({
        query: GET_MY_POSTS_QUERY,
        variables: {
          eventType: `${PACKAGE_ID}::post::PostCreated`,
          sender: address,
          first: PAGE_SIZE,
          after: pageParam || undefined,
        },
      });

      const data = result.data as any;
      const nodes: any[] = data?.events?.nodes ?? [];
      const pageInfo = data?.events?.pageInfo;

      // Fetch on-chain minted count for each post
      const posts = await Promise.all(
        nodes
          .map((node: any) => {
            const json = node.contents?.json ?? {};
            return {
              postId:    String(json.post_id ?? ''),
              title:     String(json.title ?? ''),
              price:     BigInt(json.price ?? 0),
              maxSupply: Number(json.max_supply ?? 0),
              createdAt: String(json.created_at ?? node.timestamp ?? Date.now()),
            };
          })
          .filter((p) => p.postId)
          .reverse()
          .map(async (post) => {
            try {
              const { object } = await suiClient.core.getObject({
                objectId: post.postId,
                include: { json: true },
              });
              const fields = object.json as Record<string, unknown> | null;
              return { ...post, minted: Number(fields?.minted ?? 0) };
            } catch {
              return { ...post, minted: 0 };
            }
          }),
      );

      return {
        posts,
        nextCursor: pageInfo?.hasPreviousPage ? pageInfo.startCursor : null,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
    enabled: !!address && !!PACKAGE_ID,
  });

  const allPosts = query.data?.pages.flatMap((p) => p.posts) ?? [];

  return {
    data: allPosts,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
