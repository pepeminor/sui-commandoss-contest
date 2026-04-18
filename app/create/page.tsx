'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Modal } from '@/components/Modal';
import { AuthGuard } from '@/components/AuthGuard';
import { useCreatePost } from '@/hooks/useCreatePost';
import { formatSUI } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';

const REDIRECT_DELAY = 8;
const GAS_ESTIMATE_MIST = 2_000_000n;
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB

function CreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: createPost, isPending, isError, error } = useCreatePost();
  const { t } = useI18n();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceStr, setPriceStr] = useState('0.01');
  const [supplyStr, setSupplyStr] = useState('100');
  const [showConfirm, setShowConfirm] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [successTitle, setSuccessTitle] = useState('');
  const [successDigest, setSuccessDigest] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [countdown, queryClient, router]);

  const priceMist = BigInt(Math.round(parseFloat(priceStr || '0') * 1e9));
  const maxSupply = parseInt(supplyStr || '1', 10);
  const contentSize = new TextEncoder().encode(content).length;

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AUDIO_SIZE) {
      alert(t('create.audioTooLarge'));
      return;
    }
    if (!file.type.startsWith('audio/')) {
      alert(t('create.audioInvalidType'));
      return;
    }
    setAudioFile(file);
  };

  const removeAudio = () => {
    setAudioFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (successTitle) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div className="success-box" style={{ borderRadius: 14, padding: '32px 24px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-owned" />
              <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-owned" />
            </svg>
            <div className="create-success__title">{t('create.success')}</div>
            <div className="text-secondary" style={{ fontSize: 14, marginBottom: 20 }}>&ldquo;{successTitle}&rdquo;</div>
            {successDigest && (
              <div className="info-panel" style={{ marginBottom: 24, textAlign: 'left' }}>
                <div className="post-detail__stat-label" style={{ marginBottom: 4 }}>Tx Digest</div>
                <div className="text-sui" style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{successDigest}</div>
              </div>
            )}
            <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>{t('create.waitingIndex')}</div>
            <div className="create-success__progress">
              <div className="create-success__progress-bar" style={{ width: `${(countdown / REDIRECT_DELAY) * 100}%` }} />
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>{t('create.redirecting', { count: countdown })}</div>
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
    setUploadStage('');
    setUploadProgress(0);
    createPost(
      {
        title: title.trim(),
        content: content.trim(),
        price: priceMist,
        maxSupply: BigInt(maxSupply),
        audioFile: audioFile ?? undefined,
        onUploadProgress: (stage, progress) => {
          setUploadStage(stage);
          setUploadProgress(progress);
        },
      },
      {
        onSuccess: (result: any) => {
          setSuccessTitle(title.trim());
          setSuccessDigest(result?.digest ?? result?.Digest ?? '');
          setCountdown(REDIRECT_DELAY);
          setUploadStage('');
        },
      },
    );
  };

  const stageLabel = uploadStage
    ? t(`create.stage.${uploadStage}` as any) || uploadStage
    : '';

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

          {/* Audio upload */}
          <div className="form-group">
            <label className="form-label">{t('create.audioLabel')}</label>
            {audioFile ? (
              <div className="audio-file-preview">
                <div className="audio-file-preview__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" fill="currentColor" />
                    <circle cx="18" cy="16" r="3" fill="currentColor" />
                  </svg>
                </div>
                <div className="audio-file-preview__info">
                  <div className="audio-file-preview__name">{audioFile.name}</div>
                  <div className="audio-file-preview__size">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</div>
                </div>
                <button type="button" className="audio-file-preview__remove" onClick={removeAudio} aria-label="Remove">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="audio-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioSelect}
                  style={{ display: 'none' }}
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <span className="text-muted" style={{ fontSize: 13 }}>{t('create.audioUploadHint')}</span>
                <span className="text-hint" style={{ fontSize: 11 }}>{t('create.audioMaxSize')}</span>
              </label>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">{t('create.contentLabel')}</label>
            <textarea className="form-textarea" placeholder={audioFile ? t('create.lyricsPlaceholder') : t('create.contentPlaceholder')} value={content} onChange={(e) => setContent(e.target.value)} rows={audioFile ? 6 : 10} required />
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

          <div className="info-panel" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="info-row__label" style={{ fontSize: 12 }}>{t('create.estCost')}</span>
            <span className="info-row__value" style={{ fontWeight: 700 }}>~{formatSUI(GAS_ESTIMATE_MIST)} SUI</span>
          </div>

          {/* Upload progress */}
          {isPending && audioFile && uploadStage && (
            <div className="info-panel" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="text-secondary" style={{ fontSize: 12 }}>{stageLabel}</span>
                <span className="text-hint" style={{ fontSize: 12 }}>{Math.round(uploadProgress * 100)}%</span>
              </div>
              <div className="create-success__progress">
                <div className="create-success__progress-bar" style={{ width: `${uploadProgress * 100}%`, background: '#E8623A' }} />
              </div>
            </div>
          )}

          {isError && <p className="form-error" style={{ marginBottom: 12 }}>{error instanceof Error ? error.message : t('create.publishFailed')}</p>}

          <button type="submit" className="btn btn--primary btn--full" disabled={isPending || !title.trim() || !content.trim()}>
            {isPending ? (audioFile ? stageLabel || t('create.publishing') : t('create.publishing')) : t('create.publish')}
          </button>
        </form>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title={t('create.confirmTitle')}
        actions={<>
          <button className="btn btn--ghost" onClick={() => setShowConfirm(false)}>{t('common.cancel')}</button>
          <button className="btn btn--primary" onClick={handleConfirmPublish}>{t('create.confirmPublish')}</button>
        </>}
      >
        <div className="mint-confirm">
          <div className="info-panel">
            <div className="post-detail__stat-label" style={{ marginBottom: 6 }}>{t('create.postLabel')}</div>
            <div className="text-primary" style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              {contentSize.toLocaleString()} bytes &middot; {maxSupply} NFT &middot; {formatSUI(priceMist)} SUI/NFT
              {audioFile && <> &middot; {(audioFile.size / (1024 * 1024)).toFixed(1)} MB audio</>}
            </div>
          </div>
          <div className="info-panel">
            <div className="post-detail__stat-label" style={{ marginBottom: 8 }}>{t('create.costLabel')}</div>
            <div className="info-row">
              <span className="info-row__label">{t('create.gasFee')}</span>
              <span className="info-row__value">~{formatSUI(GAS_ESTIMATE_MIST)} SUI</span>
            </div>
            <div className="info-row">
              <span className="info-row__label">{audioFile ? t('create.walrusUpload') : t('create.sealEncrypt')}</span>
              <span className="text-owned" style={{ fontSize: 13, fontWeight: 600 }}>{t('create.free')}</span>
            </div>
            <div className="info-divider" />
            <div className="info-row">
              <span className="info-row__value--primary">{t('create.total')}</span>
              <span className="info-row__value--lg">~{formatSUI(GAS_ESTIMATE_MIST)} SUI</span>
            </div>
          </div>
          <p className="hint-text">{t('create.revenueNote')}</p>
        </div>
      </Modal>
    </div>
  );
}

export default function CreatePage() {
  return (
    <AuthGuard icon="🔒" messageKey="create.loginRequired">
      <CreateContent />
    </AuthGuard>
  );
}
