'use client';

import { useCallback } from 'react';
import { useEnokiFlow, useZkLogin } from '@mysten/enoki/react';
import type { Signer } from '@mysten/sui/cryptography';
import { APP_URL, GOOGLE_CLIENT_ID, NETWORK, sanitizeNetwork } from '@/config';

export function useAuth() {
  const enokiFlow = useEnokiFlow();
  const { address } = useZkLogin();

  const login = useCallback(async () => {
    const network = sanitizeNetwork(NETWORK);
    const url = await enokiFlow.createAuthorizationURL({
      provider: 'google',
      clientId: GOOGLE_CLIENT_ID,
      redirectUrl: `${APP_URL}/auth/callback`,
      network,
    });
    window.location.href = url;
  }, [enokiFlow]);

  const logout = useCallback(() => enokiFlow.logout(), [enokiFlow]);

  /** Get signer (EnokiKeypair extends Signer) — only callable when user is logged in */
  const getSigner = useCallback(
    (): Promise<Signer> => enokiFlow.getKeypair({ network: sanitizeNetwork(NETWORK) }),
    [enokiFlow],
  );

  return {
    address: address ?? null,
    isLoggedIn: !!address,
    login,
    logout,
    getSigner,
  };
}
