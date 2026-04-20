import type { Metadata } from 'next';
import { Providers } from './providers';
import { MusicPlayer } from '@/components/MusicPlayer';
import 'remixicon/fonts/remixicon.css';
import '@/styles/global.scss';

export const metadata: Metadata = {
  title: 'Verse — Own what you love',
  description: 'Buy NFTs from your favorite creators. Read exclusive content. Support artists directly on-chain.',
  openGraph: {
    title: 'Verse',
    description: 'NFT-gated exclusive content platform on SUI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <MusicPlayer />
        </Providers>
      </body>
    </html>
  );
}
