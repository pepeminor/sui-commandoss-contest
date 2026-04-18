'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  desc?: string | ReactNode;
}

export function EmptyState({ icon, title, desc }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <div className="empty-state__title">{title}</div>
      {desc && (
        <p className="empty-state__desc">
          {typeof desc === 'string' ? desc : desc}
        </p>
      )}
    </div>
  );
}
