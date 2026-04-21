import { FeedClient } from './FeedClient';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verse — Underground Music on Chain',
  description: 'Creators drop exclusive tracks. Fans mint NFTs for permanent access. No middlemen. Just music.',
};

export default function FeedPage() {
  return (
    <div className="page">
      <Navbar />
      <Hero />
      <div id="feed">
        <FeedClient />
      </div>
    </div>
  );
}
