'use client';

import { usePost } from '@/hooks/usePost';
import { useHasAccess, useNFTForPost } from '@/hooks/useMyNFTs';
import { MintButton } from '@/components/MintButton';
import { ContentViewer } from '@/components/ContentViewer';
import { formatSUI, shortenAddress, timeAgo } from '@/lib/utils';
import { AddressAvatar } from '@/components/AddressAvatar';

interface Props {
  postId: string;
}

export function PostDetailClient({ postId }: Props) {
  const { data: post, isLoading } = usePost(postId);
  const hasAccess = useHasAccess(postId);
  const nft = useNFTForPost(postId);

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="loading-skeleton" style={{ height: 32, width: '60%', marginBottom: 12 }} />
        <div className="loading-skeleton" style={{ height: 16, width: '40%', marginBottom: 24 }} />
        <div className="loading-skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <div className="empty-state__title">Post không tồn tại</div>
      </div>
    );
  }

  const soldOut = post.minted >= post.maxSupply;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <AddressAvatar address={post.author} size={44} />
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 4 }}>
            {post.title}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'rgba(236,233,248,0.45)',
            }}
          >
            <span>{shortenAddress(post.author)}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.025)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#6FBCF0' }}>
            {formatSUI(post.price)} SUI
          </div>
          <div style={{ fontSize: 10, color: 'rgba(236,233,248,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Giá
          </div>
        </div>
        <div style={{ width: 0.5, background: 'rgba(255,255,255,0.06)' }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#ece9f8' }}>
            {post.minted}/{post.maxSupply}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(236,233,248,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Đã bán
          </div>
        </div>
        {hasAccess && nft && (
          <>
            <div style={{ width: 0.5, background: 'rgba(255,255,255,0.06)' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#5DCAA5' }}>
                #{nft.edition}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(236,233,248,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Edition
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content or locked */}
      {hasAccess && nft ? (
        <ContentViewer
          encryptedContent={post.encryptedContent}
          nftObjectId={nft.objectId}
          postObjectId={postId}
        />
      ) : (
        <div>
          {/* Blurred preview */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '20px 0',
              borderTop: '0.5px solid rgba(255,255,255,0.06)',
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: 'rgba(236,233,248,0.3)',
                filter: 'blur(3px)',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              Đây là nội dung exclusive chỉ dành cho người có NFT. Mua NFT để đọc toàn bộ
              lyrics, story, và nội dung đặc biệt từ artist này. Nội dung được bảo vệ bằng
              Seal encryption on-chain — chỉ ví của bạn mới có thể giải mã sau khi mua.
            </p>
          </div>

          <MintButton postId={postId} price={post.price} soldOut={soldOut} />
        </div>
      )}
    </div>
  );
}
