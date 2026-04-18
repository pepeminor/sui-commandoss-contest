'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { WalletModal } from './WalletModal';

interface WalletModalContextValue {
  openWallet: () => void;
  closeWallet: () => void;
}

const WalletModalContext = createContext<WalletModalContextValue>({
  openWallet: () => {},
  closeWallet: () => {},
});

export function useWalletModal() {
  return useContext(WalletModalContext);
}

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openWallet = useCallback(() => setOpen(true), []);
  const closeWallet = useCallback(() => setOpen(false), []);

  return (
    <WalletModalContext.Provider value={{ openWallet, closeWallet }}>
      {children}
      <WalletModal open={open} onClose={closeWallet} />
    </WalletModalContext.Provider>
  );
}
