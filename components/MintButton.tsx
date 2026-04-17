'use client';

import { useMintNFT } from '@/hooks/useMintNFT';
import { useAuth } from '@/auth/useAuth';
import { formatSUI } from '@/lib/utils';

interface MintButtonProps {
  postId: string;
  price: bigint;
  soldOut: boolean;
}

export function MintButton({ postId, price, soldOut }: MintButtonProps) {
  const { isLoggedIn, login } = useAuth();
  const { mutate: mint, isPending, isError, error } = useMintNFT();

  if (soldOut) {
    return (
      <button className="btn btn--ghost" disabled>
        Sold Out
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <button className="btn btn--primary" onClick={login}>
        Login để mua — {formatSUI(price)} SUI
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        className="btn btn--mint"
        onClick={() => mint({ postId, price })}
        disabled={isPending}
      >
        {isPending ? 'Đang xử lý...' : `Mua để đọc — ${formatSUI(price)} SUI`}
      </button>

      {isError && (
        <p style={{ fontSize: 12, color: '#ff7070', margin: 0 }}>
          {error instanceof Error ? error.message : 'Transaction failed'}
        </p>
      )}
    </div>
  );
}
