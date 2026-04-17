import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { NETWORK, SUI_GRPC_URL, SUI_GRAPHQL_URL } from '@/config';

// gRPC client — recommended transport (JSON-RPC deprecated July 2026)
export const suiClient = new SuiGrpcClient({
  network: NETWORK,
  baseUrl: SUI_GRPC_URL,
});

// GraphQL client for event queries (feed)
export const graphqlClient = new SuiGraphQLClient({
  url: SUI_GRAPHQL_URL,
  network: NETWORK,
});
