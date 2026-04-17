'use client';

import { useState } from 'react';
import { useMintNFT } from '@/hooks/useMintNFT';
import { useAuth } from '@/auth/useAuth';
import { formatSUI } from '@/lib/utils';
import { Modal } from './Modal';
import { useI18n } from '@/i18n/I18nProvider';
import { useIsClient } from '@/hooks/useIsClient';

const GAS_ESTIMATE_MIST = 5_500_000n; // ~0.0055 SUI

interface MintButtonProps {
  postId: string;
  price: bigint;
  soldOut: boolean;
}

export function MintButton({ postId, price, soldOut }: MintButtonProps) {
  const { isLoggedIn, login } = useAuth();
  const { mutate: mint, isPending, isError, error } = useMintNFT();
  const { t } = useI18n();
  const [showConfirm, setShowConfirm] = useState(false);
  const isClient = useIsClient();

  if (soldOut) {
    return (
      <button className="btn btn--ghost" disabled>
        {t('mint.soldOut')}
      </button>
    );
  }

  if (!isClient) {
    return (
      <button className="btn btn--primary loading-skeleton" disabled style={{ width: '100%', height: 44 }}>
        {formatSUI(price)} SUI
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <button className="btn btn--primary" onClick={login}>
        {t('mint.loginToBuy')} — {formatSUI(price)} SUI
      </button>
    );
  }

  const handleConfirm = () => {
    setShowConfirm(false);
    mint({ postId, price });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        className="btn btn--mint"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        style={{ width: '100%', height: 44, fontSize: 14 }}
      >
        {isPending ? t('mint.processing') : `${t('mint.buy')} — ${formatSUI(price)} SUI`}
      </button>

      {isError && (
        <p style={{ fontSize: 12, color: '#ff7070', margin: 0 }}>
          {error instanceof Error ? error.message : 'Transaction failed'}
        </p>
      )}

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={t('mint.confirmTitle')}
        actions={
          <>
            <button className="btn btn--ghost" onClick={() => setShowConfirm(false)}>
              {t('mint.cancel')}
            </button>
            <button className="btn btn--primary" onClick={handleConfirm}>
              {t('mint.confirm')}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'rgba(240,235,228,0.55)' }}>{t('mint.nftPrice')}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6FBCF0' }}>{formatSUI(price)} SUI</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'rgba(240,235,228,0.55)' }}>{t('mint.gasFee')}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6FBCF0' }}>~{formatSUI(GAS_ESTIMATE_MIST)} SUI</span>
            </div>
            <div style={{
              borderTop: '0.5px solid rgba(255,255,255,0.06)',
              marginTop: 10,
              paddingTop: 10,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f0ebe4' }}>{t('mint.total')}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#6FBCF0' }}>
                ~{formatSUI(price + GAS_ESTIMATE_MIST)} SUI
              </span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(240,235,228,0.3)', margin: 0 }}>
            {t('mint.revenueNote')}
          </p>
        </div>
      </Modal>
    </div>
  );
}
