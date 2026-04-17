import { FeedClient } from './FeedClient';
import { Navbar } from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verse — Nội dung thuộc về creator',
  description: 'Mua NFT của artist yêu thích, đọc lyrics exclusive, support trực tiếp không qua trung gian.',
};

export default function FeedPage() {
  return (
    <div className="page">
      <Navbar />
      <FeedClient />
    </div>
  );
}
