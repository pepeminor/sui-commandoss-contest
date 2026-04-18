'use client';

import { useState, useMemo } from 'react';
import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/PostCard';
import { ArtistCarousel } from '@/components/ArtistCarousel';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/Skeleton';
import { PACKAGE_ID } from '@/config';
import { useI18n } from '@/i18n/I18nProvider';

export function FeedClient() {
  const { data: posts, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useFeed();
  const { t } = useI18n();
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Extract unique artists with post count
  const artists = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      map.set(post.author, (map.get(post.author) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([address, postCount]) => ({ address, postCount }))
      .sort((a, b) => b.postCount - a.postCount);
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
