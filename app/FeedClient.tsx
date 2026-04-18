'use client';

import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/PostCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/Skeleton';
import { PACKAGE_ID } from '@/config';
import { useI18n } from '@/i18n/I18nProvider';

export function FeedClient() {
  const { data: posts, isLoading, isError } = useFeed();
  const { t } = useI18n();

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

      {!isLoading && !isError && posts?.length === 0 && (
        <EmptyState icon="✍️" title={t('feed.empty')} desc={t('feed.emptyDesc')} />
      )}

      {!isLoading && posts?.map((post) => <PostCard key={post.postId} post={post} />)}
    </div>
  );
}
