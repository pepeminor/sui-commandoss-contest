'use client';

import { useAuth } from '@/auth/useAuth';
import { shortenAddress } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { useIsClient } from '@/hooks/useIsClient';
import { useWalletModal } from './WalletModalProvider';

export function LoginButton() {
  const { address, isLoggedIn, login } = useAuth();
  const { t } = useI18n();
  const isClient = useIsClient();
  const { openWallet } = useWalletModal();

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
      <button
        className="navbar__address"
        onClick={openWallet}
        title={address}
      >
        {shortenAddress(address)}
      </button>
    );
  }

  return (
    <button className="btn btn--primary" onClick={login}>
      <i className="ri-user-line" style={{ fontSize: 14 }} />
      {t('nav.login')}
    </button>
  );
}
