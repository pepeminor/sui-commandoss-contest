'use client';

import { useAuth } from '@/auth/useAuth';
import { useIsClient } from '@/hooks/useIsClient';
import { useI18n } from '@/i18n/I18nProvider';
import { StarrySky } from './StarrySky';

export function Hero() {
  const { isLoggedIn, login } = useAuth();
  const isClient = useIsClient();
  const { t } = useI18n();

  return (
    <section className="hero">
      {/* Starry night sky */}
      <StarrySky />

      {/* Vinyl disc with SUI logo */}
      <div className="hero__vinyl" aria-hidden="true">
        <div className="hero__disc">
          <div className="hero__disc-shine" />
          <div className="hero__disc-label">
            <svg width="48" height="48" viewBox="0 0 400 400" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M197.376 71.335c1.478-1.78 4.241-1.78 5.718 0l77.371 93.2.25.314c14.236 17.406 22.755 39.525 22.756 63.604 0 56.08-46.215 101.545-103.231 101.547-57.017 0-103.24-45.466-103.24-101.547.001-24.078 8.52-46.198 22.756-63.604l.25-.303 77.37-93.211zm-58.853 106.794c-10.917 13.348-17.454 30.319-17.455 48.784 0 42.008 35.442 77.876 79.162 77.878 12.465 0 24.263-2.837 34.754-7.886l.012-.006a.493.493 0 0 0 .373-.518c.705-5.9.408-12.652-1.218-19.511-3.9-16.439-17.434-31.434-40.68-44.469-26.741-14.947-42.732-34.247-47.21-57.393a95.69 95.69 0 0 1-.614-3.676.361.361 0 0 0-.597-.344l-5.924 7.141zm65.633-69.625c-2.024-2.439-5.817-2.439-7.842 0l-11.539 13.908c-3.53 4.299-7.684 11.44-10.477 19.962s-4.247 18.475-2.302 28.382c3.011 15.323 14.487 28.807 34.525 40.007 29.672 16.632 47.695 37.179 53.229 61.132.293 1.267.546 2.525.76 3.77a.361.361 0 0 0 .608.315c11.057-13.391 17.684-30.472 17.684-49.067 0-18.319-6.437-35.165-17.2-48.464l-.001-.011a.018.018 0 0 0-.003-.011l-57.442-69.923z"
                fill="#4DA2FF"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="hero__content">
        <div className="hero__sui-badge">
          <svg width="13" height="13" viewBox="0 0 400 400" fill="none">
            <rect width="400" height="400" rx="200" fill="#4DA2FF" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M197.376 71.335c1.478-1.78 4.241-1.78 5.718 0l77.371 93.2.25.314c14.236 17.406 22.755 39.525 22.756 63.604 0 56.08-46.215 101.545-103.231 101.547-57.017 0-103.24-45.466-103.24-101.547.001-24.078 8.52-46.198 22.756-63.604l.25-.303 77.37-93.211zm-58.853 106.794c-10.917 13.348-17.454 30.319-17.455 48.784 0 42.008 35.442 77.876 79.162 77.878 12.465 0 24.263-2.837 34.754-7.886l.012-.006a.493.493 0 0 0 .373-.518c.705-5.9.408-12.652-1.218-19.511-3.9-16.439-17.434-31.434-40.68-44.469-26.741-14.947-42.732-34.247-47.21-57.393a95.69 95.69 0 0 1-.614-3.676.361.361 0 0 0-.597-.344l-5.924 7.141zm65.633-69.625c-2.024-2.439-5.817-2.439-7.842 0l-11.539 13.908c-3.53 4.299-7.684 11.44-10.477 19.962s-4.247 18.475-2.302 28.382c3.011 15.323 14.487 28.807 34.525 40.007 29.672 16.632 47.695 37.179 53.229 61.132.293 1.267.546 2.525.76 3.77a.361.361 0 0 0 .608.315c11.057-13.391 17.684-30.472 17.684-49.067 0-18.319-6.437-35.165-17.2-48.464l-.001-.011a.018.018 0 0 0-.003-.011l-57.442-69.923z"
              fill="white"
            />
          </svg>
          <span>{t('hero.poweredBy')}</span>
        </div>

        <h1 className="hero__title">VERSE</h1>

        <p className="hero__tagline">
          {t('hero.tagline1')}<br />
          {t('hero.tagline2')}
        </p>

        <p className="hero__desc">
          {t('hero.desc')}
        </p>

        <div className="hero__actions">
          {isClient && !isLoggedIn && (
            <button className="hero__cta" onClick={login}>
              <i className="ri-google-fill" />
              <span>{t('hero.login')}</span>
            </button>
          )}

          {isClient && isLoggedIn && (
            <a href="/create" className="hero__cta hero__cta--create">
              <i className="ri-add-line" />
              <span>{t('hero.dropTrack')}</span>
            </a>
          )}

          <a href="#feed" className="hero__cta hero__cta--ghost">
            <i className="ri-headphone-line" />
            <span>{t('hero.explore')}</span>
          </a>
        </div>
      </div>

    </section>
  );
}
