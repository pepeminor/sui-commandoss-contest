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
import { useToast } from './Toast';
import { WalletModal } from './WalletModal';

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, address, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { toast } = useToast();
  const isClient = useIsClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);

  const links = [
    { href: '/', label: t('nav.feed') },
    ...(isClient && isLoggedIn ? [
      { href: '/library', label: t('nav.library') },
    ] : []),
  ];

  const showPublish = isClient && isLoggedIn;

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
          {showPublish && (
            <Link
              href="/create"
              className={`navbar__publish${pathname === '/create' ? ' navbar__publish--active' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="navbar__publish-icon">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              {t('nav.publish')}
            </Link>
          )}
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
            {isClient && isLoggedIn && address && (
              <>
                <button
                  className="mobile-menu__address"
                  onClick={() => { setMenuOpen(false); setWalletOpen(true); }}
                  title={address}
                >
                  {shortenAddress(address)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto', opacity: 0.5 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
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
              onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
            >
              {locale === 'en' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
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

      {/* Wallet Modal */}
      <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}
