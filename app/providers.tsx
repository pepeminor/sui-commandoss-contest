'use client';

import { EnokiFlowProvider } from '@mysten/enoki/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { ENOKI_API_KEY, NETWORK } from '@/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

// Each config must include `network` field per @mysten/sui v2 SuiJsonRpcClientOptions
const networkConfig = {
  testnet: { url: 'https://fullnode.testnet.sui.io:443', network: 'testnet' as const },
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443', network: 'mainnet' as const },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EnokiFlowProvider apiKey={ENOKI_API_KEY}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork={NETWORK}>
          <WalletProvider>
            {children}
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </EnokiFlowProvider>
  );
}
