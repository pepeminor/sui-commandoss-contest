'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/auth/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { useIsClient } from '@/hooks/useIsClient';
import { PageLayout } from './PageLayout';
import { Skeleton } from './Skeleton';

interface AuthGuardProps {
  children: ReactNode;
  icon?: string;
  messageKey: string;
  descKey?: string;
}

export function AuthGuard({ children, icon, messageKey, descKey }: AuthGuardProps) {
  const { isLoggedIn, login } = useAuth();
  const { t } = useI18n();
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <PageLayout>
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <Skeleton height={200} radius={14} />
        </div>
      </PageLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <PageLayout>
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          {icon && <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>}
          <h2 style={{ marginBottom: 8 }}>{t(messageKey)}</h2>
          {descKey && (
            <p className="text-muted" style={{ marginBottom: 20, fontSize: 14 }}>
              {t(descKey)}
            </p>
          )}
          <button className="btn btn--primary" onClick={login}>
            {t('nav.login')}
          </button>
        </div>
      </PageLayout>
    );
  }

  return <>{children}</>;
}
