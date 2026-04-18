'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { suiClient } from '@/lib/sui-client';

export interface TokenBalance {
  coinType: string;
  symbol: string;
  totalBalance: bigint;
  decimals: number;
}

function extractSymbol(coinType: string): string {
  // "0x2::sui::SUI" → "SUI", "0x...::wal::WAL" → "WAL"
  const parts = coinType.split('::');
  return parts[parts.length - 1] || coinType;
}

function getDecimals(symbol: string): number {
  if (symbol === 'SUI') return 9;
  if (symbol === 'WAL') return 9;
  return 9; // default
}

export function useTokenBalances() {
  const { address } = useAuth();

  return useQuery({
    queryKey: ['tokenBalances', address],
    queryFn: async (): Promise<TokenBalance[]> => {
      const { balances } = await suiClient.core.listBalances({ owner: address! });
      const result: TokenBalance[] = balances.map((b) => {
        const symbol = extractSymbol(b.coinType);
        return {
          coinType: b.coinType,
          symbol,
          totalBalance: BigInt(b.coinBalance || b.balance || '0'),
          decimals: getDecimals(symbol),
        };
      });

      // Sort: SUI first, then WAL, then rest alphabetically
      return result.sort((a, b) => {
        if (a.symbol === 'SUI') return -1;
        if (b.symbol === 'SUI') return 1;
        if (a.symbol === 'WAL') return -1;
        if (b.symbol === 'WAL') return 1;
        return a.symbol.localeCompare(b.symbol);
      });
    },
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const frac = amount % divisor;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}
