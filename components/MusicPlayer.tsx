'use client';

import { useMusicPlayer } from './MusicPlayerProvider';
import { shortenAddress } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';

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
  const { t } = useI18n();

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
              aria-label={isPlaying ? t('player.pause') : t('player.play')}
            >
              {isPlaying ? (
                <i className="ri-pause-fill" style={{ fontSize: 18 }} />
              ) : (
                <i className="ri-play-fill" style={{ fontSize: 18 }} />
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
        <button className="music-player__close" onClick={stop} aria-label={t('common.close')}>
          <i className="ri-close-line" style={{ fontSize: 14 }} />
        </button>
      </div>

      {error && <div className="music-player__error">{error}</div>}
    </div>
  );
}
