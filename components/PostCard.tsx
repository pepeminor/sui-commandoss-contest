'use client';

import Link from 'next/link';
import type { FeedPost } from '@/hooks/useFeed';
import { useHasAccess } from '@/hooks/useMyNFTs';
import { formatSUI, shortenAddress, timeAgo } from '@/lib/utils';
import { PostArt } from './PostArt';
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
      <div className="post-card__art">
        <PostArt postId={post.postId} />
        {hasAccess && (
          <span className="post-card__owned-dot" title={t('post.owned')} />
        )}
      </div>

      <div className="post-card__body">
        <div className="post-card__title">{post.title}</div>
        <div className="post-card__author">{shortenAddress(post.author)}</div>
        <div className="post-card__row">
          <span className="post-card__price">
            {formatSUI(post.price)} SUI
          </span>
          <span className="post-card__meta">
            {timeAgo(post.createdAt)}
            {post.maxSupply > 0 && <> &middot; {post.maxSupply} max</>}
          </span>
        </div>
      </div>
    </Link>
  );
}
