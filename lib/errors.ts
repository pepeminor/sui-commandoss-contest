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
  message: (match: RegExpMatchArray) => string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    test: /insufficient SUI balance.*?budget\s+(\d+)/i,
    message: (m) =>
      `Khong du SUI de tra gas. Can it nhat ${mistToSui(m[1])} SUI trong vi de thuc hien giao dich.`,
  },
  {
    test: /insufficient SUI balance/i,
    message: () =>
      'Khong du SUI trong vi de tra phi giao dich. Hay nap them SUI.',
  },
  {
    test: /EMaxSupplyReached/i,
    message: () => 'Bai nay da ban het NFT.',
  },
  {
    test: /EInsufficientPayment/i,
    message: () => 'So tien khong du de mint NFT nay.',
  },
  {
    test: /EWrongPost/i,
    message: () => 'NFT khong thuoc bai viet nay.',
  },
];

export function formatGasEstimate(gasBudgetMist: bigint | string, balanceMist?: bigint | string): string {
  const gas = mistToSui(String(gasBudgetMist));
  if (balanceMist != null) {
    const bal = mistToSui(String(balanceMist));
    return `Gas: ~${gas} SUI | Balance hien tai: ${bal} SUI`;
  }
  return `Gas: ~${gas} SUI`;
}

export function parseTransactionError(err: unknown): string {
  const raw = extractMessage(err);
  if (!raw) return 'Giao dich that bai. Vui long thu lai.';

  for (const pattern of ERROR_PATTERNS) {
    const match = raw.match(pattern.test);
    if (match) return pattern.message(match);
  }

  return `Giao dich that bai: ${raw.length > 120 ? raw.slice(0, 120) + '...' : raw}`;
}
