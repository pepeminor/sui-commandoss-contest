'use client';

import { EnokiFlowProvider } from '@mysten/enoki/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createDAppKit } from '@mysten/dapp-kit-react';
import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { ENOKI_API_KEY, NETWORK } from '@/config';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ToastProvider } from '@/components/Toast';
import { WalletModalProvider } from '@/components/WalletModalProvider';
import { MusicPlayerProvider } from '@/components/MusicPlayerProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

const networks = ['testnet', 'mainnet'];

const dAppKit = createDAppKit({
  networks,
  defaultNetwork: NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  createClient: (network) => {
    const url = network === 'mainnet'
      ? 'https://fullnode.mainnet.sui.io:443'
      : 'https://fullnode.testnet.sui.io:443';
    const transport = new GrpcWebFetchTransport({
      baseUrl: url,
      meta: {
        'Client-Sdk-Type': 'typescript',
        'Client-Sdk-Version': '2.16.0',
      },
    });
    return new SuiGrpcClient({ network, transport });
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EnokiFlowProvider apiKey={ENOKI_API_KEY}>
      <QueryClientProvider client={queryClient}>
        <DAppKitProvider dAppKit={dAppKit}>
          <I18nProvider>
            <ToastProvider>
              <WalletModalProvider>
                <MusicPlayerProvider>
                  {children}
                </MusicPlayerProvider>
              </WalletModalProvider>
            </ToastProvider>
          </I18nProvider>
        </DAppKitProvider>
      </QueryClientProvider>
    </EnokiFlowProvider>
  );
}
