'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Modal } from '@/components/Modal';
import { useCreatePost } from '@/hooks/useCreatePost';
import { useAuth } from '@/auth/useAuth';
import { formatSUI } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { useIsClient } from '@/hooks/useIsClient';

const REDIRECT_DELAY = 8;
const GAS_ESTIMATE_MIST = 2_000_000n;

export default function CreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, login } = useAuth();
  const { mutate: createPost, isPending, isError, error } = useCreatePost();
  const { t } = useI18n();
  const isClient = useIsClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceStr, setPriceStr] = useState('0.01');
  const [supplyStr, setSupplyStr] = useState('100');
  const [showConfirm, setShowConfirm] = useState(false);

  const [successTitle, setSuccessTitle] = useState('');
  const [successDigest, setSuccessDigest] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          queryClient.invalidateQueries({ queryKey: ['feed'] });
          router.push('/');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [countdown > 0]);

  const priceMist = BigInt(Math.round(parseFloat(priceStr || '0') * 1e9));
  const maxSupply = parseInt(supplyStr || '1', 10);
  const contentSize = new TextEncoder().encode(content).length;

  if (!isClient) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div className="loading-skeleton" style={{ height: 200, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ marginBottom: 8 }}>{t('create.loginRequired')}</h2>
          <button className="btn btn--primary" onClick={login} style={{ marginTop: 8 }}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  if (successTitle) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div style={{
            background: 'rgba(93,202,165,0.06)', border: '0.5px solid rgba(93,202,165,0.3)',
            borderRadius: 14, padding: '32px 24px', textAlign: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
              <circle cx="12" cy="12" r="10" stroke="#5DCAA5" strokeWidth="1.5" />
              <path d="M8 12l3 3 5-5" stroke="#5DCAA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f0ebe4', marginBottom: 8 }}>{t('create.success')}</div>
            <div style={{ fontSize: 14, color: 'rgba(240,235,228,0.6)', marginBottom: 20 }}>&ldquo;{successTitle}&rdquo;</div>
            {successDigest && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: 'rgba(240,235,228,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Tx Digest</div>
                <div style={{ fontSize: 11, color: '#6FBCF0', fontFamily: 'monospace', wordBreak: 'break-all' }}>{successDigest}</div>
              </div>
            )}
            <div style={{ fontSize: 13, color: 'rgba(240,235,228,0.45)', marginBottom: 20 }}>{t('create.waitingIndex')}</div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 4, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', background: '#5DCAA5', borderRadius: 99, width: `${(countdown / REDIRECT_DELAY) * 100}%`, transition: 'width 0.9s linear' }} />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(240,235,228,0.35)' }}>{t('create.redirecting', { count: countdown })}</div>
            <button className="btn btn--ghost" onClick={() => { clearInterval(timerRef.current!); queryClient.invalidateQueries({ queryKey: ['feed'] }); router.push('/'); }} style={{ marginTop: 20, fontSize: 13 }}>
              {t('create.backToFeed')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setShowConfirm(true);
  };

  const handleConfirmPublish = () => {
    setShowConfirm(false);
    createPost(
      { title: title.trim(), content: content.trim(), price: priceMist, maxSupply: BigInt(maxSupply) },
      { onSuccess: (result: any) => { setSuccessTitle(title.trim()); setSuccessDigest(result?.digest ?? result?.Digest ?? ''); setCountdown(REDIRECT_DELAY); } },
    );
  };

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <div className="page-header__title">{t('create.title')}</div>
          <p className="page-header__sub">{t('create.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('create.titleLabel')}</label>
            <input className="form-input" placeholder={t('create.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('create.contentLabel')}</label>
            <textarea className="form-textarea" placeholder={t('create.contentPlaceholder')} value={content} onChange={(e) => setContent(e.target.value)} rows={10} required />
            <span className="form-hint">{t('create.contentHint')}</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('create.priceLabel')}</label>
              <input className="form-input" type="number" step="0.001" min="0" placeholder="0.01" value={priceStr} onChange={(e) => setPriceStr(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('create.supplyLabel')}</label>
              <input className="form-input" type="number" min="1" placeholder="100" value={supplyStr} onChange={(e) => setSupplyStr(e.target.value)} />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(240,235,228,0.45)' }}>{t('create.estCost')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6FBCF0' }}>~{formatSUI(GAS_ESTIMATE_MIST)} SUI</span>
          </div>

          {isError && <p className="form-error" style={{ marginBottom: 12 }}>{error instanceof Error ? error.message : t('create.publishFailed')}</p>}

          <button type="submit" className="btn btn--primary" disabled={isPending || !title.trim() || !content.trim()} style={{ width: '100%', height: 44, fontSize: 14 }}>
            {isPending ? t('create.publishing') : t('create.publish')}
          </button>
        </form>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title={t('create.confirmTitle')}
        actions={<>
          <button className="btn btn--ghost" onClick={() => setShowConfirm(false)}>{t('common.cancel')}</button>
          <button className="btn btn--primary" onClick={handleConfirmPublish}>{t('create.confirmPublish')}</button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: 'rgba(240,235,228,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('create.postLabel')}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f0ebe4' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'rgba(240,235,228,0.45)', marginTop: 4 }}>{contentSize.toLocaleString()} bytes &middot; {maxSupply} NFT &middot; {formatSUI(priceMist)} SUI/NFT</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: 'rgba(240,235,228,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t('create.costLabel')}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'rgba(240,235,228,0.55)' }}>{t('create.gasFee')}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6FBCF0' }}>~{formatSUI(GAS_ESTIMATE_MIST)} SUI</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'rgba(240,235,228,0.55)' }}>{t('create.sealEncrypt')}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#5DCAA5' }}>{t('create.free')}</span>
            </div>
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f0ebe4' }}>{t('create.total')}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#6FBCF0' }}>~{formatSUI(GAS_ESTIMATE_MIST)} SUI</span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(240,235,228,0.3)', margin: 0 }}>{t('create.revenueNote')}</p>
        </div>
      </Modal>
    </div>
  );
}
