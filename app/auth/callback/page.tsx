'use client';

import { useEnokiFlow } from '@mysten/enoki/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallback() {
  const enokiFlow = useEnokiFlow();
  const router = useRouter();

  useEffect(() => {
    enokiFlow
      .handleAuthCallback()
      .then(() => router.replace('/'))
      .catch((err) => {
        console.error('Auth callback failed:', err);
        router.replace('/');
      });
  }, [enokiFlow, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090f',
        color: '#ece9f8',
        fontFamily: 'system-ui',
      }}
    >
      <p>Đang xác thực...</p>
    </div>
  );
}
