'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { decryptContent, clearSessionKey } from '@/lib/seal';
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
        encryptedContent, nftObjectId, postObjectId, userAddress: address, signer,
      });
      if (isLatestRequest()) setContent(result);
    } catch (err) {
      console.error('Decrypt failed (attempt 1):', err instanceof Error ? err.message : err);

      // Clear stale session key and retry once
      clearSessionKey(address);
      try {
        const signer = await getSigner();
        const result = await decryptContent({
          encryptedContent, nftObjectId, postObjectId, userAddress: address, signer,
        });
        if (isLatestRequest()) setContent(result);
      } catch (retryErr) {
        console.error('Decrypt failed (attempt 2):', retryErr instanceof Error ? retryErr.message : retryErr);
        if (isLatestRequest()) setError(t('decrypt.error'));
      }
    } finally {
      if (isLatestRequest()) setIsLoading(false);
    }
  }, [address, nftObjectId, postObjectId, encryptedContent, getSigner, t]);

  useEffect(() => {
    attemptDecrypt();
  }, [attemptDecrypt]);

  const handleRetry = () => {
    if (address) clearSessionKey(address);
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
