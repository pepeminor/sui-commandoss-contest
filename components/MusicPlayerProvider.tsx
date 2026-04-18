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
  progress: number;      // 0-1
  duration: number;       // seconds
  currentTime: number;    // seconds
  error: string | null;
}

interface MusicPlayerActions {
  playTrack: (track: Track, audioBlob: Blob) => void;
  loadAndPlay: (track: Track) => void;
  setLoadingTrack: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  stop: () => void;
  setError: (err: string | null) => void;
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
    progress: 0,
    duration: 0,
    currentTime: 0,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup blob URL on unmount or track change
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
    setState({ track: null, isPlaying: false, isLoading: false, progress: 0, duration: 0, currentTime: 0, error: null });
  }, [cleanupBlobUrl]);

  const setLoadingTrack = useCallback((track: Track) => {
    setState((s) => ({ ...s, track, isLoading: true, isPlaying: false, error: null }));
  }, []);

  const setError = useCallback((err: string | null) => {
    setState((s) => ({ ...s, isLoading: false, error: err }));
  }, []);

  const playTrack = useCallback((track: Track, audioBlob: Blob) => {
    // Stop previous
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
    setState((s) => ({ ...s, track, isPlaying: true, isLoading: false, error: null }));
  }, [cleanupBlobUrl]);

  const loadAndPlay = useCallback((_track: Track) => {
    // This is a placeholder — actual decrypt + download is triggered from PostDetail
    // The component calling this should use setLoadingTrack + playTrack after decrypt
  }, []);

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
    <MusicPlayerContext.Provider value={{ ...state, playTrack, loadAndPlay, setLoadingTrack, pause, resume, seek, stop, setError }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
