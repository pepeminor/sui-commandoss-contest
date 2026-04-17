'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useCreatePost } from '@/hooks/useCreatePost';
import { useAuth } from '@/auth/useAuth';

export default function CreatePage() {
  const router = useRouter();
  const { isLoggedIn, login } = useAuth();
  const { mutate: createPost, isPending, isError, error } = useCreatePost();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceStr, setPriceStr] = useState('0.01');
  const [supplyStr, setSupplyStr] = useState('100');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const price = BigInt(Math.round(parseFloat(priceStr) * 1e9));
    const maxSupply = BigInt(parseInt(supplyStr, 10));

    createPost(
      { title: title.trim(), content: content.trim(), price, maxSupply },
      { onSuccess: () => router.push('/') },
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
