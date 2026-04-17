type SuiNetwork = 'testnet' | 'mainnet' | 'devnet';

const VALID_NETWORKS: readonly SuiNetwork[] = ['testnet', 'mainnet', 'devnet'];

export function sanitizeNetwork(value: unknown): SuiNetwork {
  const network = String(value ?? 'testnet').trim();
  if (VALID_NETWORKS.includes(network as SuiNetwork)) return network as SuiNetwork;

  console.warn(`Invalid NEXT_PUBLIC_SUI_NETWORK "${network}", falling back to "testnet".`);
  return 'testnet';
}

export const NETWORK = sanitizeNetwork(process.env.NEXT_PUBLIC_SUI_NETWORK);
// gRPC endpoint — same fullnode URL used for JSON-RPC (port 443)
export const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL?.trim() || 'https://fullnode.testnet.sui.io:443';
export const SUI_GRPC_URL = process.env.NEXT_PUBLIC_SUI_GRPC_URL?.trim() || SUI_RPC_URL;
export const SUI_GRAPHQL_URL = process.env.NEXT_PUBLIC_SUI_GRAPHQL_URL?.trim() || 'https://graphql.testnet.sui.io/graphql';
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID?.trim() || '';
export const SEAL_PACKAGE_ID = process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID?.trim() || '';
export const CLOCK_OBJECT_ID = '0x6';
export const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY?.trim() || '';
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
