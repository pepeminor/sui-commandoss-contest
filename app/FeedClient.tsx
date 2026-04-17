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
    <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
      <div className="page-header">
        <h1 className="page-header__title">Feed</h1>
        <p className="page-header__sub">
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
