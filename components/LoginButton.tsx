'use client';

import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { shortenAddress } from '@/lib/utils';

export function LoginButton() {
  const { address, isLoggedIn, login, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoggedIn && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <button
          className="navbar__address"
          onClick={handleCopy}
          title={address}
          style={{ cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.05)' }}
        >
          {copied ? '✓ Đã copy' : shortenAddress(address)}
        </button>
        <button className="btn btn--ghost" onClick={logout} style={{ fontSize: 12, padding: '4px 10px' }}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn--primary" onClick={login}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
          fill="currentColor"
          opacity="0.3"
        />
        <path d="M12 6a3 3 0 100 6 3 3 0 000-6z" fill="currentColor" />
        <path d="M12 14c-4 0-6 2-6 3v1h12v-1c0-1-2-3-6-3z" fill="currentColor" />
      </svg>
      Login
    </button>
  );
}
