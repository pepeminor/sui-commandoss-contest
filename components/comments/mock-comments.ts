export interface MockComment {
  id: string;
  address: string;
  text: string;
  timeAgo: string;
}

const COMMENT_POOL: Omit<MockComment, 'id' | 'address'>[] = [
  // Hype
  { text: 'This track is absolutely insane', timeAgo: '2h' },
  { text: 'Certified banger. On repeat all day', timeAgo: '4h' },
  { text: 'Best thing I\'ve heard on-chain', timeAgo: '6h' },
  { text: 'The vibe on this one is unreal', timeAgo: '1h' },
  { text: 'This goes so hard', timeAgo: '3h' },
  { text: 'Instant classic right here', timeAgo: '8h' },
  { text: 'Wow. Just wow.', timeAgo: '5h' },

  // Scarcity / FOMO
  { text: 'Got mine before it sells out', timeAgo: '12h' },
  { text: 'Only a few editions left, don\'t sleep on this', timeAgo: '1d' },
  { text: 'Minted early and no regrets', timeAgo: '2d' },
  { text: 'This is going to sell out fast', timeAgo: '7h' },
  { text: 'Grabbed edition #2. Feeling lucky', timeAgo: '3d' },

  // Quality appreciation
  { text: 'The production quality is next level', timeAgo: '1d' },
  { text: 'Been replaying this all day. Can\'t stop', timeAgo: '9h' },
  { text: 'This is why I\'m into on-chain music', timeAgo: '2d' },
  { text: 'Sound design is chef\'s kiss', timeAgo: '16h' },
  { text: 'Every detail in this track matters', timeAgo: '1d' },
  { text: 'The arrangement is beautiful', timeAgo: '5h' },

  // Collector flex
  { text: 'One of my favorite NFTs in my collection', timeAgo: '3d' },
  { text: 'Glad I minted when I did', timeAgo: '4d' },
  { text: 'This will be worth 10x, easy', timeAgo: '2d' },
  { text: 'First mint on this platform and I\'m hooked', timeAgo: '1d' },
  { text: 'Supporting artists directly. Love it', timeAgo: '6h' },

  // Community
  { text: 'Need more from this artist ASAP', timeAgo: '10h' },
  { text: 'Drop more please', timeAgo: '14h' },
  { text: 'Shared this with everyone I know', timeAgo: '1d' },
  { text: 'The future of music is on-chain', timeAgo: '3d' },
  { text: 'This platform is a game changer', timeAgo: '2d' },
  { text: 'Can we get a collab next?', timeAgo: '8h' },

  // Short reactions
  { text: 'Incredible work', timeAgo: '30m' },
  { text: 'Masterpiece', timeAgo: '45m' },
  { text: 'Pure fire', timeAgo: '20m' },
  { text: 'Obsessed with this', timeAgo: '1h' },
];

const FAKE_ADDRESSES = [
  '0xfa1e7a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
  '0xfa2e8b3c4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
  '0xfa3d9c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
  '0xfa4e0d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
  '0xfa5f1e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
  '0xfa6a2f7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f',
  '0xfa7b3a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a',
  '0xfa8c4b9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
  '0xfa9d5c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
  '0xfaae6d1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getSeededComments(postId: string, count = 6): MockComment[] {
  const hash = hashCode(postId);
  const pool = [...COMMENT_POOL];

  // Fisher-Yates shuffle with deterministic seed
  let seed = hash;
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (seed * 16807 + 12345) >>> 0;
    const j = seed % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count).map((comment, i) => ({
    ...comment,
    id: `seed-${hash}-${i}`,
    address: FAKE_ADDRESSES[(hash + i) % FAKE_ADDRESSES.length],
  }));
}
