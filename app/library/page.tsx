'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useMyNFTs } from '@/hooks/useMyNFTs';
import { useAuth } from '@/auth/useAuth';
import { timeAgo } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { useIsClient } from '@/hooks/useIsClient';

export default function LibraryPage() {
  const { isLoggedIn, login } = useAuth();
  const { data: nfts, isLoading } = useMyNFTs();
  const { t } = useI18n();
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div className="loading-skeleton" style={{ height: 200, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <h2 style={{ marginBottom: 8 }}>{t('library.loginRequired')}</h2>
          <p className="text-muted" style={{ marginBottom: 20, fontSize: 14 }}>
            {t('library.loginDesc')}
          </p>
          <button className="btn btn--primary" onClick={login}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <div className="page-header__title">{t('library.title')}</div>
          <p className="page-header__sub">
            {t('library.subtitle', { count: nfts?.length ?? 0 })}
          </p>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="loading-skeleton" style={{ height: 80, borderRadius: 14 }} />
            ))}
          </div>
        )}

        {!isLoading && nfts?.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">📖</div>
            <div className="empty-state__title">{t('library.empty')}</div>
            <p className="empty-state__desc">
              <Link href="/" className="text-accent">{t('library.emptyDesc')}</Link>
            </p>
          </div>
        )}

        {!isLoading &&
          nfts?.map((nft) => (
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
      </div>
    </div>
  );
}
