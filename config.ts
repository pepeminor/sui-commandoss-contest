export const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet') as 'testnet' | 'mainnet' | 'devnet';
// gRPC endpoint — same fullnode URL used for JSON-RPC (port 443)
export const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL ?? 'https://fullnode.testnet.sui.io:443';
export const SUI_GRPC_URL = process.env.NEXT_PUBLIC_SUI_GRPC_URL ?? SUI_RPC_URL;
export const SUI_GRAPHQL_URL = process.env.NEXT_PUBLIC_SUI_GRAPHQL_URL ?? 'https://graphql.testnet.sui.io/graphql';
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? '';
export const SEAL_PACKAGE_ID = process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID ?? '';
export const CLOCK_OBJECT_ID = '0x6';
export const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY ?? '';
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
