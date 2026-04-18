'use client';

interface AddressAvatarProps {
  address: string;
  size?: number;
  className?: string;
}

const PALETTE = [
  '#E8623A', '#5DCAA5', '#F0997B', '#ED93B1',
  '#6FBCF0', '#B3ACF0', '#E8C56E', '#6EE8B7',
  '#E86E8A', '#6EB4E8', '#C56EE8', '#E8A86E',
] as const;

/** Hash a string to a 32-bit unsigned integer */
function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Get a deterministic byte (0-255) from address hex at a given index */
function getByte(address: string, index: number): number {
  const hex = address.replace(/^0x/, '');
  const pos = (index * 2) % hex.length;
  return parseInt(hex.slice(pos, pos + 2) || '00', 16);
}

/** Generate a 5x5 symmetric grid from address bytes */
function generateGrid(address: string): boolean[] {
  const grid: boolean[] = [];
  for (let row = 0; row < 5; row++) {
    const cells: boolean[] = [];
    for (let col = 0; col < 3; col++) {
      cells.push(getByte(address, row * 3 + col) > 127);
    }
    // Mirror: col0 col1 col2 col1 col0
    grid.push(cells[0], cells[1], cells[2], cells[1], cells[0]);
  }
  return grid;
}

export function AddressAvatar({ address, size = 38, className }: AddressAvatarProps) {
  const hash = hashCode(address);
  const fg = PALETTE[hash % PALETTE.length];
  const bg = PALETTE[(hash * 7 + 3) % PALETTE.length];
  const grid = generateGrid(address);
  const cellSize = size / 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`Avatar for ${address.slice(0, 10)}`}
      style={{ flexShrink: 0, borderRadius: '50%', overflow: 'hidden' }}
    >
      <rect width={size} height={size} fill={bg} opacity={0.2} />
      {grid.map((filled, i) => {
        if (!filled) return null;
        const row = Math.floor(i / 5);
        const col = i % 5;
        return (
          <rect
            key={i}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={fg}
            opacity={0.8}
          />
        );
      })}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 0.5}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
      />
    </svg>
  );
}
