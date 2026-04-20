'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { Modal } from './Modal';
import { WarningBanner } from './WarningBanner';
import { useAuth } from '@/auth/useAuth';
import { useToast } from './Toast';
import { useI18n } from '@/i18n/I18nProvider';
import { signAndExecute } from '@/lib/sui-client';
import { shortenAddress } from '@/lib/utils';
import { type NFTData } from '@/hooks/useMyNFTs';
import { makeTransferNftSchema } from '@/lib/validation';

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

  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const schema = useMemo(() => makeTransferNftSchema(address ?? undefined), [address]);
  const form = useForm<{ recipient: string }>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { recipient: '' },
  });
  const recipient = useWatch({ control: form.control, name: 'recipient' }) ?? '';

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!address || !nft) throw new Error('Missing data');

      const signer = await getSigner();
      const tx = new Transaction();
      tx.transferObjects([tx.object(nft.objectId)], recipient.trim());

      return signAndExecute(tx, signer, address);
    },
    onSuccess: () => {
      toast(t('wallet.transferSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['myNFTs:all'] });
      handleClose();
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : t('wallet.transferFailed'), 'error');
    },
  });

  const handleClose = () => {
    setStep('form');
    form.reset({ recipient: '' });
    onClose();
  };

  const handleReview = form.handleSubmit(() => setStep('confirm'));

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
                {...form.register('recipient')}
              />
              {form.formState.errors.recipient && (
                <span className="form-hint form-hint--error">{t(form.formState.errors.recipient.message ?? '')}</span>
              )}
            </div>

            <WarningBanner message={t('wallet.transferWarning')} />

            <button
              className="btn btn--primary btn--full"
              disabled={!form.formState.isValid}
              onClick={handleReview}
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
