'use client';

import { useState, useMemo } from 'react';
import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/PostCard';
import { ArtistCarousel, type Artist } from '@/components/ArtistCarousel';
import { FAKE_ARTISTS } from '@/lib/fake-artists';
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

    const realAddrs = new Set(real.map((a) => a.address));
    const fakes = FAKE_ARTISTS.filter((f) => !realAddrs.has(f.address));
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
