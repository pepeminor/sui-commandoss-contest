'use client';

import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { shortenAddress } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { useIsClient } from '@/hooks/useIsClient';

export function LoginButton() {
  const { address, isLoggedIn, login, logout } = useAuth();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const isClient = useIsClient();

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isClient) {
    return (
      <div
        className="loading-skeleton"
        aria-hidden="true"
        style={{ width: 132, height: 32, borderRadius: 999 }}
      />
    );
  }

  if (isLoggedIn && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="navbar__address"
          onClick={handleCopy}
          title={address}
          style={{ cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.05)' }}
        >
          {copied ? `✓ ${t('nav.copied')}` : shortenAddress(address)}
        </button>
        <button className="btn btn--ghost" onClick={logout} style={{ fontSize: 12, padding: '4px 10px' }}>
          {t('nav.logout')}
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn--primary" onClick={login}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.3" />
        <path d="M12 6a3 3 0 100 6 3 3 0 000-6z" fill="currentColor" />
        <path d="M12 14c-4 0-6 2-6 3v1h12v-1c0-1-2-3-6-3z" fill="currentColor" />
      </svg>
      {t('nav.login')}
    </button>
  );
}
