import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import type { Transaction } from '@mysten/sui/transactions';
import type { Signer } from '@mysten/sui/cryptography';
import { NETWORK, SUI_GRPC_URL, SUI_GRAPHQL_URL } from '@/config';
import { parseTransactionErrorI18n } from './errors';

const SDK_VERSION = '2.16.0';

// gRPC transport with required SDK headers (fullnode rejects requests without them)
const transport = new GrpcWebFetchTransport({
  baseUrl: SUI_GRPC_URL,
  meta: {
    'Client-Sdk-Type': 'typescript',
    'Client-Sdk-Version': SDK_VERSION,
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

/** Sign, execute, and wait for a transaction. Throws i18n-enriched errors. */
export async function signAndExecute(tx: Transaction, signer: Signer, sender: string) {
  tx.setSender(sender);

  let result;
  try {
    result = await suiClient.core.signAndExecuteTransaction({ transaction: tx, signer });
  } catch (e) {
    const parsed = parseTransactionErrorI18n(e);
    throw Object.assign(new Error(parsed.fallback), { i18n: parsed });
  }

  if (result.$kind === 'FailedTransaction') {
    const parsed = parseTransactionErrorI18n(result.FailedTransaction?.status?.error);
    throw Object.assign(new Error(parsed.fallback), { i18n: parsed });
  }

  await suiClient.core.waitForTransaction({ result });
  return result;
}
