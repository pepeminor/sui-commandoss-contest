'use client';

import { useEnokiFlow, useZkLogin } from '@mysten/enoki/react';
import type { Signer } from '@mysten/sui/cryptography';
import { APP_URL, GOOGLE_CLIENT_ID } from '@/config';

export function useAuth() {
  const enokiFlow = useEnokiFlow();
  const { address } = useZkLogin();

  const login = async () => {
    const url = await enokiFlow.createAuthorizationURL({
      provider: 'google',
      clientId: GOOGLE_CLIENT_ID,
      redirectUrl: `${APP_URL}/auth/callback`,
      network: 'testnet',
    });
    window.location.href = url;
  };

  const logout = () => enokiFlow.logout();

  /** Get signer (EnokiKeypair extends Signer) — only callable when user is logged in */
  const getSigner = (): Promise<Signer> => enokiFlow.getKeypair({ network: 'testnet' });

  return {
    address: address ?? null,
    isLoggedIn: !!address,
    login,
    logout,
    getSigner,
  };
}
