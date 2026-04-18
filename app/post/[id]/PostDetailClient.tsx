'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePost } from '@/hooks/usePost';
import { useHasAccess, useNFTForPost, useNFTsForPost } from '@/hooks/useMyNFTs';
import { MintButton } from '@/components/MintButton';
import { ContentViewer } from '@/components/ContentViewer';
import { formatSUI, shortenAddress, timeAgo, explorerObjectUrl } from '@/lib/utils';
import { NETWORK } from '@/config';
import { AddressAvatar } from '@/components/AddressAvatar';
import { useI18n } from '@/i18n/I18nProvider';
import { TransferNFTModal } from '@/components/TransferNFTModal';
import { useMusicPlayer } from '@/components/MusicPlayerProvider';
import { decryptRaw } from '@/lib/seal';
import { importKey, decryptMedia } from '@/lib/media-crypto';
import { downloadFromWalrus } from '@/lib/walrus';
import { useAuth } from '@/auth/useAuth';
import { type NFTData } from '@/hooks/useMyNFTs';

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
  const { address, getSigner } = useAuth();
  const player = useMusicPlayer();

  const isAudioPost = post?.mediaType === 1 && post.mediaBlobId;

  // Decrypt + download + play handler for the bottom bar
  const handleDecryptAndPlay = useCallback(async () => {
    if (!post || !nft || !address || !isAudioPost) return;

    const track = {
      postId, title: post.title, author: post.author,
      nftObjectId: nft.objectId, encryptionKey: post.encryptionKey, mediaBlobId: post.mediaBlobId,
    };

    player.setLoadingTrack(track);

    try {
      const signer = await getSigner();
      const aesKeyBytes = await decryptRaw({
        encryptedData: new Uint8Array(post.encryptionKey),
        nftObjectId: nft.objectId, postObjectId: postId,
        userAddress: address, signer,
      });
      const encryptedAudio = await downloadFromWalrus(post.mediaBlobId);
      const aesKey = await importKey(aesKeyBytes);
      const audioBuffer = await decryptMedia(encryptedAudio, aesKey);
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      player.playTrack(track, blob);
    } catch (err) {
      console.error('Audio playback failed:', err);
      player.setError('Playback failed');
    }
  }, [post, nft, address, isAudioPost, postId, player, getSigner]);

  // Auto-show bottom bar with track info when user owns an audio post
  useEffect(() => {
    if (!post || !nft || !address || !isAudioPost || !hasAccess) return;
    if (player.isPlaying || player.isLoading) return;

    player.setReadyTrack({
      postId, title: post.title, author: post.author,
      nftObjectId: nft.objectId, encryptionKey: post.encryptionKey, mediaBlobId: post.mediaBlobId,
    });
    player.setOnRequestPlay(handleDecryptAndPlay);

    return () => { player.setOnRequestPlay(null); };
  }, [post, nft, address, isAudioPost, hasAccess, postId, player, handleDecryptAndPlay]);

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
    <div className="container post-detail">
      <div className="post-detail__header">
        <AddressAvatar address={post.author} size={44} />
        <div className="post-detail__header-info">
          <h1 className="post-detail__title">
            {isAudioPost && (
              <span className="post-detail__media-badge" title="Audio">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 18V5l12-2v13M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                </svg>
              </span>
            )}
            {post.title}
          </h1>
          <div className="post-detail__meta">
            <span>{shortenAddress(post.author)}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            <span>·</span>
            <a
              href={explorerObjectUrl(postId, NETWORK)}
              target="_blank"
              rel="noopener noreferrer"
              className="post-detail__chain-link"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {t('post.viewOnChain')}
            </a>
          </div>
        </div>
      </div>

      <div className="post-detail__stats">
        <div className="post-detail__stat">
          <div className="post-detail__stat-label">{t('post.price')}</div>
          <div className="post-detail__stat-value text-sui">{formatSUI(post.price)} SUI</div>
        </div>
        <div className="post-detail__stat-divider" />
        <div className="post-detail__stat">
          <div className="post-detail__stat-label">{t('post.sold')}</div>
          <div className="post-detail__stat-value text-primary">{post.minted}/{post.maxSupply}</div>
        </div>
        {ownedNfts.length > 0 && (
          <>
            <div className="post-detail__stat-divider" />
            <div className="post-detail__stat">
              <div className="post-detail__stat-label">{t('post.owned')}</div>
              <div className="post-detail__editions">
                {ownedNfts.map((owned) => (
                  <button
                    key={owned.objectId}
                    className="post-detail__edition-badge"
                    onClick={() => setTransferNft(owned)}
                    title={t('wallet.transferTitle')}
                  >
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
              {isAudioPost ? t('post.blurPreviewAudio') : t('post.blurPreview')}
            </p>
          </div>
          <MintButton postId={postId} price={post.price} soldOut={soldOut} />
        </div>
      )}
    </div>
  );
}
