'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AuthGuard } from '@/components/AuthGuard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/Skeleton';
import { useMyPosts, type MyPost } from '@/hooks/useMyPosts';
import { formatSUI, timeAgo } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';

type SortKey = 'newest' | 'mostSold' | 'revenue';

function DashboardContent() {
  const { data: posts, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useMyPosts();
  const { t } = useI18n();
  const [sort, setSort] = useState<SortKey>('newest');

  const sorted = useMemo(() => {
    const list = [...posts];
    switch (sort) {
      case 'mostSold':
        return list.sort((a, b) => b.minted - a.minted);
      case 'revenue':
        return list.sort((a, b) => {
          const ra = BigInt(a.minted) * a.price;
          const rb = BigInt(b.minted) * b.price;
          return ra > rb ? -1 : ra < rb ? 1 : 0;
        });
      default:
        return list; // already newest first from hook
    }
  }, [posts, sort]);

  const totalSold = posts.reduce((sum, p) => sum + p.minted, 0);
  const totalRevenue = posts.reduce((sum, p) => sum + BigInt(p.minted) * p.price, 0n);

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <div className="page-header__title">{t('dashboard.title')}</div>
          <p className="page-header__sub">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-card__value">{posts.length}</div>
            <div className="stat-card__label">{t('dashboard.totalPosts')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value stat-card__value--teal">{totalSold}</div>
            <div className="stat-card__label">{t('dashboard.totalSold')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value stat-card__value--sui">{formatSUI(totalRevenue)}</div>
            <div className="stat-card__label">{t('dashboard.totalRevenue')}</div>
          </div>
        </div>

        {isLoading && <SkeletonList count={3} height={72} />}

        {!isLoading && posts.length === 0 && (
          <EmptyState
            icon="✍️"
            title={t('dashboard.empty')}
            desc={<Link href="/create" className="text-accent">{t('dashboard.emptyDesc')}</Link>}
          />
        )}

        {!isLoading && posts.length > 0 && (
          <>
            {/* Sort */}
            <div className="dashboard-sort">
              {(['newest', 'mostSold', 'revenue'] as const).map((key) => (
                <button
                  key={key}
                  className={`dashboard-sort__btn${sort === key ? ' dashboard-sort__btn--active' : ''}`}
                  onClick={() => setSort(key)}
                >
                  {t(`dashboard.sort${key.charAt(0).toUpperCase() + key.slice(1)}` as any)}
                </button>
              ))}
            </div>

            {/* Post list */}
            {sorted.map((post) => (
              <DashboardPostCard key={post.postId} post={post} />
            ))}
          </>
        )}

        {hasNextPage && (
          <div className="load-more">
            <button
              className="btn btn--ghost load-more__btn"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? t('dashboard.loading') : t('dashboard.loadMore')}
            </button>
          </div>
        )}

        {isFetchingNextPage && <SkeletonList count={2} height={72} />}
      </div>
    </div>
  );
}

function DashboardPostCard({ post }: { post: MyPost }) {
  const { t } = useI18n();
  const revenue = BigInt(post.minted) * post.price;

  return (
    <Link href={`/post/${post.postId}`} className="dashboard-post">
      <div className="dashboard-post__info">
        <div className="dashboard-post__title">{post.title}</div>
        <div className="dashboard-post__meta">
          <span>{formatSUI(post.price)} SUI</span>
          <span className="dashboard-post__meta-dot" />
          <span>{post.minted}/{post.maxSupply} {t('dashboard.sold')}</span>
          <span className="dashboard-post__meta-dot" />
          <span>{timeAgo(post.createdAt)}</span>
        </div>
      </div>
      <div className="dashboard-post__stats">
        <div className="dashboard-post__stat">
          <div className="dashboard-post__stat-value text-sui">{formatSUI(revenue)}</div>
          <div className="dashboard-post__stat-label">{t('dashboard.revenue')}</div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard icon="📊" messageKey="dashboard.loginRequired" descKey="dashboard.loginDesc">
      <DashboardContent />
    </AuthGuard>
  );
}
