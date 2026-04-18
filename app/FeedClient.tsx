'use client';

import { useState, useMemo } from 'react';
import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/PostCard';
import { ArtistCarousel, type Artist } from '@/components/ArtistCarousel';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/Skeleton';
import { PACKAGE_ID } from '@/config';
import { useI18n } from '@/i18n/I18nProvider';

export function FeedClient() {
  const { data: posts, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useFeed();
  const { t } = useI18n();
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Extract real artists from feed + merge with fake showcase artists
  const artists = useMemo(() => {
    // Real artists from posts
    const map = new Map<string, Artist>();
    for (const post of posts) {
      const existing = map.get(post.author);
      map.set(post.author, {
        address: post.author,
        postCount: (existing?.postCount ?? 0) + 1,
      });
    }
    const real = Array.from(map.values()).sort((a, b) => b.postCount - a.postCount);

    // Fake showcase artists (placeholder until BE)
    const fakeArtists: Artist[] = [
      { address: '0xf1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', name: 'Skyler', postCount: 12 },
      { address: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0', name: 'Mr Nhan', postCount: 8 },
      { address: '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1', name: 'Scroll', postCount: 15 },
      { address: '0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2', name: 'Winno', postCount: 6 },
      { address: '0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', name: 'Heily', postCount: 9 },
      { address: '0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4', name: '2Can', postCount: 11 },
      { address: '0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5', name: 'YoungGun', postCount: 7 },
      { address: '0xa7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6', name: 'MC12', postCount: 14 },
      { address: '0xb8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7', name: 'ACY', postCount: 5 },
      { address: '0xc9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8', name: 'Torai9', postCount: 10 },
      { address: '0xd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9', name: 'SOL7', postCount: 13 },
    ];

    // Real artists first, then fakes (skip fakes whose address matches a real one)
    const realAddrs = new Set(real.map((a) => a.address));
    const fakes = fakeArtists.filter((f) => !realAddrs.has(f.address));
    return [...real, ...fakes];
  }, [posts]);

  const filteredPosts = selectedArtist
    ? posts.filter((p) => p.author === selectedArtist)
    : posts;

  if (!PACKAGE_ID) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <EmptyState icon="🚀" title={t('feed.noContract')} desc={t('feed.noContractDesc')} />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
      <div className="page-header">
        <h1 className="page-header__title">{t('feed.title')}</h1>
        <p className="page-header__sub">{t('feed.subtitle')}</p>
      </div>

      {isLoading && <SkeletonList count={3} height={120} />}

      {isError && <EmptyState title={t('feed.error')} desc={t('feed.errorDesc')} />}

      {!isLoading && !isError && filteredPosts.length === 0 && (
        <EmptyState icon="✍️" title={t('feed.empty')} desc={t('feed.emptyDesc')} />
      )}

      {!isLoading && filteredPosts.map((post) => <PostCard key={post.postId} post={post} />)}

      {hasNextPage && !selectedArtist && (
        <div className="load-more">
          <button
            className="btn btn--ghost load-more__btn"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? t('feed.loading') : t('feed.loadMore')}
          </button>
        </div>
      )}

      {isFetchingNextPage && <SkeletonList count={2} height={120} />}

      {/* Artist carousel — bottom */}
      {!isLoading && artists.length > 0 && (
        <ArtistCarousel
          artists={artists}
          selected={selectedArtist}
          onSelect={setSelectedArtist}
        />
      )}
    </div>
  );
}
