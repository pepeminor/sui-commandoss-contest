'use client';

import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/PostCard';
import { PACKAGE_ID } from '@/config';
import { useI18n } from '@/i18n/I18nProvider';

export function FeedClient() {
  const { data: posts, isLoading, isError } = useFeed();
  const { t } = useI18n();

  if (!PACKAGE_ID) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="empty-state">
          <div className="empty-state__icon">🚀</div>
          <div className="empty-state__title">{t('feed.noContract')}</div>
          <p className="empty-state__desc">{t('feed.noContractDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
      <div className="page-header">
        <h1 className="page-header__title">{t('feed.title')}</h1>
        <p className="page-header__sub">{t('feed.subtitle')}</p>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="loading-skeleton" style={{ height: 120, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {isError && (
        <div className="empty-state">
          <div className="empty-state__title">{t('feed.error')}</div>
          <p className="empty-state__desc">{t('feed.errorDesc')}</p>
        </div>
      )}

      {!isLoading && !isError && posts?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">✍️</div>
          <div className="empty-state__title">{t('feed.empty')}</div>
          <p className="empty-state__desc">{t('feed.emptyDesc')}</p>
        </div>
      )}

      {!isLoading && posts?.map((post) => <PostCard key={post.postId} post={post} />)}
    </div>
  );
}
