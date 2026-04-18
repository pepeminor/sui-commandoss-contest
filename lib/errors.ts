const MIST_PER_SUI = 1_000_000_000;

function extractMessage(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  return String(err);
}

function mistToSui(mist: string): string {
  return (Number(mist) / MIST_PER_SUI).toFixed(3);
}

interface ErrorPattern {
  test: RegExp;
  key: string;
  params?: (match: RegExpMatchArray) => Record<string, string>;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    test: /insufficient SUI balance.*?budget\s+(\d+)/i,
    key: 'error.insufficientGas',
    params: (m) => ({ amount: mistToSui(m[1]) }),
  },
  {
    test: /insufficient SUI balance/i,
    key: 'error.insufficientBalance',
  },
  {
    test: /EMaxSupplyReached/i,
    key: 'error.maxSupply',
  },
  {
    test: /EInsufficientPayment/i,
    key: 'error.insufficientPayment',
  },
  {
    test: /EWrongPost/i,
    key: 'error.wrongPost',
  },
];

export interface ParsedError {
  key: string;
  params?: Record<string, string>;
}

export function parseTransactionErrorI18n(err: unknown): ParsedError {
  const raw = extractMessage(err);
  if (!raw) return { key: 'error.txFailed' };

  for (const pattern of ERROR_PATTERNS) {
    const match = raw.match(pattern.test);
    if (match) {
      return { key: pattern.key, params: pattern.params?.(match) };
    }
  }

  const detail = raw.length > 120 ? raw.slice(0, 120) + '...' : raw;
  return { key: 'error.txFailedDetail', params: { detail } };
}

export function parseTransactionError(err: unknown): string {
  const { key, params } = parseTransactionErrorI18n(err);
  // Fallback for contexts without i18n — return the key with params inlined
  let msg = key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(`{${k}}`, v);
    }
  }
  return msg;
}

export function formatGasEstimate(gasBudgetMist: bigint | string, balanceMist?: bigint | string): string {
  const gas = mistToSui(String(gasBudgetMist));
  if (balanceMist != null) {
    const bal = mistToSui(String(balanceMist));
    return `Gas: ~${gas} SUI | Balance: ${bal} SUI`;
  }
  return `Gas: ~${gas} SUI`;
}
