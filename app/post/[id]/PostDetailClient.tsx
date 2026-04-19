'use client';

import { useState } from 'react';
import { usePost } from '@/hooks/usePost';
import { useHasAccess, useNFTForPost, useNFTsForPost } from '@/hooks/useMyNFTs';
import { usePostAudioPlayback } from '@/hooks/usePostAudioPlayback';
import { MintButton } from '@/components/MintButton';
import { ContentViewer } from '@/components/ContentViewer';
import { formatSUI, shortenAddress, timeAgo, explorerObjectUrl } from '@/lib/utils';
import { NETWORK } from '@/config';
import { AddressAvatar } from '@/components/AddressAvatar';
import { useI18n } from '@/i18n/I18nProvider';
import { TransferNFTModal } from '@/components/TransferNFTModal';
import { type NFTData } from '@/hooks/useMyNFTs';
import { CommentsSection } from '@/components/comments/CommentsSection';

interface Props {
  postId: string;
}

export function PostDetailClient({ postId }: Props) {
  const { data: post, isLoading } = usePost(postId);
  const hasAccess = useHasAccess(postId);
  const nft = useNFTForPost(postId);
  const ownedNfts = useNFTsForPost(postId);
  const { t } = useI18n();
  const [transferNft, setTransferNft] = useState<NFTData | null>(null);
  const audio = usePostAudioPlayback({ postId, post, nft, hasAccess });

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="loading-skeleton" style={{ height: 32, width: '60%', marginBottom: 12 }} />
        <div className="loading-skeleton" style={{ height: 16, width: '40%', marginBottom: 24 }} />
        <div className="loading-skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <div className="empty-state__title">{t('post.notFound')}</div>
      </div>
    );
  }

  const soldOut = post.minted >= post.maxSupply;

  return (
    <>
    <div className={`container post-detail${soldOut ? ' post-detail--soldout' : ''}`}>
      {soldOut && (
        <div className="post-detail__soldout-banner">
          <i className="ri-fire-fill" style={{ fontSize: 16 }} />
          <span>{t('post.soldOutBanner')}</span>
          <span className="post-detail__soldout-sub">{t('post.editionsCollected', { minted: post.minted, maxSupply: post.maxSupply })}</span>
        </div>
      )}
      <div className="post-detail__header">
        <AddressAvatar address={post.author} size={44} />
        <div className="post-detail__header-info">
          <h1 className="post-detail__title">
            <span className="post-detail__media-badge" title={audio.isAudioPost ? t('post.mediaAudio') : t('post.mediaText')}>
              {audio.isAudioPost ? (
                <i className="ri-music-2-fill" style={{ fontSize: 14 }} />
              ) : (
                <i className="ri-file-text-line" style={{ fontSize: 14 }} />
              )}
            </span>
            {post.title}
          </h1>
          <div className="post-detail__meta">
            <span>{shortenAddress(post.author)}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            <span>·</span>
            <a href={explorerObjectUrl(postId, NETWORK)} target="_blank" rel="noopener noreferrer" className="post-detail__chain-link">
              <i className="ri-external-link-line" style={{ fontSize: 11 }} />
              {t('post.viewOnChain')}
            </a>
          </div>
        </div>
        {audio.isAudioPost && hasAccess && nft && (
          <button
            className={`post-detail__play-btn${audio.isCurrentTrack && audio.isPlaying ? ' post-detail__play-btn--playing' : ''}`}
            onClick={audio.handlePlayPause}
            disabled={audio.isLoading && audio.isCurrentTrack}
            aria-label={audio.isCurrentTrack && audio.isPlaying ? t('player.pause') : t('player.play')}
          >
            {audio.isLoading && audio.isCurrentTrack ? (
              <div className="post-detail__play-spinner" />
            ) : audio.isCurrentTrack && audio.isPlaying ? (
              <i className="ri-pause-fill" style={{ fontSize: 18 }} />
            ) : (
              <i className="ri-play-fill" style={{ fontSize: 18 }} />
            )}
          </button>
        )}
      </div>

      <div className="post-detail__stats">
        <div className="post-detail__stat">
          <div className="post-detail__stat-label">{t('post.price')}</div>
          <div className="post-detail__stat-value text-sui">{formatSUI(post.price)} SUI</div>
        </div>
        <div className="post-detail__stat-divider" />
        <div className="post-detail__stat">
          <div className="post-detail__stat-label">{t('post.sold')}</div>
          <div className={`post-detail__stat-value ${soldOut ? 'text-accent' : 'text-primary'}`}>{post.minted}/{post.maxSupply}</div>
        </div>
        {ownedNfts.length > 0 && (
          <>
            <div className="post-detail__stat-divider" />
            <div className="post-detail__stat">
              <div className="post-detail__stat-label">{t('post.owned')}</div>
              <div className="post-detail__editions">
                {ownedNfts.map((owned) => (
                  <button key={owned.objectId} className="post-detail__edition-badge" onClick={() => setTransferNft(owned)} title={t('wallet.transferTitle')}>
                    #{owned.edition}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {hasAccess && nft ? (
        <>
          <ContentViewer encryptedContent={post.encryptedContent} nftObjectId={nft.objectId} postObjectId={postId} />
          <TransferNFTModal open={!!transferNft} onClose={() => setTransferNft(null)} nft={transferNft} />
        </>
      ) : (
        <div>
          <div className="post-detail__blur-preview">
            <p className="post-detail__blur-text">
              {audio.isAudioPost ? t('post.blurPreviewAudio') : t('post.blurPreview')}
            </p>
          </div>
          <MintButton postId={postId} price={post.price} soldOut={soldOut} />
        </div>
      )}

    </div>

    <CommentsSection postId={postId} />
  </>
  );
}
