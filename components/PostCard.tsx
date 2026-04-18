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
              <i className="ri-music-2-fill text-accent" style={{ fontSize: 14, flexShrink: 0, marginRight: 4 }} />
            ) : (
              <i className="ri-file-text-line text-secondary" style={{ fontSize: 14, flexShrink: 0, marginRight: 4 }} />
            )}
            {post.title}
          </div>

          <div className={`post-card__preview${hasAccess ? '' : ' post-card__preview--locked'}`}>
            {t('post.preview')}
          </div>

          <div className="post-card__footer">
            <div className="post-card__price">
              <i className="ri-coin-line" style={{ fontSize: 12 }} />
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
                <i className="ri-external-link-line" style={{ fontSize: 12 }} />
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
