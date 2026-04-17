/** Convert MIST (bigint) to SUI display string */
export function formatSUI(mist: bigint | number | string | undefined): string {
  if (mist == null) return '0';
  const n = typeof mist === 'string' ? BigInt(mist) : BigInt(mist);
  return (Number(n) / 1e9).toFixed(4).replace(/\.?0+$/, '') || '0';
}

/** Shorten a SUI address: 0x1234...abcd */
export function shortenAddress(addr: string | undefined, chars = 4): string {
  if (!addr) return '';
  return `${addr.slice(0, 2 + chars)}...${addr.slice(-chars)}`;
}

/** Derive an avatar color class (cycles through 4) from a string */
const AVATAR_COLORS = ['purple', 'teal', 'coral', 'pink'] as const;
export function avatarColor(seed: string): (typeof AVATAR_COLORS)[number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Get initials from an address (first 2 chars after 0x) */
export function addressInitials(addr: string): string {
  return addr.slice(2, 4).toUpperCase();
}

/** Format timestamp (ms) to relative time */
export function timeAgo(ms: number | string): string {
  const now = Date.now();
  const diff = now - Number(ms);
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
