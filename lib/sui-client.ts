import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { NETWORK, SUI_GRPC_URL, SUI_GRAPHQL_URL } from '@/config';

// gRPC transport with required SDK headers (fullnode rejects requests without them)
const transport = new GrpcWebFetchTransport({
  baseUrl: SUI_GRPC_URL,
  meta: {
    'Client-Sdk-Type': 'typescript',
    'Client-Sdk-Version': '2.16.0',
  },
});

// gRPC client — recommended transport (JSON-RPC deprecated July 2026)
export const suiClient = new SuiGrpcClient({
  network: NETWORK,
  transport,
});

// GraphQL client for event queries (feed)
export const graphqlClient = new SuiGraphQLClient({
  url: SUI_GRAPHQL_URL,
  network: NETWORK,
});
