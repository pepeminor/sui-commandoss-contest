'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    getSigner()
      .then((signer) =>
        decryptContent({ encryptedContent, nftObjectId, postObjectId, userAddress: address, signer }),
      )
      .then(setContent)
      .catch((err) => {
        console.error('Decrypt failed:', err);
        setError(t('decrypt.error'));
      })
      .finally(() => setIsLoading(false));
  }, [address, nftObjectId, postObjectId]);

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
        color: '#ff7070',
        fontSize: 13,
      }}>
        {error}
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
