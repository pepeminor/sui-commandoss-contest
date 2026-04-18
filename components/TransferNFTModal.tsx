'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { Modal } from './Modal';
import { WarningBanner } from './WarningBanner';
import { useAuth } from '@/auth/useAuth';
import { useToast } from './Toast';
import { useI18n } from '@/i18n/I18nProvider';
import { suiClient } from '@/lib/sui-client';
import { shortenAddress } from '@/lib/utils';
import { parseTransactionErrorI18n } from '@/lib/errors';
import { type NFTData } from '@/hooks/useMyNFTs';

interface TransferNFTModalProps {
  open: boolean;
  onClose: () => void;
  nft: NFTData | null;
}

export function TransferNFTModal({ open, onClose, nft }: TransferNFTModalProps) {
  const { address, getSigner } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [recipient, setRecipient] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!address || !nft) throw new Error('Missing data');

      const signer = await getSigner();
      const tx = new Transaction();
      tx.setSender(address);
      tx.setGasBudget(10_000_000); // 0.01 SUI — actual cost ~0.002
      tx.transferObjects([tx.object(nft.objectId)], recipient);

      let result;
      try {
        result = await suiClient.signAndExecuteTransaction({
          transaction: tx,
          signer,
        });
      } catch (e) {
        const { key, params } = parseTransactionErrorI18n(e);
        throw new Error(t(key, params));
      }

      if (result.$kind === 'FailedTransaction') {
        const { key, params } = parseTransactionErrorI18n(result.FailedTransaction?.status?.error);
        throw new Error(t(key, params));
      }

      await suiClient.core.waitForTransaction({ result });
      return result;
    },
    onSuccess: () => {
      toast(t('wallet.transferSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
      handleClose();
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : 'Transfer failed', 'error');
    },
  });

  const handleClose = () => {
    setStep('form');
    setRecipient('');
    onClose();
  };

  const isValid = recipient.startsWith('0x') && recipient.length >= 42 && recipient !== address;

  if (!nft) return null;

  return (
    <Modal open={open} onClose={handleClose} title={t('wallet.transferTitle')}>
      <div className="send-token">
        {step === 'form' && (
          <>
            <div className="info-panel">
              <div className="info-row">
                <span className="info-row__label">{t('wallet.nftName')}</span>
                <span className="info-row__value--primary">{nft.postTitle}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">{t('post.edition')}</span>
                <span className="info-row__value">#{nft.edition}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('wallet.recipient')}</label>
              <input
                className="form-input"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
              />
              {recipient === address && (
                <span className="form-hint form-hint--error">{t('wallet.cannotSendSelf')}</span>
              )}
            </div>

            <WarningBanner message={t('wallet.transferWarning')} />

            <button
              className="btn btn--primary btn--full"
              disabled={!isValid}
              onClick={() => setStep('confirm')}
            >
              {t('wallet.reviewTransfer')}
            </button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="info-panel">
              <div className="info-row">
                <span className="info-row__label">{t('wallet.nftName')}</span>
                <span className="info-row__value--primary">{nft.postTitle}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">{t('post.edition')}</span>
                <span className="info-row__value">#{nft.edition}</span>
              </div>
              <div className="info-divider" />
              <div className="info-row">
                <span className="info-row__label">{t('wallet.to')}</span>
                <span className="info-row__value info-row__value--mono">{shortenAddress(recipient)}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">{t('mint.gasFee')}</span>
                <span className="info-row__value">~0.002 SUI</span>
              </div>
            </div>

            <WarningBanner message={t('wallet.transferWarning')} />

            <div className="send-token__actions">
              <button className="btn btn--ghost" onClick={() => setStep('form')}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn--primary"
                onClick={() => transferMutation.mutate()}
                disabled={transferMutation.isPending}
              >
                {transferMutation.isPending ? t('wallet.transferring') : t('wallet.confirmTransfer')}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
