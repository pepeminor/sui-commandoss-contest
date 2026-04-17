'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LoginButton } from './LoginButton';
import { Modal } from './Modal';
import { useAuth } from '@/auth/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { shortenAddress } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, address, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const links = [
    { href: '/', label: t('nav.feed') },
    ...(mounted && isLoggedIn ? [
      { href: '/create', label: t('nav.publish') },
      { href: '/library', label: t('nav.library') },
    ] : []),
  ];

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setMenuOpen(false);
    logout();
  };

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
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {/* Address at top */}
            {mounted && isLoggedIn && address && (
              <>
                <button className="mobile-menu__address" onClick={handleCopy} title={address}>
                  {copied ? `✓ ${t('nav.copied')}` : shortenAddress(address)}
                </button>
                <div className="mobile-menu__divider" />
              </>
            )}

            {/* Nav links */}
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

            {/* Language toggle */}
            <button
              className="mobile-menu__lang"
              onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
            >
              {locale === 'en' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
            </button>

            {/* Spacer pushes logout to bottom */}
            <div style={{ flex: 1 }} />

            {/* Logout at bottom */}
            {mounted && isLoggedIn && (
              <>
                <div className="mobile-menu__divider" />
                <button
                  className="mobile-menu__logout"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  {t('nav.logout')}
                </button>
              </>
            )}

            {/* Login button if not logged in */}
            {mounted && !isLoggedIn && (
              <div style={{ marginTop: 8 }}>
                <LoginButton />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout confirm modal */}
      <Modal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('nav.logoutConfirmTitle')}
        actions={
          <>
            <button className="btn btn--ghost" onClick={() => setShowLogoutConfirm(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn--danger" onClick={handleLogout}>
              {t('nav.logout')}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'rgba(240,235,228,0.55)', margin: 0 }}>
          {t('nav.logoutConfirmDesc')}
        </p>
      </Modal>
    </>
  );
}
