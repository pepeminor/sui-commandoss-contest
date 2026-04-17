/**
 * Tests that lib/sui-client.ts exports a gRPC client (not deprecated JSON-RPC).
 *
 * RED: suiClient is currently SuiJsonRpcClient — isSuiGrpcClient returns false
 * GREEN: after migration, suiClient is SuiGrpcClient
 */
import { describe, it, expect } from 'vitest';
import { isSuiGrpcClient } from '@mysten/sui/grpc';
import { isSuiGraphQLClient } from '@mysten/sui/graphql';

// Mock env so config doesn't throw
vi.stubEnv('NEXT_PUBLIC_SUI_NETWORK', 'testnet');
vi.stubEnv('NEXT_PUBLIC_SUI_RPC_URL', 'https://fullnode.testnet.sui.io:443');
vi.stubEnv('NEXT_PUBLIC_SUI_GRAPHQL_URL', 'https://sui-testnet.mystenlabs.com/graphql');

describe('sui-client exports', () => {
  it('suiClient should be a SuiGrpcClient, not JSON-RPC', async () => {
    const { suiClient } = await import('@/lib/sui-client');
    expect(isSuiGrpcClient(suiClient)).toBe(true);
  });

  it('suiClient.core should exist (gRPC core methods)', async () => {
    const { suiClient } = await import('@/lib/sui-client');
    expect(suiClient).toHaveProperty('core');
    expect(typeof (suiClient as any).core?.getObject).toBe('function');
    expect(typeof (suiClient as any).core?.listOwnedObjects).toBe('function');
    expect(typeof (suiClient as any).core?.signAndExecuteTransaction).toBe('function');
    expect(typeof (suiClient as any).core?.waitForTransaction).toBe('function');
  });

  it('graphqlClient should be a SuiGraphQLClient', async () => {
    const { graphqlClient } = await import('@/lib/sui-client');
    expect(isSuiGraphQLClient(graphqlClient)).toBe(true);
  });
});
