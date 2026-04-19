'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Signer } from '@mysten/sui/cryptography';
import { useAuth } from '@/auth/useAuth';
import { useMusicPlayer } from '@/components/MusicPlayerProvider';
import { useI18n } from '@/i18n/I18nProvider';
import type { NFTData } from '@/hooks/useMyNFTs';
import type { PostData } from '@/hooks/usePost';
import type { WavHeader } from '@/lib/wav-utils';

interface UsePostAudioPlaybackParams {
  postId: string;
  post: PostData | null | undefined;
  nft: NFTData | undefined;
  hasAccess: boolean;
}

async function readInitialBytes(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  minBytes: number,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (total < minBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    total += value.length;
  }

  if (total === 0) throw new Error('Empty audio data');

  const initial = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    initial.set(chunk, offset);
    offset += chunk.length;
  }
  return initial;
}

export function usePostAudioPlayback({ postId, post, nft, hasAccess }: UsePostAudioPlaybackParams) {
  const { address, getSigner } = useAuth();
  const { t } = useI18n();
  const player = useMusicPlayer();
  const {
    track,
    isPlaying,
    isLoading,
    isReady,
    error,
    pause,
    resume,
    setReadyTrack,
    setOnRequestPlay,
  } = player;

  const isAudioPost = post?.mediaType === 1 && !!post.mediaBlobId;
  const isCurrentTrack = track?.postId === postId;

  const depsRef = useRef({ post, nft, address, postId, getSigner, t });
  const playerRef = useRef(player);
  const playRequestRef = useRef(0);

  useEffect(() => {
    depsRef.current = { post, nft, address, postId, getSigner, t };
    playerRef.current = player;
  });

  const decryptAndPlay = useCallback(async () => {
    const { post, nft, address, postId, getSigner, t } = depsRef.current;
    if (!post || !nft || !address || post.mediaType !== 1 || !post.mediaBlobId) return;

    const track = {
      postId,
      title: post.title,
      author: post.author,
      nftObjectId: nft.objectId,
      encryptionKey: post.encryptionKey,
      mediaBlobId: post.mediaBlobId,
    };

    const requestId = ++playRequestRef.current;
    const isActiveRequest = () => (
      playRequestRef.current === requestId &&
      playerRef.current.track?.postId === postId
    );

    playerRef.current.setLoadingTrack(track);

    try {
      const [{ decryptRaw }, { importKey, decryptMedia }, walrus, chunkedCrypto, wavUtils, audioUtils] = await Promise.all([
        import('@/lib/seal'),
        import('@/lib/media-crypto'),
        import('@/lib/walrus'),
        import('@/lib/chunked-crypto'),
        import('@/lib/wav-utils'),
        import('@/lib/audio-utils'),
      ]);

      const signer: Signer = await getSigner();
      const [aesKeyBytes, walrusResponse] = await Promise.all([
        decryptRaw({
          encryptedData: new Uint8Array(post.encryptionKey),
          nftObjectId: nft.objectId,
          postObjectId: postId,
          userAddress: address,
          signer,
        }),
        walrus.fetchWalrusStream(post.mediaBlobId),
      ]);

      const aesKey = await importKey(aesKeyBytes);
      const reader = walrusResponse.body?.getReader();

      if (!reader) {
        const encryptedAudio = await walrus.downloadFromWalrus(post.mediaBlobId);
        if (!isActiveRequest()) return;

        if (chunkedCrypto.isChunkedFormat(encryptedAudio)) {
          const decrypted = await chunkedCrypto.decryptChunkedFull(encryptedAudio, aesKey);
          const hdr = wavUtils.parseWavHeader(decrypted);
          const blob = hdr
            ? wavUtils.buildWavBlob(hdr, decrypted.subarray(hdr.dataOffset))
            : audioUtils.createAudioBlob(decrypted);
          playerRef.current.playTrack(track, blob);
          return;
        }

        const audioBuffer = await decryptMedia(encryptedAudio, aesKey);
        playerRef.current.playTrack(track, audioUtils.createAudioBlob(new Uint8Array(audioBuffer)));
        return;
      }

      const firstBytes = await readInitialBytes(reader, 12);

      if (!chunkedCrypto.isChunkedFormat(firstBytes)) {
        const chunks: Uint8Array[] = [firstBytes];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }

        const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const encryptedAudio = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          encryptedAudio.set(chunk, offset);
          offset += chunk.length;
        }

        const audioBuffer = await decryptMedia(encryptedAudio, aesKey);
        if (!isActiveRequest()) return;
        playerRef.current.playTrack(track, audioUtils.createAudioBlob(new Uint8Array(audioBuffer)));
        return;
      }

      let sentFirst = false;
      const prependedReader = {
        read: async () => {
          if (!sentFirst) {
            sentFirst = true;
            return { done: false, value: firstBytes };
          }
          return reader.read();
        },
        releaseLock: () => reader.releaseLock(),
        cancel: (reason?: unknown) => reader.cancel(reason),
        closed: reader.closed,
      } as ReadableStreamDefaultReader<Uint8Array>;

      const contentLength = parseInt(walrusResponse.headers.get('content-length') || '0', 10);
      const state = { started: false, header: null as WavHeader | null };
      const playThreshold = 20 * 176 * 1024;

      const fullData = await chunkedCrypto.decryptChunkedStream(
        prependedReader,
        contentLength,
        aesKey,
        (output, decrypted) => {
          if (state.started || decrypted < playThreshold) return;

          state.header ??= wavUtils.parseWavHeader(output);
          if (!state.header) return;

          const pcm = output.subarray(state.header.dataOffset, decrypted);
          const aligned = pcm.length - (pcm.length % state.header.blockAlign);
          if (aligned <= 0 || !isActiveRequest()) return;

          playerRef.current.playTrack(track, wavUtils.buildWavBlob(state.header, pcm.subarray(0, aligned)));
          state.started = true;
        },
      );

      if (!isActiveRequest()) return;

      const hdr = state.header ?? wavUtils.parseWavHeader(fullData);
      if (!hdr) {
        if (!state.started) {
          playerRef.current.playTrack(track, audioUtils.createAudioBlob(fullData));
        }
        return;
      }

      const finalBlob = wavUtils.buildWavBlob(hdr, fullData.subarray(hdr.dataOffset));
      if (state.started) {
        playerRef.current.replaceAudioBlob(finalBlob);
      } else {
        playerRef.current.playTrack(track, finalBlob);
      }
    } catch (err) {
      console.error('Audio playback failed:', err);
      if (isActiveRequest()) playerRef.current.setError(t('player.error'));
    }
  }, []);

  useEffect(() => {
    if (!post || !nft || !address || !isAudioPost || !hasAccess) return;
    if (isPlaying || isLoading) return;

    setReadyTrack({
      postId,
      title: post.title,
      author: post.author,
      nftObjectId: nft.objectId,
      encryptionKey: post.encryptionKey,
      mediaBlobId: post.mediaBlobId,
    });
    setOnRequestPlay(decryptAndPlay);
  }, [post, nft, address, isAudioPost, hasAccess, isPlaying, isLoading, setReadyTrack, setOnRequestPlay, postId, decryptAndPlay]);

  const handlePlayPause = useCallback(() => {
    if (isCurrentTrack && isPlaying) {
      pause();
    } else if (isCurrentTrack && !isReady && !isLoading && !error) {
      resume();
    } else {
      void decryptAndPlay();
    }
  }, [decryptAndPlay, error, isCurrentTrack, isLoading, isPlaying, isReady, pause, resume]);

  return {
    isAudioPost,
    isCurrentTrack,
    isPlaying,
    isLoading,
    handlePlayPause,
  };
}
