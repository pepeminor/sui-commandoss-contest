/**
 * Tests that useMintNFT uses suiClient.core.signAndExecuteTransaction (gRPC).
 *
 * RED: current code calls suiClient.signAndExecuteTransaction directly
 * GREEN: uses suiClient.core.signAndExecuteTransaction + core.waitForTransaction
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockSignAndExecute = vi.fn();
const mockWaitForTransaction = vi.fn();
const mockCore = {
  signAndExecuteTransaction: mockSignAndExecute,
  waitForTransaction: mockWaitForTransaction,
  getBalance: vi.fn().mockResolvedValue({ balance: { balance: '1000000000' } }),
  simulateTransaction: vi.fn().mockResolvedValue({ Transaction: { status: { gasUsed: { computationCost: '1000', storageCost: '2000', storageRebate: '500' } } } }),
};

vi.mock('@/lib/sui-client', () => ({
  suiClient: {
    core: mockCore,
    signAndExecuteTransaction: vi.fn(() => { throw new Error('JSON-RPC signAndExecuteTransaction called'); }),
    waitForTransaction: vi.fn(() => { throw new Error('JSON-RPC waitForTransaction called'); }),
  },
  graphqlClient: {},
  signAndExecute: async (transaction: unknown, signer: unknown) => {
    const result = await mockCore.signAndExecuteTransaction({ transaction, signer });
    if (result.$kind === 'FailedTransaction') {
      throw new Error(result.FailedTransaction?.status?.error || 'Transaction failed');
    }
    await mockCore.waitForTransaction({ result });
    return result;
  },
}));

// Valid 32-byte Sui address
const VALID_ADDRESS = '0x' + '1'.repeat(64);

const mockGetSigner = vi.fn().mockResolvedValue({ signTransaction: vi.fn(), toSuiAddress: () => VALID_ADDRESS });
vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ address: VALID_ADDRESS, isLoggedIn: true, getSigner: mockGetSigner }),
}));

vi.stubEnv('NEXT_PUBLIC_PACKAGE_ID', '0xpkg');

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useMintNFT', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls suiClient.core.signAndExecuteTransaction not the top-level method', async () => {
    mockSignAndExecute.mockResolvedValue({
      $kind: 'Transaction',
      Transaction: { digest: '0xmintdigest', status: { success: true } },
    });
    mockWaitForTransaction.mockResolvedValue({});

    const { useMintNFT } = await import('@/hooks/useMintNFT');
    const { result } = renderHook(() => useMintNFT(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ postId: '0xpost1', price: 1000000000n });
    });

    expect(mockSignAndExecute).toHaveBeenCalledTimes(1);
  });

  it('calls waitForTransaction after successful mint', async () => {
    const txResult = {
      $kind: 'Transaction',
      Transaction: { digest: '0xmintdigest', status: { success: true } },
    };
    mockSignAndExecute.mockResolvedValue(txResult);
    mockWaitForTransaction.mockResolvedValue({});

    const { useMintNFT } = await import('@/hooks/useMintNFT');
    const { result } = renderHook(() => useMintNFT(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ postId: '0xpost1', price: 1000000000n });
    });

    expect(mockWaitForTransaction).toHaveBeenCalledTimes(1);
  });

  it('throws on failed transaction', async () => {
    mockSignAndExecute.mockResolvedValue({
      $kind: 'FailedTransaction',
      FailedTransaction: {
        digest: '0xfail',
        status: { success: false, error: 'Max supply reached' },
      },
    });

    const { useMintNFT } = await import('@/hooks/useMintNFT');
    const { result } = renderHook(() => useMintNFT(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ postId: '0xpost1', price: 1000000000n }),
      ).rejects.toThrow();
    });
  });
});
