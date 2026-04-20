'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from './Modal';
import { useAuth } from '@/auth/useAuth';
import { useToast } from './Toast';
import { useI18n } from '@/i18n/I18nProvider';
import { signAndExecute } from '@/lib/sui-client';
import { type TokenBalance, formatTokenAmount } from '@/hooks/useTokenBalances';
import { formatUnits, makeSendTokenSchema, parseDecimalToUnits } from '@/lib/validation';

interface SendTokenModalProps {
  open: boolean;
  onClose: () => void;
  balances: TokenBalance[];
}

interface SendTokenFormValues {
  recipient: string;
  amount: string;
  selectedCoin: number;
}

const GAS_RESERVE_MIST = 3_000_000n;

export function SendTokenModal({ open, onClose, balances }: SendTokenModalProps) {
  const { address, getSigner } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const form = useForm<SendTokenFormValues>({
    mode: 'onChange',
    defaultValues: { recipient: '', amount: '', selectedCoin: 0 },
    resolver: (values, context, options) => {
      const selected = balances[Number(values.selectedCoin)] ?? balances[0];
      const isSui = selected?.coinType === '0x2::sui::SUI';
      const available = selected
        ? isSui
          ? selected.totalBalance > GAS_RESERVE_MIST ? selected.totalBalance - GAS_RESERVE_MIST : 0n
          : selected.totalBalance
        : 0n;
      return zodResolver(makeSendTokenSchema({
        senderAddress: address ?? undefined,
        decimals: selected?.decimals ?? 9,
        maxUnits: available,
      }))(values, context, options);
    },
  });

  const [recipient, amount, selectedCoin] = useWatch({
    control: form.control,
    name: ['recipient', 'amount', 'selectedCoin'],
  });
  const selected = balances[Number(selectedCoin)] ?? balances[0];
  const isSuiSend = selected?.coinType === '0x2::sui::SUI';
  const availableBalanceUnits = selected
    ? isSuiSend
      ? selected.totalBalance > GAS_RESERVE_MIST ? selected.totalBalance - GAS_RESERVE_MIST : 0n
      : selected.totalBalance
    : 0n;

  const sendMutation = useMutation({
    mutationFn: async (values: SendTokenFormValues) => {
      const token = balances[Number(values.selectedCoin)];
      if (!address || !token) throw new Error('Missing data');

      const signer = await getSigner();
      const amountUnits = parseDecimalToUnits(values.amount, token.decimals);

      const tx = new Transaction();
      const isSui = token.coinType === '0x2::sui::SUI';
      const coin = coinWithBalance({
        balance: amountUnits,
        ...(isSui ? {} : { type: token.coinType }),
      });
      tx.transferObjects([coin], values.recipient.trim());

      return signAndExecute(tx, signer, address);
    },
    onSuccess: () => {
      toast(t('wallet.sendSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['tokenBalances'] });
      handleClose();
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : t('wallet.sendFailed'), 'error');
    },
  });

  const handleClose = () => {
    form.reset({ recipient: '', amount: '', selectedCoin: 0 });
    onClose();
  };

  const onSubmit = (values: SendTokenFormValues) => {
    sendMutation.mutate(values);
  };

  if (!selected) {
    return (
      <Modal open={open} onClose={handleClose} title={t('wallet.sendTitle')}>
        <p className="text-muted">{t('wallet.noTokens')}</p>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('wallet.sendTitle')}>
      <form className="send-token" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">{t('wallet.token')}</label>
          <select className="form-input" {...form.register('selectedCoin', { valueAsNumber: true })}>
            {balances.map((b, i) => (
              <option key={b.coinType} value={i}>
                {b.symbol} - {formatTokenAmount(b.totalBalance, b.decimals)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t('wallet.recipient')}</label>
          <input className="form-input" placeholder="0x..." {...form.register('recipient')} />
          {form.formState.errors.recipient && (
            <span className="form-hint form-hint--error">{t(form.formState.errors.recipient.message ?? '')}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">{t('wallet.amount')}</label>
          <input className="form-input" inputMode="decimal" placeholder="0.00" {...form.register('amount')} />
          <span className="form-hint">
            {t('wallet.available')}: {isSuiSend
              ? `${formatUnits(availableBalanceUnits, selected.decimals)} ${selected.symbol} (${formatTokenAmount(selected.totalBalance, selected.decimals)} - ${formatUnits(GAS_RESERVE_MIST, selected.decimals)} gas)`
              : `${formatTokenAmount(selected.totalBalance, selected.decimals)} ${selected.symbol}`}
          </span>
          {form.formState.errors.amount && (
            <span className="form-hint form-hint--error">
              {form.formState.errors.amount.message === 'validation.amount.exceedsBalance' && isSuiSend
                ? t('wallet.exceedsBalanceGas')
                : t(form.formState.errors.amount.message ?? '')}
            </span>
          )}
        </div>

        <div className="info-panel">
          <div className="info-row">
            <span className="info-row__label">{t('wallet.token')}</span>
            <span className="info-row__value--primary">{selected.symbol}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">{t('wallet.amount')}</span>
            <span className="info-row__value">{amount || '0'} {selected.symbol}</span>
          </div>
          <div className="info-divider" />
          <div className="info-row">
            <span className="info-row__label" style={{ flexShrink: 0, marginRight: 10 }}>{t('wallet.to')}</span>
            <span className="info-row__value--mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {recipient || '-'}
            </span>
          </div>
        </div>

        <div className="send-token__actions">
          <button type="button" className="btn btn--ghost" onClick={handleClose}>
            {t('common.cancel')}
          </button>
          <button className="btn btn--primary" type="submit" disabled={!form.formState.isValid || sendMutation.isPending}>
            {sendMutation.isPending ? t('wallet.sending') : t('wallet.confirmSend')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
