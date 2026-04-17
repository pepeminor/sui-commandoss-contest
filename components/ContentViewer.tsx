'use client';

import { useState, useEffect } from 'react';
import { decryptContent } from '@/lib/seal';
import { useAuth } from '@/auth/useAuth';

interface ContentViewerProps {
  encryptedContent: number[];
  nftObjectId: string;
  postObjectId: string;
}

export function ContentViewer({ encryptedContent, nftObjectId, postObjectId }: ContentViewerProps) {
  const { address, getSigner } = useAuth();
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    getSigner()
      .then((signer) =>
        decryptContent({
          encryptedContent,
          nftObjectId,
          postObjectId,
          userAddress: address,
          signer,
        }),
      )
      .then(setContent)
      .catch((err) => {
        console.error('Decrypt failed:', err);
        setError('Không thể giải mã nội dung. Thử lại sau.');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, nftObjectId, postObjectId]);

  if (isLoading) {
    return (
      <div style={{ padding: '24px 0' }}>
        <div className="loading-skeleton" style={{ height: 16, marginBottom: 8 }} />
        <div className="loading-skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }} />
        <div className="loading-skeleton" style={{ height: 16, width: '60%' }} />
        <p style={{ fontSize: 12, color: 'rgba(236,233,248,0.3)', marginTop: 12 }}>
          Đang giải mã nội dung...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 16,
          background: 'rgba(255,70,70,0.08)',
          border: '0.5px solid rgba(255,70,70,0.2)',
          borderRadius: 10,
          color: '#ff7070',
          fontSize: 13,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        fontSize: 15,
        lineHeight: 1.75,
        color: '#ece9f8',
        whiteSpace: 'pre-wrap',
        padding: '24px 0',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        marginTop: 16,
      }}
    >
      {content}
    </div>
  );
}
