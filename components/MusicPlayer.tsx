'use client';

import { useMusicPlayer } from './MusicPlayerProvider';
import { shortenAddress } from '@/lib/utils';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MusicPlayer() {
  const {
    track, isPlaying, isLoading, isReady, progress, duration, currentTime, error,
    pause, resume, seek, stop, onRequestPlay,
  } = useMusicPlayer();

  if (!track) return null;

  const handlePlayPause = () => {
    if (isLoading) return;

    // Track is ready but audio not yet loaded — trigger decrypt+download
    if (isReady && !isPlaying && onRequestPlay) {
      onRequestPlay();
      return;
    }

    // Normal play/pause toggle
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReady) return; // can't seek before audio is loaded
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  return (
    <div className="music-player">
      <div className="music-player__inner">
        {/* Track info */}
        <div className="music-player__info">
          <div className="music-player__title">{track.title}</div>
          <div className="music-player__author">{shortenAddress(track.author)}</div>
        </div>

        {/* Controls */}
        <div className="music-player__controls">
          {isLoading ? (
            <div className="music-player__loader">
              <div className="music-player__spinner" />
            </div>
          ) : (
            <button
              className="music-player__play"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="music-player__progress-wrap">
          <span className="music-player__time">{isReady ? '—' : formatTime(currentTime)}</span>
          <div className="music-player__bar" onClick={handleSeek}>
            <div className="music-player__bar-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="music-player__time">{isReady ? '—' : formatTime(duration)}</span>
        </div>

        {/* Close */}
        <button className="music-player__close" onClick={stop} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && <div className="music-player__error">{error}</div>}
    </div>
  );
}
