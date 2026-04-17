import { FeedClient } from './FeedClient';
import { Navbar } from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verse — Content belongs to creators',
  description: 'Buy NFTs from your favorite creators. Read exclusive content. Support artists directly on-chain.',
};

export default function FeedPage() {
  return (
    <div className="page">
      <Navbar />
      <FeedClient />
    </div>
  );
}
