'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { Modal } from './Modal';
import { useAuth } from '@/auth/useAuth';
import { useToast } from './Toast';
import { useI18n } from '@/i18n/I18nProvider';
import { suiClient } from '@/lib/sui-client';
import { parseTransactionError } from '@/lib/errors';
import { type TokenBalance, formatTokenAmount } from '@/hooks/useTokenBalances';

interface SendTokenModalProps {
  open: boolean;
  onClose: () => void;
  balances: TokenBalance[];
}

export function SendTokenModal({ open, onClose, balances }: SendTokenModalProps) {
  const { address, getSigner } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState(0);
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const selected = balances[selectedCoin];

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!address || !selected) throw new Error('Missing data');

      const signer = await getSigner();
      const amountMist = BigInt(Math.round(parseFloat(amount) * 10 ** selected.decimals));

      const tx = new Transaction();
      tx.setSender(address);

      if (selected.coinType === '0x2::sui::SUI') {
        const [coin] = tx.splitCoins(tx.gas, [amountMist]);
        tx.transferObjects([coin], recipient);
      } else {
        const { objects: coins } = await suiClient.core.listCoins({
          owner: address,
          coinType: selected.coinType,
          limit: 50,
        });

        if (!coins.length) throw new Error('No coins found');

        const primaryCoin = tx.object(coins[0].objectId);
        if (coins.length > 1) {
          tx.mergeCoins(primaryCoin, coins.slice(1).map((c) => tx.object(c.objectId)));
        }
        const [splitCoin] = tx.splitCoins(primaryCoin, [amountMist]);
        tx.transferObjects([splitCoin], recipient);
      }

      let result;
      try {
        result = await suiClient.signAndExecuteTransaction({
          transaction: tx,
          signer,
        });
      } catch (e) {
        throw new Error(parseTransactionError(e));
      }

      if (result.$kind === 'FailedTransaction') {
        throw new Error(parseTransactionError(result.FailedTransaction?.status?.error));
      }

      await suiClient.core.waitForTransaction({ result });
      return result;
    },
    onSuccess: () => {
      toast(t('wallet.sendSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['tokenBalances'] });
      handleClose();
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : 'Send failed', 'error');
    },
  });

  const handleClose = () => {
    setStep('form');
    setRecipient('');
    setAmount('');
    setSelectedCoin(0);
    onClose();
  };

  const isValid = recipient.startsWith('0x') && recipient.length >= 42 && parseFloat(amount) > 0;

  return (
    <Modal open={open} onClose={handleClose} title={t('wallet.sendTitle')}>
      <div className="send-token">
        {step === 'form' && (
          <>
            <div className="form-group">
              <label className="form-label">{t('wallet.token')}</label>
              <select
                className="form-input"
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(Number(e.target.value))}
              >
                {balances.map((b, i) => (
                  <option key={b.coinType} value={i}>
                    {b.symbol} — {formatTokenAmount(b.totalBalance, b.decimals)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('wallet.recipient')}</label>
              <input
                className="form-input"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('wallet.amount')}</label>
              <input
                className="form-input"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {selected && (
                <span className="form-hint">
                  {t('wallet.available')}: {formatTokenAmount(selected.totalBalance, selected.decimals)} {selected.symbol}
                </span>
              )}
            </div>

            <button
              className="btn btn--primary btn--full"
              disabled={!isValid}
              onClick={() => setStep('confirm')}
            >
              {t('wallet.reviewSend')}
            </button>
          </>
        )}

        {step === 'confirm' && selected && (
          <>
            <div className="info-panel">
              <div className="info-row">
                <span className="info-row__label">{t('wallet.token')}</span>
                <span className="info-row__value--primary">{selected.symbol}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">{t('wallet.amount')}</span>
                <span className="info-row__value">{amount} {selected.symbol}</span>
              </div>
              <div className="info-divider" />
              <div className="info-row">
                <span className="info-row__label">{t('wallet.to')}</span>
                <span className="wallet__token-type" style={{ fontSize: 11 }}>{recipient}</span>
              </div>
            </div>

            <div className="send-token__actions">
              <button className="btn btn--ghost" onClick={() => setStep('form')}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn--primary"
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending ? t('wallet.sending') : t('wallet.confirmSend')}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
