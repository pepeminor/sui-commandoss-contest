'use client';

import { useRef } from 'react';
import { shortenAddress, hashCode, getByte } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';

export interface Artist {
  address: string;
  name?: string;
  postCount: number;
}

interface ArtistCarouselProps {
  artists: Artist[];
  selected: string | null;
  onSelect: (address: string | null) => void;
}

// ─── Deterministic abstract art from address ────────────────────────────────

const COLORS = [
  ['#E8623A', '#F0997B', '#FFCDB2'],
  ['#5DCAA5', '#2A9D8F', '#264653'],
  ['#6FBCF0', '#4361EE', '#3A0CA3'],
  ['#E86E8A', '#FF006E', '#8338EC'],
  ['#E8C56E', '#F4A261', '#E76F51'],
  ['#B3ACF0', '#7209B7', '#3F37C9'],
  ['#6EE8B7', '#06D6A0', '#118AB2'],
  ['#F0997B', '#E63946', '#A8DADC'],
] as const;

function ArtistArt({ address, size }: { address: string; size: number }) {
  const hash = hashCode(address);
  const palette = COLORS[hash % COLORS.length];
  const pattern = hash % 5;
  const r = size * 0.16;

  // Generate deterministic shape params from address bytes
  const b = (i: number) => getByte(address, i);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <defs>
        <clipPath id={`art-clip-${hash}`}>
          <rect width={size} height={size} rx={r} ry={r} />
        </clipPath>
        <linearGradient id={`art-grad-${hash}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette[0]} />
          <stop offset="100%" stopColor={palette[1]} />
        </linearGradient>
        <radialGradient id={`art-radial-${hash}`} cx="0.3" cy="0.3" r="0.8">
          <stop offset="0%" stopColor={palette[2]} stopOpacity="0.6" />
          <stop offset="100%" stopColor={palette[0]} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#art-clip-${hash})`}>
        {/* Background gradient */}
        <rect width={size} height={size} fill={`url(#art-grad-${hash})`} />

        {/* Pattern overlay */}
        {pattern === 0 && (
          // Concentric circles
          <>
            {[0.85, 0.65, 0.45, 0.25].map((s, i) => (
              <circle
                key={i}
                cx={cx + (b(i) % 20 - 10)}
                cy={cy + (b(i + 4) % 20 - 10)}
                r={size * s * 0.5}
                fill="none"
                stroke={palette[2]}
                strokeWidth={size * 0.04}
                opacity={0.4 + i * 0.15}
              />
            ))}
          </>
        )}
        {pattern === 1 && (
          // Diagonal stripes
          <>
            {Array.from({ length: 8 }, (_, i) => {
              const offset = (i - 4) * size * 0.22;
              const w = size * 0.08 + (b(i) % 3) * size * 0.03;
              return (
                <line
                  key={i}
                  x1={offset}
                  y1={0}
                  x2={size + offset}
                  y2={size}
                  stroke={i % 2 === 0 ? palette[2] : palette[0]}
                  strokeWidth={w}
                  opacity={0.5}
                />
              );
            })}
          </>
        )}
        {pattern === 2 && (
          // Starburst
          <>
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const len = size * 0.6 + (b(i) % 30);
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={cx + Math.cos(angle) * len}
                  y2={cy + Math.sin(angle) * len}
                  stroke={palette[2]}
                  strokeWidth={size * 0.06}
                  opacity={0.5}
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx={cx} cy={cy} r={size * 0.15} fill={palette[2]} opacity={0.7} />
          </>
        )}
        {pattern === 3 && (
          // Overlapping circles
          <>
            {Array.from({ length: 5 }, (_, i) => (
              <circle
                key={i}
                cx={b(i) % size}
                cy={b(i + 5) % size}
                r={size * 0.25 + (b(i + 10) % 20)}
                fill={i % 2 === 0 ? palette[2] : palette[0]}
                opacity={0.35}
              />
            ))}
          </>
        )}
        {pattern === 4 && (
          // Grid blocks
          <>
            {Array.from({ length: 16 }, (_, i) => {
              const row = Math.floor(i / 4);
              const col = i % 4;
              if (b(i) % 3 === 0) return null;
              return (
                <rect
                  key={i}
                  x={col * size * 0.25}
                  y={row * size * 0.25}
                  width={size * 0.24}
                  height={size * 0.24}
                  rx={size * 0.04}
                  fill={b(i) % 2 === 0 ? palette[2] : palette[0]}
                  opacity={0.4 + (b(i) % 4) * 0.1}
                />
              );
            })}
          </>
        )}

        {/* Radial highlight */}
        <rect width={size} height={size} fill={`url(#art-radial-${hash})`} />
      </g>
    </svg>
  );
}

// ─── Carousel ───────────────────────────────────────────────────────────────

export function ArtistCarousel({ artists, selected, onSelect }: ArtistCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  if (artists.length === 0) return null;

  return (
    <div className="artist-carousel">
      <div className="artist-carousel__header">
        <h2 className="artist-carousel__title">{t('feed.artists')}</h2>
        {selected && (
          <button className="artist-carousel__clear" onClick={() => onSelect(null)}>
            {t('feed.showAll')}
          </button>
        )}
      </div>

      <div className="artist-carousel__track-wrap">
        <div className="artist-carousel__track" ref={scrollRef}>
          {artists.map((artist) => (
            <button
              key={artist.address}
              className={`artist-card${selected === artist.address ? ' artist-card--active' : ''}`}
              onClick={() => onSelect(selected === artist.address ? null : artist.address)}
            >
              <div className="artist-card__art">
                <ArtistArt address={artist.address} size={200} />
              </div>
              <div className="artist-card__name">{artist.name ?? shortenAddress(artist.address)}</div>
            </button>
          ))}
        </div>

        {artists.length > 3 && (
          <button className="artist-carousel__arrow" onClick={scrollRight} aria-label="Scroll right">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
