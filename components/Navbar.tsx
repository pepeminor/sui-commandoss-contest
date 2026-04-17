'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LoginButton } from './LoginButton';
import { useAuth } from '@/auth/useAuth';
import { useI18n } from '@/i18n/I18nProvider';

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const links = [
    { href: '/', label: t('nav.feed') },
    ...(mounted && isLoggedIn ? [
      { href: '/create', label: t('nav.publish') },
      { href: '/library', label: t('nav.library') },
    ] : []),
  ];

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar__logo">
          <div className="navbar__logo-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" fill="none" />
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <span className="navbar__logo-name">Verse</span>
        </Link>

        {/* Desktop links */}
        <div className="navbar__links navbar__links--desktop">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`navbar__link${pathname === href ? ' navbar__link--active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="navbar__right navbar__right--desktop">
          <button
            className="navbar__lang"
            onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
          >
            {locale === 'en' ? 'VI' : 'EN'}
          </button>
          <LoginButton />
        </div>

        {/* Mobile hamburger */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <>
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu__links">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`mobile-menu__link${pathname === href ? ' mobile-menu__link--active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="mobile-menu__divider" />

            <div className="mobile-menu__actions">
              <button
                className="navbar__lang"
                onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
              >
                {locale === 'en' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
              </button>
              <LoginButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
