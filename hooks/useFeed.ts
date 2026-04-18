'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
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

const PAGE_SIZE = 20;

const GET_POSTS_QUERY = `
  query GetPosts($eventType: String!, $first: Int!, $after: String) {
    events(filter: { type: $eventType }, last: $first, before: $after) {
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

interface FeedPage {
  posts: FeedPost[];
  nextCursor: string | null;
}

export function useFeed() {
  const query = useInfiniteQuery<FeedPage>({
    queryKey: ['feed', PACKAGE_ID],
    queryFn: async ({ pageParam }) => {
      if (!PACKAGE_ID) return { posts: [], nextCursor: null };

      const result = await graphqlClient.query({
        query: GET_POSTS_QUERY,
        variables: {
          eventType: `${PACKAGE_ID}::post::PostCreated`,
          first: PAGE_SIZE,
          after: pageParam || undefined,
        },
      });

      const data = result.data as any;
      const nodes: any[] = data?.events?.nodes ?? [];
      const pageInfo = data?.events?.pageInfo;

      const posts = nodes
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

      return {
        posts,
        nextCursor: pageInfo?.hasPreviousPage ? pageInfo.startCursor : null,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
    enabled: !!PACKAGE_ID,
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
