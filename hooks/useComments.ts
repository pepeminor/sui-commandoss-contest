import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CommentRow } from '@/lib/supabase';

async function fetchComments(postId: string): Promise<CommentRow[]> {
  const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

async function postComment(payload: { postId: string; address: string; content: string }): Promise<CommentRow> {
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to post comment');
  }
  return res.json();
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    staleTime: 15_000,
    enabled: !!postId,
  });
}

export function usePostComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postComment,
    onSuccess: (newComment) => {
      // Optimistic: prepend to cache
      queryClient.setQueryData<CommentRow[]>(['comments', postId], (old) =>
        old ? [newComment, ...old] : [newComment],
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
}
