'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { Modal } from './Modal';
import { useAuth } from '@/auth/useAuth';
import { useToast } from './Toast';
import { useI18n } from '@/i18n/I18nProvider';
import { suiClient } from '@/lib/sui-client';
import { shortenAddress } from '@/lib/utils';
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
      tx.transferObjects([tx.object(nft.objectId)], recipient);

      const result = await suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
      });

      if (result.$kind === 'FailedTransaction') {
        throw new Error(result.FailedTransaction.status.error?.message || 'Transaction failed');
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
            {/* NFT info */}
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

            {/* Recipient */}
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

            <div className="transfer-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{t('wallet.transferWarning')}</span>
            </div>

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
                <span className="wallet__token-type" style={{ fontSize: 11 }}>{recipient}</span>
              </div>
            </div>

            <div className="transfer-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{t('wallet.transferWarning')}</span>
            </div>

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
