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
    <div className="auth-callback">
      <p>Authenticating...</p>
    </div>
  );
}
