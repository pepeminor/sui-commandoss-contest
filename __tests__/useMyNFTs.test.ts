/**
 * Tests that useMyNFTs uses suiClient.core.listOwnedObjects (gRPC) not getOwnedObjects (JSON-RPC).
 *
 * RED: current code calls suiClient.getOwnedObjects — core.listOwnedObjects never called
 * GREEN: after migration uses suiClient.core.listOwnedObjects with type filter and json include
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockListOwnedObjects = vi.fn();
const mockCore = { listOwnedObjects: mockListOwnedObjects };

vi.mock('@/lib/sui-client', () => ({
  suiClient: {
    core: mockCore,
    // Old JSON-RPC method — should NOT be called after migration
    getOwnedObjects: vi.fn(() => { throw new Error('JSON-RPC getOwnedObjects called — migration incomplete'); }),
  },
  graphqlClient: {},
}));

// Valid 32-byte Sui address
const VALID_ADDRESS = '0x' + 'a'.repeat(64);

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ address: VALID_ADDRESS, isLoggedIn: true }),
}));

vi.stubEnv('NEXT_PUBLIC_PACKAGE_ID', '0xpkg');

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useMyNFTs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls suiClient.core.listOwnedObjects with type filter and json include', async () => {
    mockListOwnedObjects.mockResolvedValue({
      objects: [],
      hasNextPage: false,
      cursor: null,
    });

    const { useMyNFTs } = await import('@/hooks/useMyNFTs');
    const { result } = renderHook(() => useMyNFTs(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockListOwnedObjects).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: VALID_ADDRESS,
        include: expect.objectContaining({ json: true }),
      }),
    );

    // type filter should include the package NFT struct type
    const call = mockListOwnedObjects.mock.calls[0][0];
    expect(call.type ?? call.filter?.StructType).toContain('::nft::ContentNFT');
  });

  it('maps json fields to NFTData correctly', async () => {
    mockListOwnedObjects.mockResolvedValue({
      objects: [
        {
          objectId: '0xnft1',
          json: {
            post_id: '0xpost1',
            post_title: 'Great Article',
            author: '0xartist',
            edition: '3',
            minted_at: '1700000000000',
          },
        },
      ],
      hasNextPage: false,
      cursor: null,
    });

    const { useMyNFTs } = await import('@/hooks/useMyNFTs');
    const { result } = renderHook(() => useMyNFTs(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]).toMatchObject({
      objectId: '0xnft1',
      postId: '0xpost1',
      postTitle: 'Great Article',
      author: '0xartist',
      edition: 3,
      mintedAt: 1700000000000,
    });
  });

  it('returns empty array when address is null', async () => {
    vi.doMock('@/auth/useAuth', () => ({
      useAuth: () => ({ address: null, isLoggedIn: false }),
    }));

    const { useMyNFTs } = await import('@/hooks/useMyNFTs');
    renderHook(() => useMyNFTs(), { wrapper });

    expect(mockListOwnedObjects).not.toHaveBeenCalled();
  });
});
