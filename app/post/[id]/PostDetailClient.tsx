'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
import { useAuth } from '@/auth/useAuth';
import { type NFTData } from '@/hooks/useMyNFTs';
import { CommentsSection } from '@/components/comments/CommentsSection';
import type { WavHeader } from '@/lib/wav-utils';

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
  const isCurrentTrack = player.track?.postId === postId;

  // Stable ref for decrypt handler to avoid effect re-runs
  const decryptDepsRef = useRef({ post, nft, address, postId, getSigner });
  decryptDepsRef.current = { post, nft, address, postId, getSigner };

  const handleDecryptAndPlay = useCallback(async () => {
    const { post, nft, address, postId, getSigner } = decryptDepsRef.current;
    if (!post || !nft || !address || post.mediaType !== 1 || !post.mediaBlobId) return;

    const track = {
      postId, title: post.title, author: post.author,
      nftObjectId: nft.objectId, encryptionKey: post.encryptionKey, mediaBlobId: post.mediaBlobId,
    };

    player.setLoadingTrack(track);

    try {
      const [{ decryptRaw }, { importKey, decryptMedia }, walrusModule, chunkedCrypto, wavUtils] = await Promise.all([
        import('@/lib/seal'),
        import('@/lib/media-crypto'),
        import('@/lib/walrus'),
        import('@/lib/chunked-crypto'),
        import('@/lib/wav-utils'),
      ]);

      const signer = await getSigner();

      // Seal decrypt + Walrus streaming fetch in parallel
      const [aesKeyBytes, walrusResponse] = await Promise.all([
        decryptRaw({
          encryptedData: new Uint8Array(post.encryptionKey),
          nftObjectId: nft.objectId, postObjectId: postId,
          userAddress: address, signer,
        }),
        walrusModule.fetchWalrusStream(post.mediaBlobId),
      ]);

      const aesKey = await importKey(aesKeyBytes);
      const reader = walrusResponse.body?.getReader();

      if (reader) {
        // Read first bytes to detect format
        const first = await reader.read();
        if (first.done || !first.value) throw new Error('Empty audio data');

        if (chunkedCrypto.isChunkedFormat(first.value)) {
          // ─── STREAMING PLAYBACK (chunked format) ────────────────────────
          // Re-wrap reader so decryptChunkedStream sees the bytes we already consumed
          let sentFirst = false;
          const prependedReader: ReadableStreamDefaultReader<Uint8Array> = {
            read: async () => {
              if (!sentFirst) { sentFirst = true; return { done: false, value: first.value! }; }
              return reader.read();
            },
            releaseLock: () => reader.releaseLock(),
            cancel: (r?: any) => reader.cancel(r),
            closed: reader.closed,
          } as ReadableStreamDefaultReader<Uint8Array>;

          const contentLength = parseInt(walrusResponse.headers.get('content-length') || '0', 10);
          const state = { started: false, header: null as WavHeader | null };
          // Buffer ~20 seconds of CD-quality WAV (176KB/s) before starting
          const PLAY_THRESHOLD = 20 * 176 * 1024; // ~3.5MB

          const fullData = await chunkedCrypto.decryptChunkedStream(
            prependedReader,
            contentLength,
            aesKey,
            (output, decrypted) => {
              if (!state.started && decrypted >= PLAY_THRESHOLD) {
                if (!state.header) state.header = wavUtils.parseWavHeader(output);
                if (state.header) {
                  const pcm = output.subarray(state.header.dataOffset, decrypted);
                  const aligned = pcm.length - (pcm.length % state.header.blockAlign);
                  if (aligned > 0) {
                    const partialBlob = wavUtils.buildWavBlob(state.header, pcm.subarray(0, aligned));
                    player.playTrack(track, partialBlob);
                    state.started = true;
                  }
                }
              }
            },
          );

          // Download complete → swap to full audio (preserves currentTime)
          const hdr = state.header ?? wavUtils.parseWavHeader(fullData);
          if (hdr) {
            const pcm = fullData.subarray(hdr.dataOffset);
            const finalBlob = wavUtils.buildWavBlob(hdr, pcm);
            if (state.started) {
              player.replaceAudioBlob(finalBlob);
            } else {
              player.playTrack(track, finalBlob);
            }
          } else {
            const blob = new Blob([fullData.slice().buffer as ArrayBuffer], { type: 'audio/wav' });
            if (!state.started) player.playTrack(track, blob);
          }

        } else {
          // ─── LEGACY PLAYBACK (single-block AES-GCM) ─────────────────────
          const chunks: Uint8Array[] = [first.value];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
          const total = chunks.reduce((s, c) => s + c.length, 0);
          const encryptedAudio = new Uint8Array(total);
          let off = 0;
          for (const c of chunks) { encryptedAudio.set(c, off); off += c.length; }

          const audioBuffer = await decryptMedia(encryptedAudio, aesKey);
          const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          player.playTrack(track, blob);
        }
      } else {
        // No streaming support — full download fallback
        const encryptedAudio = await walrusModule.downloadFromWalrus(post.mediaBlobId);

        if (chunkedCrypto.isChunkedFormat(encryptedAudio)) {
          const decrypted = await chunkedCrypto.decryptChunkedFull(encryptedAudio, aesKey);
          const blob = new Blob([decrypted.slice().buffer as ArrayBuffer], { type: 'audio/wav' });
          player.playTrack(track, blob);
        } else {
          const audioBuffer = await decryptMedia(encryptedAudio, aesKey);
          const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          player.playTrack(track, blob);
        }
      }
    } catch (err) {
      console.error('Audio playback failed:', err);
      player.setError('Playback failed');
    }
  }, [player]);

  // Auto-show bottom bar when user owns an audio post
  useEffect(() => {
    if (!post || !nft || !address || !isAudioPost || !hasAccess) return;
    if (player.isPlaying || player.isLoading) return;

    player.setReadyTrack({
      postId, title: post.title, author: post.author,
      nftObjectId: nft.objectId, encryptionKey: post.encryptionKey, mediaBlobId: post.mediaBlobId,
    });
    player.setOnRequestPlay(handleDecryptAndPlay);
  }, [post?.objectId, nft?.objectId, address, isAudioPost, hasAccess]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <span>SOLD OUT</span>
          <span className="post-detail__soldout-sub">{post.minted}/{post.maxSupply} editions collected</span>
        </div>
      )}
      <div className="post-detail__header">
        <AddressAvatar address={post.author} size={44} />
        <div className="post-detail__header-info">
          <h1 className="post-detail__title">
            <span className="post-detail__media-badge" title={isAudioPost ? 'Audio' : 'Text'}>
              {isAudioPost ? (
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
        {isAudioPost && hasAccess && nft && (
          <button
            className={`post-detail__play-btn${isCurrentTrack && player.isPlaying ? ' post-detail__play-btn--playing' : ''}`}
            onClick={() => {
              if (isCurrentTrack && player.isPlaying) {
                player.pause();
              } else {
                handleDecryptAndPlay();
              }
            }}
            disabled={player.isLoading && isCurrentTrack}
            aria-label={isCurrentTrack && player.isPlaying ? 'Pause' : 'Play'}
          >
            {player.isLoading && isCurrentTrack ? (
              <div className="post-detail__play-spinner" />
            ) : isCurrentTrack && player.isPlaying ? (
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
              {isAudioPost ? t('post.blurPreviewAudio') : t('post.blurPreview')}
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
