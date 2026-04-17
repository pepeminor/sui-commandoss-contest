import { SuiJsonRpcClient, JsonRpcHTTPTransport, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { SuiGraphQLClient } from '@mysten/sui/graphql';

// Full-featured JSON RPC client (getOwnedObjects, signAndExecuteTransaction, etc.)
export const suiClient = new SuiJsonRpcClient({
  transport: new JsonRpcHTTPTransport({ url: getJsonRpcFullnodeUrl('testnet') }),
  network: 'testnet',
});

// GraphQL client for event queries (feed)
export const graphqlClient = new SuiGraphQLClient({
  url: 'https://sui-testnet.mystenlabs.com/graphql',
  network: 'testnet',
});
