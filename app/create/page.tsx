'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { useCreatePost } from '@/hooks/useCreatePost';
import { useAuth } from '@/auth/useAuth';

const REDIRECT_DELAY = 8; // seconds to wait for indexer

export default function CreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, login } = useAuth();
  const { mutate: createPost, isPending, isError, error } = useCreatePost();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceStr, setPriceStr] = useState('0.01');
  const [supplyStr, setSupplyStr] = useState('100');

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

  if (!isLoggedIn) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div className="empty-state__icon" style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ marginBottom: 8 }}>Cần đăng nhập để publish</h2>
          <button className="btn btn--primary" onClick={login} style={{ marginTop: 8 }}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  // Success modal
  if (successTitle) {
    return (
      <div className="page">
        <Navbar />
        <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div style={{
            background: 'rgba(93,202,165,0.06)',
            border: '0.5px solid rgba(93,202,165,0.3)',
            borderRadius: 14,
            padding: '32px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                <circle cx="12" cy="12" r="10" stroke="#5DCAA5" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-5" stroke="#5DCAA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: '#ece9f8', marginBottom: 8 }}>
              Đã publish lên chain!
            </div>

            <div style={{ fontSize: 14, color: 'rgba(236,233,248,0.6)', marginBottom: 20 }}>
              "{successTitle}"
            </div>

            {successDigest && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 24,
                textAlign: 'left',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(236,233,248,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Tx Digest
                </div>
                <div style={{ fontSize: 11, color: '#6FBCF0', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {successDigest}
                </div>
              </div>
            )}

            <div style={{ fontSize: 13, color: 'rgba(236,233,248,0.45)', marginBottom: 20 }}>
              Đang chờ blockchain index...
            </div>

            {/* Countdown bar */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 99,
              height: 4,
              overflow: 'hidden',
              marginBottom: 12,
            }}>
              <div style={{
                height: '100%',
                background: '#5DCAA5',
                borderRadius: 99,
                width: `${(countdown / REDIRECT_DELAY) * 100}%`,
                transition: 'width 0.9s linear',
              }} />
            </div>

            <div style={{ fontSize: 12, color: 'rgba(236,233,248,0.35)' }}>
              Về Feed trong {countdown}s...
            </div>

            <button
              className="btn btn--ghost"
              onClick={() => {
                clearInterval(timerRef.current!);
                queryClient.invalidateQueries({ queryKey: ['feed'] });
                router.push('/');
              }}
              style={{ marginTop: 20, fontSize: 13 }}
            >
              Về Feed ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const price = BigInt(Math.round(parseFloat(priceStr) * 1e9));
    const maxSupply = BigInt(parseInt(supplyStr, 10));

    createPost(
      { title: title.trim(), content: content.trim(), price, maxSupply },
      {
        onSuccess: (result: any) => {
          const digest = result?.digest ?? result?.Digest ?? '';
          setSuccessTitle(title.trim());
          setSuccessDigest(digest);
          setCountdown(REDIRECT_DELAY);
        },
      },
    );
  };

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header">
          <div className="page-header__title">Publish bài mới</div>
          <p className="page-header__sub">
            Content sẽ được Seal encrypt và lưu on-chain. Buyer mint NFT để đọc.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tiêu đề</label>
            <input
              className="form-input"
              placeholder="VD: Lyrics — Ngày Hôm Đó (exclusive)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nội dung</label>
            <textarea
              className="form-textarea"
              placeholder="Nhập lyrics, story, hay bất kỳ nội dung nào..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              required
            />
            <span className="form-hint">
              Nội dung sẽ bị encrypt — chỉ người có NFT mới đọc được
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Giá (SUI)</label>
              <input
                className="form-input"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.01"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Số lượng NFT tối đa</label>
              <input
                className="form-input"
                type="number"
                min="1"
                placeholder="100"
                value={supplyStr}
                onChange={(e) => setSupplyStr(e.target.value)}
              />
            </div>
          </div>

          {isError && (
            <p className="form-error" style={{ marginBottom: 12 }}>
              {error instanceof Error ? error.message : 'Publish thất bại'}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={isPending || !title.trim() || !content.trim()}
            style={{ width: '100%', height: 44, fontSize: 14 }}
          >
            {isPending ? 'Đang publish lên chain...' : 'Publish'}
          </button>
        </form>
      </div>
    </div>
  );
}
