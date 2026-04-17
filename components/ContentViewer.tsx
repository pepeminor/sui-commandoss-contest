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
      <div style={{ padding: '24px 0' }}>
        <div className="loading-skeleton" style={{ height: 16, marginBottom: 8 }} />
        <div className="loading-skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }} />
        <div className="loading-skeleton" style={{ height: 16, width: '60%' }} />
        <p style={{ fontSize: 12, color: 'rgba(240,235,228,0.3)', marginTop: 12 }}>
          {t('decrypt.loading')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 16,
        background: 'rgba(255,70,70,0.08)',
        border: '0.5px solid rgba(255,70,70,0.2)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <span style={{ color: '#ff7070', fontSize: 13 }}>{error}</span>
        <button
          className="btn btn--ghost"
          onClick={handleRetry}
          style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}
        >
          {t('decrypt.retry')}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      fontSize: 15, lineHeight: 1.75, color: '#f0ebe4',
      whiteSpace: 'pre-wrap', padding: '24px 0',
      borderTop: '0.5px solid rgba(255,255,255,0.06)', marginTop: 16,
    }}>
      {content}
    </div>
  );
}
