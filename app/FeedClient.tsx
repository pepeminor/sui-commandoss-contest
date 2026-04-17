'use client';

import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/PostCard';
import { PACKAGE_ID } from '@/config';

export function FeedClient() {
  const { data: posts, isLoading, isError } = useFeed();

  if (!PACKAGE_ID) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="empty-state">
          <div className="empty-state__icon">🚀</div>
          <div className="empty-state__title">Contract chưa được deploy</div>
          <p className="empty-state__desc">
            Chạy <code>sui client publish</code> và thêm{' '}
            <code>NEXT_PUBLIC_PACKAGE_ID</code> vào <code>.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
          Feed
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(236,233,248,0.45)' }}>
          Nội dung exclusive từ các artist — mua NFT để đọc toàn bộ
        </p>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="loading-skeleton"
              style={{ height: 120, borderRadius: 14 }}
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="empty-state">
          <div className="empty-state__title">Không thể tải feed</div>
          <p className="empty-state__desc">Kiểm tra kết nối mạng và thử lại</p>
        </div>
      )}

      {!isLoading && !isError && posts?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">✍️</div>
          <div className="empty-state__title">Chưa có bài nào</div>
          <p className="empty-state__desc">Hãy là người đầu tiên publish bài lên chain!</p>
        </div>
      )}

      {!isLoading &&
        posts?.map((post) => <PostCard key={post.postId} post={post} />)}
    </div>
  );
}
