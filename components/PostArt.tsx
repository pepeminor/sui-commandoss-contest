'use client';

// Generative abstract art thumbnail for posts — deterministic from postId

const PALETTES = [
  ['#E8623A', '#F0997B', '#FFCDB2', '#1a0f0a'],
  ['#5DCAA5', '#2A9D8F', '#264653', '#0a1a15'],
  ['#6FBCF0', '#4361EE', '#3A0CA3', '#0a0f1a'],
  ['#E86E8A', '#FF006E', '#8338EC', '#1a0a12'],
  ['#E8C56E', '#F4A261', '#E76F51', '#1a150a'],
  ['#B3ACF0', '#7209B7', '#3F37C9', '#0f0a1a'],
  ['#6EE8B7', '#06D6A0', '#118AB2', '#0a1a14'],
  ['#F0997B', '#E63946', '#A8DADC', '#1a0d0a'],
  ['#FF9F1C', '#FFBF69', '#2EC4B6', '#1a120a'],
  ['#E07A5F', '#3D405B', '#81B29A', '#150d0a'],
] as const;

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function byte(str: string, index: number): number {
  const hex = str.replace(/^0x/, '');
  const pos = (index * 2) % Math.max(hex.length, 2);
  return parseInt(hex.slice(pos, pos + 2) || '7f', 16);
}

interface PostArtProps {
  postId: string;
  size?: number;
  className?: string;
}

export function PostArt({ postId, size = 200, className }: PostArtProps) {
  const h = hash(postId);
  const palette = PALETTES[h % PALETTES.length];
  const pattern = h % 7;
  const r = size * 0.12;
  const cx = size / 2;
  const cy = size / 2;
  const b = (i: number) => byte(postId, i);
  const uid = `post-art-${h}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <rect width={size} height={size} rx={r} ry={r} />
        </clipPath>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette[3]} />
          <stop offset="100%" stopColor={palette[0]} stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`${uid}-fg`} x1={b(0) % 2 ? '0' : '1'} y1="0" x2={b(1) % 2 ? '1' : '0'} y2="1">
          <stop offset="0%" stopColor={palette[0]} />
          <stop offset="100%" stopColor={palette[1]} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor={palette[2]} stopOpacity="0.4" />
          <stop offset="100%" stopColor={palette[0]} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        {/* Dark base */}
        <rect width={size} height={size} fill={`url(#${uid}-bg)`} />

        {pattern === 0 && (
          /* Waves */
          <>
            {Array.from({ length: 6 }, (_, i) => {
              const y = size * 0.15 + i * size * 0.14;
              const amp = 10 + b(i) % 20;
              return (
                <path
                  key={i}
                  d={`M 0 ${y} Q ${size * 0.25} ${y - amp} ${size * 0.5} ${y} Q ${size * 0.75} ${y + amp} ${size} ${y}`}
                  fill="none"
                  stroke={i % 2 === 0 ? palette[0] : palette[1]}
                  strokeWidth={3 + b(i + 6) % 4}
                  opacity={0.5 + (i % 3) * 0.15}
                />
              );
            })}
          </>
        )}

        {pattern === 1 && (
          /* Concentric rings */
          <>
            {Array.from({ length: 5 }, (_, i) => (
              <circle
                key={i}
                cx={cx + b(i) % 30 - 15}
                cy={cy + b(i + 5) % 30 - 15}
                r={size * (0.15 + i * 0.1)}
                fill="none"
                stroke={`url(#${uid}-fg)`}
                strokeWidth={2 + i}
                opacity={0.3 + i * 0.12}
              />
            ))}
            <circle cx={cx} cy={cy} r={size * 0.08} fill={palette[1]} opacity={0.8} />
          </>
        )}

        {pattern === 2 && (
          /* Diagonal bars */
          <>
            {Array.from({ length: 10 }, (_, i) => {
              const offset = (i - 5) * size * 0.18;
              return (
                <line
                  key={i}
                  x1={offset - size * 0.2}
                  y1={0}
                  x2={size + offset - size * 0.2}
                  y2={size}
                  stroke={i % 3 === 0 ? palette[2] : i % 3 === 1 ? palette[0] : palette[1]}
                  strokeWidth={size * 0.05 + b(i) % 8}
                  opacity={0.35 + (b(i) % 4) * 0.1}
                />
              );
            })}
          </>
        )}

        {pattern === 3 && (
          /* Scattered dots */
          <>
            {Array.from({ length: 20 }, (_, i) => (
              <circle
                key={i}
                cx={b(i) % size}
                cy={b(i + 20) % size}
                r={4 + b(i + 10) % 16}
                fill={i % 3 === 0 ? palette[0] : i % 3 === 1 ? palette[1] : palette[2]}
                opacity={0.25 + (b(i) % 5) * 0.1}
              />
            ))}
          </>
        )}

        {pattern === 4 && (
          /* Grid mosaic */
          <>
            {Array.from({ length: 25 }, (_, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              const cellSize = size / 5;
              if (b(i) % 4 === 0) return null;
              return (
                <rect
                  key={i}
                  x={col * cellSize + 1}
                  y={row * cellSize + 1}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  rx={4}
                  fill={b(i) % 3 === 0 ? palette[0] : b(i) % 3 === 1 ? palette[1] : palette[2]}
                  opacity={0.2 + (b(i) % 5) * 0.12}
                />
              );
            })}
          </>
        )}

        {pattern === 5 && (
          /* Starburst */
          <>
            {Array.from({ length: 16 }, (_, i) => {
              const angle = (i * 22.5 * Math.PI) / 180;
              const len = size * 0.35 + b(i) % 40;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={cx + Math.cos(angle) * len}
                  y2={cy + Math.sin(angle) * len}
                  stroke={i % 2 === 0 ? palette[0] : palette[1]}
                  strokeWidth={3 + b(i) % 5}
                  opacity={0.4}
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx={cx} cy={cy} r={size * 0.1} fill={palette[2]} opacity={0.6} />
          </>
        )}

        {pattern === 6 && (
          /* Overlapping blobs */
          <>
            {Array.from({ length: 6 }, (_, i) => (
              <ellipse
                key={i}
                cx={b(i) % size}
                cy={b(i + 6) % size}
                rx={size * 0.2 + b(i + 12) % 30}
                ry={size * 0.15 + b(i + 18) % 25}
                fill={i % 3 === 0 ? palette[0] : i % 3 === 1 ? palette[1] : palette[2]}
                opacity={0.25}
                transform={`rotate(${b(i) % 180} ${b(i) % size} ${b(i + 6) % size})`}
              />
            ))}
          </>
        )}

        {/* Glow overlay */}
        <rect width={size} height={size} fill={`url(#${uid}-glow)`} />

        {/* Subtle vignette */}
        <rect width={size} height={size} fill="transparent" stroke={palette[3]} strokeWidth={size * 0.3} strokeOpacity={0.5} />
      </g>
    </svg>
  );
}
