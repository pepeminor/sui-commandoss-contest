'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { decryptContent } from '@/lib/seal';
import { useAuth } from '@/auth/useAuth';
import { useI18n } from '@/i18n/I18nProvider';

interface ContentViewerProps {
  encryptedContent: number[];
  nftObjectId: string;
  postObjectId: string;
}

export function ContentViewer({ encryptedContent, nftObjectId, postObjectId }: ContentViewerProps) {
  const { address, getSigner } = useAuth();
  const { t } = useI18n();
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const decryptRequestIdRef = useRef(0);

  // Stable fingerprint so we don't re-decrypt when the array reference changes but content is the same
  const contentFingerprint = useMemo(
    () => encryptedContent.length > 0 ? `${encryptedContent.length}:${encryptedContent[0]}:${encryptedContent[encryptedContent.length - 1]}` : '',
    [encryptedContent],
  );
  // Keep a stable ref to the latest encryptedContent for use inside the callback
  const encryptedContentRef = useRef(encryptedContent);
  // eslint-disable-next-line react-hooks/refs
  encryptedContentRef.current = encryptedContent;

  const attemptDecrypt = useCallback(async () => {
    const requestId = decryptRequestIdRef.current + 1;
    decryptRequestIdRef.current = requestId;
    const isLatestRequest = () => decryptRequestIdRef.current === requestId;

    if (!address) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setContent(null);

    try {
      const signer = await getSigner();
      const result = await decryptContent({
        encryptedContent: encryptedContentRef.current, nftObjectId, postObjectId, userAddress: address, signer,
      });
      if (isLatestRequest()) setContent(result);
    } catch (err) {
      console.error('Decrypt failed:', err instanceof Error ? err.message : err);
      if (isLatestRequest()) setError(t('decrypt.error'));
    } finally {
      if (isLatestRequest()) setIsLoading(false);
    }
  }, [address, nftObjectId, postObjectId, contentFingerprint, getSigner, t]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    attemptDecrypt();
  }, [attemptDecrypt]);

  const handleRetry = () => {
    attemptDecrypt();
  };

  if (isLoading) {
    return (
      <div className="content-viewer__loading">
        <div className="loading-skeleton" style={{ height: 16, marginBottom: 8 }} />
        <div className="loading-skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }} />
        <div className="loading-skeleton" style={{ height: 16, width: '60%' }} />
        <p className="hint-text" style={{ marginTop: 12 }}>
          {t('decrypt.loading')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box content-viewer__error">
        <span className="text-error">{error}</span>
        <button className="btn btn--ghost btn--sm" onClick={handleRetry}>
          {t('decrypt.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="content-viewer__body">
      {content}
    </div>
  );
}
