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
  isReady: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  error: string | null;
}

interface MusicPlayerActions {
  setReadyTrack: (track: Track) => void;
  setLoadingTrack: (track: Track) => void;
  playTrack: (track: Track, audioBlob: Blob) => void;
  replaceAudioBlob: (newBlob: Blob) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  stop: () => void;
  setError: (err: string | null) => void;
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

const INITIAL_STATE: MusicPlayerState = {
  track: null,
  isPlaying: false,
  isLoading: false,
  isReady: false,
  progress: 0,
  duration: 0,
  currentTime: 0,
  error: null,
};

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MusicPlayerState>(INITIAL_STATE);
  const [onRequestPlay, setOnRequestPlayRaw] = useState<(() => Promise<void>) | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

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
    setOnRequestPlayRaw(null);
    setState(INITIAL_STATE);
  }, [cleanupBlobUrl]);

  const setReadyTrack = useCallback((track: Track) => {
    setState((s) => {
      if (s.isPlaying || s.isLoading) return s;
      if (s.track?.postId === track.postId && s.isReady) return s;
      return { ...INITIAL_STATE, track, isReady: true };
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

    const isActive = () => audioRef.current === audio;
    audio.addEventListener('loadedmetadata', () => {
      if (isActive()) setState((s) => ({ ...s, duration: audio.duration }));
    });
    audio.addEventListener('timeupdate', () => {
      if (!isActive()) return;
      const ct = audio.currentTime;
      const dur = audio.duration || 1;
      setState((s) => ({ ...s, currentTime: ct, progress: ct / dur }));
    });
    audio.addEventListener('ended', () => {
      if (isActive()) setState((s) => ({ ...s, isPlaying: false, progress: 1 }));
    });
    audio.addEventListener('error', () => {
      if (isActive()) setState((s) => ({ ...s, isPlaying: false, error: 'Playback error' }));
    });

    audio.play();
    setState((s) => ({ ...s, track, isPlaying: true, isLoading: false, isReady: false, error: null }));
  }, [cleanupBlobUrl]);

  /** Swap audio source while preserving playback position (for streaming upgrade). */
  const replaceAudioBlob = useCallback((newBlob: Blob) => {
    const audio = audioRef.current;
    if (!audio) return;

    const savedTime = audio.currentTime;
    const wasPlaying = !audio.paused;

    cleanupBlobUrl();
    const url = URL.createObjectURL(newBlob);
    blobUrlRef.current = url;

    audio.src = url;
    audio.addEventListener('canplay', () => {
      audio.currentTime = savedTime;
      if (wasPlaying) audio.play();
    }, { once: true });
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
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  // Wrap setter to accept a function value (useState quirk with function values)
  const setOnRequestPlay = useCallback((fn: (() => Promise<void>) | null) => {
    setOnRequestPlayRaw(() => fn);
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
      setReadyTrack, setLoadingTrack, playTrack, replaceAudioBlob,
      pause, resume, seek, stop, setError,
      onRequestPlay, setOnRequestPlay,
    }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
