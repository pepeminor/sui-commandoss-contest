'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LoginButton } from './LoginButton';
import { Modal } from './Modal';
import { useAuth } from '@/auth/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { shortenAddress } from '@/lib/utils';
import { useIsClient } from '@/hooks/useIsClient';
import { useWalletModal } from './WalletModalProvider';

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, address, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const isClient = useIsClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { openWallet } = useWalletModal();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: '/', label: t('nav.feed') },
    ...(isClient && isLoggedIn ? [
      { href: '/library', label: t('nav.library') },
      { href: '/dashboard', label: t('nav.dashboard') },
    ] : []),
  ];

  const showPublish = isClient && isLoggedIn;
  const nextLocale = locale === 'en' ? 'vi' : 'en';
  const currentLanguage = locale === 'en'
    ? { flag: '🇬🇧', label: 'English' }
    : { flag: '🇻🇳', label: 'Tiếng Việt' };
  const nextLanguageLabel = nextLocale === 'en' ? 'English' : 'Tiếng Việt';

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
            <i className="ri-disc-fill" style={{ fontSize: 14, color: '#0a0a0f' }} />
          </div>
          <span className="navbar__logo-name">VERSE</span>
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
          {showPublish && (
            <Link
              href="/create"
              className={`navbar__publish${pathname === '/create' ? ' navbar__publish--active' : ''}`}
            >
              <i className="ri-add-line navbar__publish-icon" style={{ fontSize: 14 }} />
              {t('nav.publish')}
            </Link>
          )}
          <button
            className="navbar__lang"
            onClick={() => setLocale(nextLocale)}
            title={`Switch to ${nextLanguageLabel}`}
            aria-label={`Switch to ${nextLanguageLabel}`}
          >
            <span className="navbar__lang-flag">{currentLanguage.flag}</span>
          </button>
          <LoginButton />
        </div>

        {/* Mobile hamburger */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <i className={menuOpen ? 'ri-close-line' : 'ri-menu-line'} style={{ fontSize: 20 }} />
        </button>
      </nav>

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {/* Address at top */}
            {isClient && isLoggedIn && address && (
              <>
                <button
                  className="mobile-menu__address"
                  onClick={() => { setMenuOpen(false); openWallet(); }}
                  title={address}
                >
                  {shortenAddress(address)}
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 12, marginLeft: 'auto', opacity: 0.5 }} />
                </button>
                <div className="mobile-menu__divider" />
              </>
            )}

            {/* Publish CTA in mobile menu */}
            {showPublish && (
              <Link
                href="/create"
                className={`mobile-menu__publish${pathname === '/create' ? ' mobile-menu__publish--active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <i className="ri-add-line" style={{ fontSize: 16 }} />
                {t('nav.publish')}
              </Link>
            )}

            <div className="mobile-menu__divider" />

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
              onClick={() => setLocale(nextLocale)}
              aria-label={`Switch to ${nextLanguageLabel}`}
            >
              {currentLanguage.flag} {currentLanguage.label}
            </button>

            {/* Spacer pushes logout to bottom */}
            <div style={{ flex: 1 }} />

            {/* Logout at bottom */}
            {isClient && isLoggedIn && (
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
            {isClient && !isLoggedIn && (
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
        <p className="hint-text" style={{ fontSize: 13 }}>
          {t('nav.logoutConfirmDesc')}
        </p>
      </Modal>

    </>
  );
}
