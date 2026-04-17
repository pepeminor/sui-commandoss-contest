'use client';

import Link from 'next/link';
import type { FeedPost } from '@/hooks/useFeed';
import { useHasAccess } from '@/hooks/useMyNFTs';
import { formatSUI, avatarColor, addressInitials, timeAgo } from '@/lib/utils';

interface PostCardProps {
  post: FeedPost;
}

const LOREM_PREVIEW = 'Nội dung được bảo vệ. Mua NFT để đọc toàn bộ nội dung exclusive từ artist này...';

export function PostCard({ post }: PostCardProps) {
  const hasAccess = useHasAccess(post.postId);
  const color = avatarColor(post.author);
  const initials = addressInitials(post.author);

  return (
    <Link
      href={`/post/${post.postId}`}
      className={`post-card${hasAccess ? ' post-card--owned' : ''}`}
    >
      <div className="post-card__inner">
        <div className={`avatar avatar--${color}`}>{initials}</div>

        <div className="post-card__content">
          <div className="post-card__header">
            <div className="post-card__meta">
              <span>{post.author.slice(2, 8)}...</span>
              <span className="post-card__dot" />
              <span>{timeAgo(post.createdAt)}</span>
            </div>

            <span className={`badge badge--${hasAccess ? 'owned' : 'locked'}`}>
              {hasAccess ? '✓ Owned' : '🔒 Locked'}
            </span>
          </div>

          <div className="post-card__title">{post.title}</div>

          <div className={`post-card__preview${hasAccess ? '' : ' post-card__preview--locked'}`}>
            {LOREM_PREVIEW}
          </div>

          <div className="post-card__footer">
            <div className="post-card__price">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              {formatSUI(post.price)} SUI
            </div>

            <span className="post-card__supply">
              {post.maxSupply > 0 ? `${post.maxSupply} max` : '∞'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
