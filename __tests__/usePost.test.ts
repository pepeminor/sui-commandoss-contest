/**
 * Tests that usePost uses suiClient.core.getObject (gRPC) not suiClient.getObject (JSON-RPC).
 *
 * RED: current code calls suiClient.getObject directly — core.getObject is never called
 * GREEN: after migration, suiClient.core.getObject is called with { objectId, include: { json: true } }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockGetObject = vi.fn();
const mockCore = { getObject: mockGetObject };

vi.mock('@/lib/sui-client', () => ({
  suiClient: {
    core: mockCore,
    // Old JSON-RPC method — should NOT be called after migration
    getObject: vi.fn(() => { throw new Error('JSON-RPC getObject called — migration incomplete'); }),
  },
  graphqlClient: {},
}));

vi.stubEnv('NEXT_PUBLIC_PACKAGE_ID', '0xtest');

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('usePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls suiClient.core.getObject with objectId and json include', async () => {
    mockGetObject.mockResolvedValue({
      object: {
        objectId: '0xabc',
        json: {
          author: '0xauthor',
          title: 'My Post',
          encrypted_content: [1, 2, 3],
          price: '1000',
          max_supply: '10',
          minted: '2',
          created_at: '1700000000000',
        },
      },
    });

    const { usePost } = await import('@/hooks/usePost');
    const { result } = renderHook(() => usePost('0xabc'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetObject).toHaveBeenCalledWith(
      expect.objectContaining({
        objectId: '0xabc',
        include: expect.objectContaining({ json: true }),
      }),
    );
  });

  it('returns null when postId is undefined', async () => {
    const { usePost } = await import('@/hooks/usePost');
    const { result } = renderHook(() => usePost(undefined), { wrapper });

    // Should not call getObject when no postId
    expect(mockGetObject).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('maps json fields to PostData correctly', async () => {
    mockGetObject.mockResolvedValue({
      object: {
        objectId: '0xabc',
        json: {
          author: '0xauthor',
          title: 'Test Title',
          encrypted_content: [10, 20, 30],
          price: '5000000000',
          max_supply: '100',
          minted: '5',
          created_at: '1700000000000',
        },
      },
    });

    const { usePost } = await import('@/hooks/usePost');
    const { result } = renderHook(() => usePost('0xabc'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      objectId: '0xabc',
      author: '0xauthor',
      title: 'Test Title',
      encryptedContent: [10, 20, 30],
      price: 5000000000n,
      maxSupply: 100,
      minted: 5,
      createdAt: 1700000000000,
    });
  });
});
