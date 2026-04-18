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
