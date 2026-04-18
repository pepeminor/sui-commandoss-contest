'use client';

import Link from 'next/link';
import type { FeedPost } from '@/hooks/useFeed';
import { useHasAccess } from '@/hooks/useMyNFTs';
import { formatSUI, shortenAddress, timeAgo, explorerObjectUrl } from '@/lib/utils';
import { NETWORK } from '@/config';
import { AddressAvatar } from './AddressAvatar';
import { useI18n } from '@/i18n/I18nProvider';

interface PostCardProps {
  post: FeedPost;
}

export function PostCard({ post }: PostCardProps) {
  const hasAccess = useHasAccess(post.postId);
  const { t } = useI18n();

  return (
    <Link
      href={`/post/${post.postId}`}
      className={`post-card${hasAccess ? ' post-card--owned' : ''}`}
    >
      <div className="post-card__inner">
        <AddressAvatar address={post.author} size={38} />

        <div className="post-card__content">
          <div className="post-card__header">
            <div className="post-card__meta">
              <span>{shortenAddress(post.author)}</span>
              <span className="post-card__dot" />
              <span>{timeAgo(post.createdAt)}</span>
            </div>

            <span className={`badge badge--${hasAccess ? 'owned' : 'locked'}`}>
              {hasAccess ? `✓ ${t('post.owned')}` : `🔒 ${t('post.locked')}`}
            </span>
          </div>

          <div className="post-card__title">
            {post.mediaType === 1 ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent" style={{ flexShrink: 0, marginRight: 4, verticalAlign: 'middle', display: 'inline' }}>
                <path d="M9 18V5l12-2v13M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary" style={{ flexShrink: 0, marginRight: 4, verticalAlign: 'middle', display: 'inline' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            )}
            {post.title}
          </div>

          <div className={`post-card__preview${hasAccess ? '' : ' post-card__preview--locked'}`}>
            {t('post.preview')}
          </div>

          <div className="post-card__footer">
            <div className="post-card__price">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              {formatSUI(post.price)} SUI
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a
                href={explorerObjectUrl(post.postId, NETWORK)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="post-card__explorer"
                title={t('post.viewOnChain')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <span className="post-card__supply">
                {post.maxSupply > 0 ? `${post.maxSupply} max` : '∞'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
