/**
 * Tests that useCreatePost uses suiClient.core.signAndExecuteTransaction (gRPC).
 *
 * RED: current code calls suiClient.signAndExecuteTransaction directly
 * GREEN: uses suiClient.core.signAndExecuteTransaction + core.waitForTransaction
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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
    // Old JSON-RPC methods — should NOT be called after migration
    signAndExecuteTransaction: vi.fn(() => { throw new Error('JSON-RPC signAndExecuteTransaction called'); }),
    waitForTransaction: vi.fn(() => { throw new Error('JSON-RPC waitForTransaction called'); }),
  },
  graphqlClient: {},
  signAndExecute: async (transaction: unknown, signer: unknown) => {
    let result;
    try {
      result = await mockCore.signAndExecuteTransaction({ transaction, signer });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const budget = raw.match(/budget\s+(\d+)/i)?.[1];
      throw new Error(budget ? `Insufficient SUI for gas. Need at least ${(Number(budget) / 1e9).toFixed(3)} SUI.` : raw);
    }
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

vi.mock('@/lib/seal', () => ({
  encryptContent: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  encryptRaw: vi.fn().mockResolvedValue(new Uint8Array([4, 5, 6])),
}));

vi.stubEnv('NEXT_PUBLIC_PACKAGE_ID', '0xpkg');

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useCreatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls suiClient.core.signAndExecuteTransaction not the top-level method', async () => {
    mockSignAndExecute.mockResolvedValue({
      $kind: 'Transaction',
      Transaction: { digest: '0xdigest123', status: { success: true } },
    });
    mockWaitForTransaction.mockResolvedValue({});

    const { useCreatePost } = await import('@/hooks/useCreatePost');
    const { result } = renderHook(() => useCreatePost(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        title: 'Test',
        content: 'Content',
        price: 1000000000n,
        maxSupply: 10n,
      });
    });

    expect(mockSignAndExecute).toHaveBeenCalledTimes(1);
    expect(mockSignAndExecute).toHaveBeenCalledWith(
      expect.objectContaining({ signer: expect.anything() }),
    );
  });

  it('calls waitForTransaction after successful execution', async () => {
    const txResult = {
      $kind: 'Transaction',
      Transaction: { digest: '0xdigest456', status: { success: true } },
    };
    mockSignAndExecute.mockResolvedValue(txResult);
    mockWaitForTransaction.mockResolvedValue({});

    const { useCreatePost } = await import('@/hooks/useCreatePost');
    const { result } = renderHook(() => useCreatePost(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        title: 'Test',
        content: 'Content',
        price: 1000000000n,
        maxSupply: 10n,
      });
    });

    expect(mockWaitForTransaction).toHaveBeenCalledTimes(1);
  });

  it('throws when transaction fails', async () => {
    mockSignAndExecute.mockResolvedValue({
      $kind: 'FailedTransaction',
      FailedTransaction: {
        digest: '0xfailed',
        status: { success: false, error: 'Insufficient gas' },
      },
    });

    const { useCreatePost } = await import('@/hooks/useCreatePost');
    const { result } = renderHook(() => useCreatePost(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          title: 'Test',
          content: 'Content',
          price: 1000000000n,
          maxSupply: 10n,
        }),
      ).rejects.toThrow();
    });
  });

  it('shows user-friendly error when insufficient SUI balance', async () => {
    mockSignAndExecute.mockRejectedValue(
      new Error(
        'Unable to perform gas selection due to insufficient SUI balance (in address balance or coins) for account 0x73b47aa5338a7cae880889f8ae4f74e7a113642cdc5b8f8441f3281976410c7c to satisfy required budget 185985200.',
      ),
    );

    const { useCreatePost } = await import('@/hooks/useCreatePost');
    const { result } = renderHook(() => useCreatePost(), { wrapper });

    await act(async () => {
      result.current.mutate({
        title: 'Test',
        content: 'Content',
        price: 1000000000n,
        maxSupply: 10n,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Error message should be user-friendly, not raw blockchain error
    const msg = result.current.error!.message;
    expect(msg).toContain('SUI');
    expect(msg).toContain('0.186');
    expect(msg).not.toContain('185985200');
  });
});
