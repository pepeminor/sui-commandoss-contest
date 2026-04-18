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

/** Parse any timestamp (epoch ms number, numeric string, or ISO string) to ms */
function parseTimestamp(ms: number | string): number {
  if (typeof ms === 'number') return ms;
  const num = Number(ms);
  if (!isNaN(num)) return num;
  return new Date(ms).getTime();
}

/** Format timestamp to relative time */
export function timeAgo(ms: number | string): string {
  const t = parseTimestamp(ms);
  const diff = Date.now() - t;
  if (isNaN(diff) || diff < 0) return 'just now';
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/** Build a SuiScan explorer URL for an object */
export function explorerObjectUrl(objectId: string, network: string = 'testnet'): string {
  return `https://suiscan.xyz/${network}/object/${objectId}`;
}

/** Hash a string to a 32-bit unsigned integer (deterministic) */
export function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Get a deterministic byte (0-255) from a hex address at a given index */
export function getByte(address: string, index: number): number {
  const hex = address.replace(/^0x/, '');
  const pos = (index * 2) % hex.length;
  return parseInt(hex.slice(pos, pos + 2) || '00', 16);
}
