'use client';

import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="page">
      <Navbar />
      <div className={className}>
        {children}
      </div>
    </div>
  );
}
