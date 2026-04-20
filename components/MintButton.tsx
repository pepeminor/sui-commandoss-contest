'use client';

import { useState } from 'react';
import { useMintNFT } from '@/hooks/useMintNFT';
import { useAuth } from '@/auth/useAuth';
import { formatSUI } from '@/lib/utils';
import { Modal } from './Modal';
import { useI18n } from '@/i18n/I18nProvider';
import { useIsClient } from '@/hooks/useIsClient';

const GAS_ESTIMATE_MIST = 5_500_000n; // ~0.0055 SUI

interface I18nError extends Error {
  i18n?: {
    key: string;
    params?: Record<string, string>;
  };
}

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
    return null;
  }

  if (!isClient) {
    return (
      <button className="btn btn--mint btn--full loading-skeleton" disabled>
        {formatSUI(price)} SUI
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <button className="btn btn--primary btn--full" onClick={login}>
        {t('mint.loginToBuy')} — {formatSUI(price)} SUI
      </button>
    );
  }

  const handleConfirm = () => {
    setShowConfirm(false);
    mint({ postId, price });
  };

  return (
    <div className="mint-action">
      <button
        className="btn btn--mint btn--full"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
      >
        {isPending ? t('mint.processing') : `${t('mint.buy')} — ${formatSUI(price)} SUI`}
      </button>

      {isError && (
        <p className="error-text">
          {(error as I18nError | null)?.i18n
            ? t((error as I18nError).i18n!.key, (error as I18nError).i18n!.params)
            : error instanceof Error ? error.message : t('error.txFailed')}
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
        <div className="mint-confirm">
          <div className="info-panel">
            <div className="info-row">
              <span className="info-row__label">{t('mint.nftPrice')}</span>
              <span className="info-row__value">{formatSUI(price)} SUI</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">{t('mint.gasFee')}</span>
              <span className="info-row__value">~{formatSUI(GAS_ESTIMATE_MIST)} SUI</span>
            </div>
            <div className="info-divider" />
            <div className="info-row">
              <span className="info-row__value--primary">{t('mint.total')}</span>
              <span className="info-row__value--lg">
                ~{formatSUI(price + GAS_ESTIMATE_MIST)} SUI
              </span>
            </div>
          </div>
          <p className="hint-text">
            {t('mint.revenueNote')}
          </p>
        </div>
      </Modal>
    </div>
  );
}
