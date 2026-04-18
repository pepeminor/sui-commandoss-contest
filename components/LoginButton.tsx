'use client';

import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { shortenAddress } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { useIsClient } from '@/hooks/useIsClient';
import { WalletModal } from './WalletModal';

export function LoginButton() {
  const { address, isLoggedIn, login, logout } = useAuth();
  const { t } = useI18n();
  const isClient = useIsClient();
  const [walletOpen, setWalletOpen] = useState(false);

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
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="navbar__address"
            onClick={() => setWalletOpen(true)}
            title={address}
          >
            {shortenAddress(address)}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={logout}>
            {t('nav.logout')}
          </button>
        </div>
        <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
      </>
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
