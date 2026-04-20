'use client';

import { useCallback } from 'react';
import {
  useCurrentAccount,
  useWalletConnection,
  useWallets,
  useDAppKit,
} from '@mysten/dapp-kit-react';
import { CurrentAccountSigner } from '@mysten/dapp-kit-core';
import { isGoogleWallet } from '@mysten/enoki';
import type { Signer } from '@mysten/sui/cryptography';
import type { DAppKit } from '@mysten/dapp-kit-react';

export function useAuth() {
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  const { wallet } = useWalletConnection();
  const wallets = useWallets();
  const address = account?.address ?? null;

  const login = useCallback(async () => {
    const enokiGoogle = wallets.find((w) => isGoogleWallet(w));
    if (!enokiGoogle) {
      console.error('Enoki Google wallet not registered');
      return;
    }
    await dAppKit.connectWallet({ wallet: enokiGoogle });
  }, [wallets, dAppKit]);

  const logout = useCallback(async () => {
    if (!wallet) return;
    await dAppKit.disconnectWallet();
  }, [wallet, dAppKit]);

  /** Get signer — wraps the current connected wallet as a Signer */
  const getSigner = useCallback(
    (): Promise<Signer> =>
      Promise.resolve(new CurrentAccountSigner(dAppKit as DAppKit)),
    [dAppKit],
  );

  return {
    address,
    isLoggedIn: !!address,
    login,
    logout,
    getSigner,
  };
}
