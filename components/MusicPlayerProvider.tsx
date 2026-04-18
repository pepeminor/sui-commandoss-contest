'use client';

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

export interface Track {
  postId: string;
  title: string;
  author: string;
  nftObjectId: string;
  encryptionKey: number[];
  mediaBlobId: string;
}

interface MusicPlayerState {
  track: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  isReady: boolean;       // track set but not yet loaded/played
  progress: number;
  duration: number;
  currentTime: number;
  error: string | null;
}

interface MusicPlayerActions {
  setReadyTrack: (track: Track) => void;
  setLoadingTrack: (track: Track) => void;
  playTrack: (track: Track, audioBlob: Blob) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  stop: () => void;
  setError: (err: string | null) => void;
  /** Called by MusicPlayer when user presses play on a ready (not yet loaded) track */
  onRequestPlay: (() => Promise<void>) | null;
  setOnRequestPlay: (fn: (() => Promise<void>) | null) => void;
}

type MusicPlayerContextType = MusicPlayerState & MusicPlayerActions;

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer must be inside MusicPlayerProvider');
  return ctx;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MusicPlayerState>({
    track: null,
    isPlaying: false,
    isLoading: false,
    isReady: false,
    progress: 0,
    duration: 0,
    currentTime: 0,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const onRequestPlayRef = useRef<(() => Promise<void>) | null>(null);

  const cleanupBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    cleanupBlobUrl();
    onRequestPlayRef.current = null;
    setState({ track: null, isPlaying: false, isLoading: false, isReady: false, progress: 0, duration: 0, currentTime: 0, error: null });
  }, [cleanupBlobUrl]);

  /** Show bottom bar with track info, but don't load audio yet */
  const setReadyTrack = useCallback((track: Track) => {
    setState((s) => {
      // Don't overwrite if already playing/loading this or another track
      if (s.isPlaying || s.isLoading) return s;
      // Don't re-set if already ready with same track
      if (s.track?.postId === track.postId && s.isReady) return s;
      return { ...s, track, isReady: true, isPlaying: false, isLoading: false, error: null, progress: 0, duration: 0, currentTime: 0 };
    });
  }, []);

  const setLoadingTrack = useCallback((track: Track) => {
    setState((s) => ({ ...s, track, isLoading: true, isReady: false, isPlaying: false, error: null }));
  }, []);

  const setError = useCallback((err: string | null) => {
    setState((s) => ({ ...s, isLoading: false, error: err }));
  }, []);

  const playTrack = useCallback((track: Track, audioBlob: Blob) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    cleanupBlobUrl();

    const url = URL.createObjectURL(audioBlob);
    blobUrlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setState((s) => ({ ...s, duration: audio.duration }));
    });

    audio.addEventListener('timeupdate', () => {
      const ct = audio.currentTime;
      const dur = audio.duration || 1;
      setState((s) => ({ ...s, currentTime: ct, progress: ct / dur }));
    });

    audio.addEventListener('ended', () => {
      setState((s) => ({ ...s, isPlaying: false, progress: 1 }));
    });

    audio.addEventListener('error', () => {
      setState((s) => ({ ...s, isPlaying: false, error: 'Playback error' }));
    });

    audio.play();
    setState((s) => ({ ...s, track, isPlaying: true, isLoading: false, isReady: false, error: null }));
  }, [cleanupBlobUrl]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
    setState((s) => ({ ...s, isPlaying: true }));
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setOnRequestPlay = useCallback((fn: (() => Promise<void>) | null) => {
    onRequestPlayRef.current = fn;
  }, []);

  useEffect(() => {
    return () => {
      cleanupBlobUrl();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [cleanupBlobUrl]);

  return (
    <MusicPlayerContext.Provider value={{
      ...state,
      setReadyTrack, setLoadingTrack, playTrack,
      pause, resume, seek, stop, setError,
      onRequestPlay: onRequestPlayRef.current,
      setOnRequestPlay,
    }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
