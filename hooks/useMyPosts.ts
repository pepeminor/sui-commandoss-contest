'use client';

import { useMemo } from 'react';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { graphqlClient, suiClient } from '@/lib/sui-client';
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

interface MyPostEventNode {
  contents?: {
    json?: Record<string, unknown>;
  };
  timestamp?: string | number;
}

interface MyPostsQueryData {
  events?: {
    nodes?: MyPostEventNode[];
    pageInfo?: {
      hasPreviousPage?: boolean;
      startCursor?: string | null;
    };
  };
}

export function useMyPosts() {
  const { address } = useAuth();

  const query = useInfiniteQuery<MyPostPage, Error, InfiniteData<MyPostPage>, readonly unknown[], string | null>({
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

      const data = result.data as MyPostsQueryData | null | undefined;
      const nodes = data?.events?.nodes ?? [];
      const pageInfo = data?.events?.pageInfo;

      const parsedPosts = nodes
        .map((node) => {
          const json = node.contents?.json ?? {};
          return {
            postId:    String(json.post_id ?? ''),
            title:     String(json.title ?? ''),
            price:     BigInt(String(json.price ?? 0)),
            maxSupply: Number(json.max_supply ?? 0),
            createdAt: String(json.created_at ?? node.timestamp ?? Date.now()),
          };
        })
        .filter((p) => p.postId)
        .reverse();

      // Batch fetch minted counts (1 RPC call instead of N)
      const postIds = parsedPosts.map((p) => p.postId);
      const mintedMap = new Map<string, number>();

      if (postIds.length > 0) {
        try {
          const { objects } = await suiClient.core.getObjects({
            objectIds: postIds,
            include: { json: true },
          });
          for (const obj of objects) {
            if (obj instanceof Error || !('json' in obj)) continue;
            const fields = obj.json as Record<string, unknown> | null;
            if (fields && obj.objectId) {
              mintedMap.set(obj.objectId, Number(fields.minted ?? 0));
            }
          }
        } catch {
          // fallback: all minted = 0
        }
      }

      const posts = parsedPosts.map((post) => ({
        ...post,
        minted: mintedMap.get(post.postId) ?? 0,
      }));

      return {
        posts,
        nextCursor: pageInfo?.hasPreviousPage ? (pageInfo.startCursor ?? null) : null,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
    enabled: !!address && !!PACKAGE_ID,
  });

  const allPosts = useMemo(
    () => query.data?.pages.flatMap((p) => p.posts) ?? [],
    [query.data?.pages],
  );

  return {
    data: allPosts,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
