import type { Metadata } from 'next';
import { Montserrat, Space_Mono } from 'next/font/google';
import { Providers } from './providers';
import { MusicPlayer } from '@/components/MusicPlayer';
import 'remixicon/fonts/remixicon.css';
import '@/styles/global.scss';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Verse — Underground Music on Chain',
  description: 'Creators drop exclusive tracks. Fans mint NFTs for permanent access. No middlemen. No takedowns. Just music.',
  openGraph: {
    title: 'Verse',
    description: 'Underground music platform powered by SUI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${spaceMono.variable}`}>
      <body>
        <Providers>
          {children}
          <MusicPlayer />
        </Providers>
      </body>
    </html>
  );
}
