'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navbar } from '@/components/Navbar';
import { Modal } from '@/components/Modal';
import { AuthGuard } from '@/components/AuthGuard';
import { useCreatePost } from '@/hooks/useCreatePost';
import { formatSUI } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { createPostSchema, parseDecimalToUnits, type CreatePostFormValues } from '@/lib/validation';

const REDIRECT_DELAY = 8;
const GAS_ESTIMATE_MIST = 2_000_000n;

interface I18nError extends Error {
  i18n?: {
    key: string;
    params?: Record<string, string>;
  };
}

function getTransactionDigest(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const record = result as Record<string, unknown>;
  if (typeof record.digest === 'string') return record.digest;
  if (typeof record.Digest === 'string') return record.Digest;
  const transaction = record.Transaction;
  if (transaction && typeof transaction === 'object') {
    const txRecord = transaction as Record<string, unknown>;
    if (typeof txRecord.digest === 'string') return txRecord.digest;
  }
  return '';
}

function CreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: createPost, isPending, isError, error } = useCreatePost();
  const { t } = useI18n();

  const [showConfirm, setShowConfirm] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [successTitle, setSuccessTitle] = useState('');
  const [successDigest, setSuccessDigest] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isValid },
  } = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      content: '',
      priceSui: '0.01',
      maxSupply: 100,
      audioFile: undefined,
    },
  });

  const title = useWatch({ control, name: 'title' }) ?? '';
  const content = useWatch({ control, name: 'content' }) ?? '';
  const priceStr = useWatch({ control, name: 'priceSui' }) ?? '0';
  const maxSupply = Number(useWatch({ control, name: 'maxSupply' }) || 1);
  const audioFile = useWatch({ control, name: 'audioFile' }) ?? null;

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

  const priceMist = createPostSchema.shape.priceSui.safeParse(priceStr).success
    ? parseDecimalToUnits(priceStr, 9)
    : 0n;
  const contentSize = new TextEncoder().encode(content).length;

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = createPostSchema.shape.audioFile.safeParse(file);
    if (!result.success) {
      alert(t(result.error.issues[0]?.message ?? 'validation.audio.type'));
      e.target.value = '';
      return;
    }
    setValue('audioFile', file, { shouldDirty: true, shouldValidate: true });
  };

  const removeAudio = () => {
    setValue('audioFile', undefined, { shouldDirty: true, shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (successTitle) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div className="success-box" style={{ borderRadius: 14, padding: '32px 24px', textAlign: 'center' }}>
            <i className="ri-checkbox-circle-line text-owned" style={{ fontSize: 48, display: 'block', textAlign: 'center', marginBottom: 16 }} />
            <div className="create-success__title">{t('create.success')}</div>
            <div className="text-secondary" style={{ fontSize: 14, marginBottom: 20 }}>&ldquo;{successTitle}&rdquo;</div>
            {successDigest && (
              <div className="info-panel" style={{ marginBottom: 24, textAlign: 'left' }}>
                <div className="post-detail__stat-label" style={{ marginBottom: 4 }}>{t('create.txDigest')}</div>
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

  const onSubmit = () => {
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
        onSuccess: (result) => {
          setSuccessTitle(title.trim());
          setSuccessDigest(getTransactionDigest(result));
          setCountdown(REDIRECT_DELAY);
          setUploadStage('');
        },
      },
    );
  };

  const stageLabel = uploadStage
    ? t(`create.stage.${uploadStage}`) || uploadStage
    : '';

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <div className="page-header__title">{t('create.title')}</div>
          <p className="page-header__sub">{t('create.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">{t('create.titleLabel')}</label>
            <input className="form-input" placeholder={t('create.titlePlaceholder')} {...register('title')} />
            {errors.title && <span className="form-hint form-hint--error">{t(errors.title.message ?? '')}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">{t('create.contentLabel')}</label>
            <textarea className="form-textarea" placeholder={audioFile ? t('create.lyricsPlaceholder') : t('create.contentPlaceholder')} rows={audioFile ? 6 : 10} {...register('content')} />
            <span className="form-hint">{t('create.contentHint')}</span>
            {errors.content && <span className="form-hint form-hint--error">{t(errors.content.message ?? '')}</span>}
          </div>

          {/* Audio upload */}
          <div className="form-group">
            <label className="form-label">{t('create.audioLabel')}</label>
            {audioFile ? (
              <div className="audio-file-preview">
                <div className="audio-file-preview__icon">
                  <i className="ri-music-2-fill" style={{ fontSize: 20 }} />
                </div>
                <div className="audio-file-preview__info">
                  <div className="audio-file-preview__name">{audioFile.name}</div>
                  <div className="audio-file-preview__size">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</div>
                </div>
                <button type="button" className="audio-file-preview__remove" onClick={removeAudio} aria-label={t('create.removeAudio')}>
                  <i className="ri-close-line" style={{ fontSize: 14 }} />
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
                <i className="ri-music-2-line text-muted" style={{ fontSize: 24 }} />
                <span className="text-muted" style={{ fontSize: 13 }}>{t('create.audioUploadHint')}</span>
                <span className="text-hint" style={{ fontSize: 11 }}>{t('create.audioMaxSize')}</span>
              </label>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('create.priceLabel')}</label>
              <input className="form-input" inputMode="decimal" placeholder="0.01" {...register('priceSui')} />
              {errors.priceSui && <span className="form-hint form-hint--error">{t(errors.priceSui.message ?? '')}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">{t('create.supplyLabel')}</label>
              <input className="form-input" type="number" min="1" max="100000" step="1" placeholder="100" {...register('maxSupply', { valueAsNumber: true })} />
              {errors.maxSupply && <span className="form-hint form-hint--error">{t(errors.maxSupply.message ?? '')}</span>}
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

          {isError && (
            <p className="form-error" style={{ marginBottom: 12 }}>
              {(error as I18nError | null)?.i18n
                ? t((error as I18nError).i18n!.key, (error as I18nError).i18n!.params)
                : error instanceof Error
                  ? error.message
                  : t('create.publishFailed')}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--full" disabled={isPending || !isValid}>
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
              {audioFile && <> &middot; {t('create.audioSize', { size: (audioFile.size / (1024 * 1024)).toFixed(1) })}</>}
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
