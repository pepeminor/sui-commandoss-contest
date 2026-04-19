'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AuthGuard } from '@/components/AuthGuard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/Skeleton';
import { useMyNFTs } from '@/hooks/useMyNFTs';
import { timeAgo } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';

function LibraryContent() {
  const { data: nfts, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useMyNFTs();
  const { t } = useI18n();

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <div className="page-header__title">{t('library.title')}</div>
          <p className="page-header__sub">
            {t('library.subtitle', { count: nfts.length })}
          </p>
        </div>

        {isLoading && <SkeletonList count={3} height={80} />}

        {!isLoading && nfts.length === 0 && (
          <EmptyState
            icon="📖"
            title={t('library.empty')}
            desc={<Link href="/" className="text-accent">{t('library.emptyDesc')}</Link>}
          />
        )}

        {!isLoading &&
          nfts.map((nft) => (
            <Link
              key={nft.objectId}
              href={`/post/${nft.postId}`}
              className="post-card post-card--owned"
              style={{ display: 'block', textDecoration: 'none' }}
            >
              <div className="post-card__inner">
                <div>
                  <div className="post-card__title">{nft.postTitle}</div>
                  <div className="text-muted" style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 12 }}>
                    <span>Edition #{nft.edition}</span>
                    <span>·</span>
                    <span>{timeAgo(nft.mintedAt)}</span>
                  </div>
                </div>
                <span className="badge badge--owned" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  ✓ {t('post.owned')}
                </span>
              </div>
            </Link>
          ))}

        {isFetchingNextPage && <SkeletonList count={2} height={80} />}

        {hasNextPage && (
          <div className="load-more">
            <button
              className="btn btn--ghost load-more__btn"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? t('library.loading') : t('library.loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <AuthGuard icon="📚" messageKey="library.loginRequired" descKey="library.loginDesc">
      <LibraryContent />
    </AuthGuard>
  );
}
