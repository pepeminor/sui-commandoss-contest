'use client';

interface SkeletonProps {
  height: number;
  width?: string | number;
  radius?: number;
  className?: string;
}

export function Skeleton({ height, width, radius = 14, className }: SkeletonProps) {
  return (
    <div
      className={`loading-skeleton${className ? ` ${className}` : ''}`}
      style={{ height, width, borderRadius: radius }}
    />
  );
}

interface SkeletonListProps {
  count?: number;
  height?: number;
  gap?: number;
  radius?: number;
}

export function SkeletonList({ count = 3, height = 120, gap = 10, radius = 14 }: SkeletonListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} radius={radius} />
      ))}
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
}

export function SkeletonGrid({ count = 6 }: SkeletonGridProps) {
  return (
    <div className="feed-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={0} width="100%" radius={14} className="skeleton-card-art" />
          <Skeleton height={14} width="70%" radius={4} />
          <Skeleton height={10} width="40%" radius={4} />
        </div>
      ))}
    </div>
  );
}
