import { PostDetailClient } from './PostDetailClient';
import { Navbar } from '@/components/Navbar';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await params;
  return { title: `Verse — Post` };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="page">
      <Navbar />
      <PostDetailClient postId={id} />
    </div>
  );
}
