'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { useRouter } from 'next/navigation';
import { SuiIcon } from './SuiIcon';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'tokens' | 'nfts';

export function WalletModal({ open, onClose }: WalletModalProps) {
  const { address, logout } = useAuth();
  const { data: balances, isLoading: balancesLoading } = useTokenBalances();
  const { data: nfts, isLoading: nftsLoading } = useMyNFTs();
  const { toast } = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('tokens');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const router = useRouter();
  const [sendOpen, setSendOpen] = useState(false);
  const [transferNft, setTransferNft] = useState<NFTData | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onClose();
    logout();
  };

  useEffect(() => {
    if (!address || !open) return;
    import('qrcode').then((QRCode) =>
      QRCode.toDataURL(address, {
        width: 180,
        margin: 2,
        color: { dark: '#f0ebe4', light: '#00000000' },
      }).then(setQrDataUrl)
    );
  }, [address, open]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      toast(t('wallet.copied'), 'success');
    });
  };

  if (!address) return null;

  const tokenIcon = (symbol: string) => {
    if (symbol === 'SUI') return <SuiIcon size={32} />;
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
                <Image src={qrDataUrl} alt={t('wallet.qrAlt')} className="wallet__qr" width={140} height={140} unoptimized />
              </div>
            )}
            <button className="wallet__address-btn" onClick={handleCopy} title={address}>
              {shortenAddress(address)}
              <i className="ri-file-copy-line" style={{ fontSize: 14 }} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="wallet__actions">
            <button className="wallet__action" onClick={() => setSendOpen(true)}>
              <div className="wallet__action-icon">
                <i className="ri-arrow-up-line" style={{ fontSize: 18 }} />
              </div>
              <span>{t('wallet.send')}</span>
            </button>
            <button className="wallet__action" onClick={handleCopy}>
              <div className="wallet__action-icon">
                <i className="ri-arrow-down-line" style={{ fontSize: 18 }} />
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
                <div key={nft.objectId} className="wallet__nft-row" onClick={() => { onClose(); router.push(`/post/${nft.postId}`); }}>
                  <div className="wallet__nft-icon">🎵</div>
                  <div className="wallet__token-info">
                    <span className="wallet__token-symbol">{nft.postTitle}</span>
                    <span className="wallet__token-type">Edition #{nft.edition} · {timeAgo(nft.mintedAt)}</span>
                  </div>
                  <button
                    className="wallet__nft-transfer"
                    onClick={(e) => { e.stopPropagation(); setTransferNft(nft); }}
                  >
                    {t('wallet.transferTitle')}
                  </button>
                  <i className="ri-arrow-right-s-line wallet__nft-arrow" style={{ fontSize: 16 }} />
                </div>
              ))}
            </div>
          )}

          {/* Logout */}
          <div className="wallet__logout-section">
            <button className="wallet__logout" onClick={() => setShowLogoutConfirm(true)}>
              <i className="ri-logout-box-r-line" style={{ fontSize: 16 }} />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Logout confirm */}
      <Modal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('nav.logoutConfirmTitle')}
        actions={
          <>
            <button className="btn btn--ghost" onClick={() => setShowLogoutConfirm(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn--danger" onClick={handleLogout}>
              {t('nav.logout')}
            </button>
          </>
        }
      >
        <p className="hint-text" style={{ fontSize: 13 }}>
          {t('nav.logoutConfirmDesc')}
        </p>
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
