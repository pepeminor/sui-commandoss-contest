'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * React-blessed way to detect client vs server.
 * Uses useSyncExternalStore with getServerSnapshot
 * instead of the useState(false) + useEffect pattern.
 */
export function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
