import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, type CommentRow } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MAX_CONTENT_LENGTH = 500;
const MAX_COMMENTS_PER_PAGE = 100;
const RATE_LIMIT_MS = 10_000;
const SUI_ADDRESS_REGEX = /^0x[a-fA-F0-9]{64}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const postId = searchParams.get('postId');

  if (!postId || !SUI_ADDRESS_REGEX.test(postId)) {
    return NextResponse.json({ error: 'Invalid or missing postId' }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from('comments')
    .select('id, post_id, address, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(MAX_COMMENTS_PER_PAGE);

  if (error) {
    console.error('Supabase GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }

  return NextResponse.json(data as CommentRow[]);
}

export async function POST(request: NextRequest) {
  let body: { postId?: string; address?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { postId, address, content } = body;

  if (!postId || !address || !content) {
    return NextResponse.json({ error: 'postId, address, and content are required' }, { status: 400 });
  }

  if (!SUI_ADDRESS_REGEX.test(postId)) {
    return NextResponse.json({ error: 'Invalid postId format' }, { status: 400 });
  }

  if (!SUI_ADDRESS_REGEX.test(address)) {
    return NextResponse.json({ error: 'Invalid SUI address' }, { status: 400 });
  }

  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: `Content must be 1-${MAX_CONTENT_LENGTH} characters` }, { status: 400 });
  }

  // Strip HTML tags for safety (React auto-escapes on render, this is defense-in-depth)
  const sanitized = trimmed.replace(/<[^>]*>?/g, '');

  // Rate limit: 1 comment per address per 10 seconds
  const { data: recent } = await getSupabase()
    .from('comments')
    .select('created_at')
    .eq('address', address)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recent) {
    const elapsed = Date.now() - new Date(recent.created_at).getTime();
    if (elapsed < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Wait ${waitSec}s before commenting again.` },
        { status: 429 },
      );
    }
  }

  const { data, error } = await getSupabase()
    .from('comments')
    .insert({ post_id: postId, address, content: sanitized })
    .select('id, post_id, address, content, created_at')
    .single();

  if (error) {
    console.error('Supabase POST error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }

  return NextResponse.json(data as CommentRow, { status: 201 });
}
