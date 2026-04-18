'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Modal } from './Modal';
import { useAuth } from '@/auth/useAuth';
import { useTokenBalances, formatTokenAmount } from '@/hooks/useTokenBalances';
import { useMyNFTs } from '@/hooks/useMyNFTs';
import { useToast } from './Toast';
import { useI18n } from '@/i18n/I18nProvider';
import { shortenAddress, timeAgo } from '@/lib/utils';
import { SendTokenModal } from './SendTokenModal';
import { TransferNFTModal } from './TransferNFTModal';
import { type NFTData } from '@/hooks/useMyNFTs';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'tokens' | 'nfts';

export function WalletModal({ open, onClose }: WalletModalProps) {
  const { address } = useAuth();
  const { data: balances, isLoading: balancesLoading } = useTokenBalances();
  const { data: nfts, isLoading: nftsLoading } = useMyNFTs();
  const { toast } = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('tokens');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [sendOpen, setSendOpen] = useState(false);
  const [transferNft, setTransferNft] = useState<NFTData | null>(null);

  useEffect(() => {
    if (!address || !open) return;
    QRCode.toDataURL(address, {
      width: 180,
      margin: 2,
      color: { dark: '#f0ebe4', light: '#00000000' },
    }).then(setQrDataUrl);
  }, [address, open]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      toast(t('wallet.copied'), 'success');
    });
  };

  if (!address) return null;

  const tokenIcon = (symbol: string) => {
    if (symbol === 'SUI') return '💧';
    if (symbol === 'WAL') return '🦭';
    return '🪙';
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={t('wallet.title')}>
        <div className="wallet">
          {/* QR + Address */}
          <div className="wallet__qr-section">
            {qrDataUrl && (
              <div className="wallet__qr-wrapper">
                <img src={qrDataUrl} alt="QR Code" className="wallet__qr" width={140} height={140} />
              </div>
            )}
            <button className="wallet__address-btn" onClick={handleCopy} title={address}>
              {shortenAddress(address)}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>

          {/* Action buttons */}
          <div className="wallet__actions">
            <button className="wallet__action" onClick={() => setSendOpen(true)}>
              <div className="wallet__action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </div>
              <span>{t('wallet.send')}</span>
            </button>
            <button className="wallet__action" onClick={handleCopy}>
              <div className="wallet__action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </div>
              <span>{t('wallet.receive')}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="wallet__tabs">
            <button
              className={`wallet__tab${tab === 'tokens' ? ' wallet__tab--active' : ''}`}
              onClick={() => setTab('tokens')}
            >
              {t('wallet.tokens')}
            </button>
            <button
              className={`wallet__tab${tab === 'nfts' ? ' wallet__tab--active' : ''}`}
              onClick={() => setTab('nfts')}
            >
              {t('wallet.nfts')} {nfts?.length ? `(${nfts.length})` : ''}
            </button>
          </div>

          {/* Tab content */}
          {tab === 'tokens' && (
            <div className="wallet__token-list">
              {balancesLoading && (
                <>
                  <div className="loading-skeleton" style={{ height: 52, borderRadius: 10 }} />
                  <div className="loading-skeleton" style={{ height: 52, borderRadius: 10 }} />
                </>
              )}
              {!balancesLoading && (!balances || balances.length === 0) && (
                <div className="wallet__empty">
                  <span>{t('wallet.noTokens')}</span>
                </div>
              )}
              {balances?.map((token) => (
                <div key={token.coinType} className="wallet__token-row">
                  <span className="wallet__token-icon">{tokenIcon(token.symbol)}</span>
                  <div className="wallet__token-info">
                    <span className="wallet__token-symbol">{token.symbol}</span>
                    <span className="wallet__token-type">{shortenAddress(token.coinType.split('::')[0])}</span>
                  </div>
                  <span className="wallet__token-amount">
                    {formatTokenAmount(token.totalBalance, token.decimals)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'nfts' && (
            <div className="wallet__nft-list">
              {nftsLoading && (
                <>
                  <div className="loading-skeleton" style={{ height: 52, borderRadius: 10 }} />
                  <div className="loading-skeleton" style={{ height: 52, borderRadius: 10 }} />
                </>
              )}
              {!nftsLoading && (!nfts || nfts.length === 0) && (
                <div className="wallet__empty">
                  <span>{t('wallet.noNfts')}</span>
                </div>
              )}
              {nfts?.map((nft) => (
                <button
                  key={nft.objectId}
                  className="wallet__nft-row"
                  onClick={() => setTransferNft(nft)}
                >
                  <div className="wallet__nft-icon">🎵</div>
                  <div className="wallet__token-info">
                    <span className="wallet__token-symbol">{nft.postTitle}</span>
                    <span className="wallet__token-type">Edition #{nft.edition} · {timeAgo(nft.mintedAt)}</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="wallet__nft-arrow">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <SendTokenModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        balances={balances ?? []}
      />

      <TransferNFTModal
        open={!!transferNft}
        onClose={() => setTransferNft(null)}
        nft={transferNft}
      />
    </>
  );
}
