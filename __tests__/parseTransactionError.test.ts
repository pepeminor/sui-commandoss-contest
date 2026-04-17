/**
 * Tests that blockchain errors are parsed into user-friendly Vietnamese messages.
 *
 * RED: parseTransactionError does not exist yet
 * GREEN: parses known error patterns into friendly messages
 */
import { describe, it, expect } from 'vitest';

describe('parseTransactionError', () => {
  let parseTransactionError: (err: unknown) => string;

  beforeAll(async () => {
    const mod = await import('@/lib/errors');
    parseTransactionError = mod.parseTransactionError;
  });

  it('parses insufficient SUI balance error with MIST amount', () => {
    const raw =
      'Unable to perform gas selection due to insufficient SUI balance (in address balance or coins) for account 0x73b47aa5338a7cae880889f8ae4f74e7a113642cdc5b8f8441f3281976410c7c to satisfy required budget 185985200.';

    const msg = parseTransactionError(raw);

    // Should mention not enough SUI and convert MIST to SUI
    expect(msg).toContain('SUI');
    expect(msg).not.toContain('185985200'); // Should not show raw MIST
    expect(msg).toContain('0.186'); // ~185985200 MIST ≈ 0.186 SUI
  });

  it('parses insufficient SUI balance without specific amount', () => {
    const raw = 'Unable to perform gas selection due to insufficient SUI balance';

    const msg = parseTransactionError(raw);
    expect(msg).toContain('SUI');
    expect(msg.length).toBeGreaterThan(10); // Not just "SUI"
  });

  it('parses max supply reached error', () => {
    const raw = 'MoveAbort(_, EMaxSupplyReached)';
    const msg = parseTransactionError(raw);
    expect(msg.toLowerCase()).not.toContain('moveabort');
  });

  it('parses insufficient payment error', () => {
    const raw = 'MoveAbort(_, EInsufficientPayment)';
    const msg = parseTransactionError(raw);
    expect(msg.toLowerCase()).not.toContain('moveabort');
  });

  it('handles Error objects', () => {
    const err = new Error(
      'Unable to perform gas selection due to insufficient SUI balance for account 0xabc to satisfy required budget 500000000.',
    );

    const msg = parseTransactionError(err);
    expect(msg).toContain('0.5');
    expect(msg).toContain('SUI');
  });

  it('handles unknown errors gracefully', () => {
    const msg = parseTransactionError('some random error');
    expect(msg.length).toBeGreaterThan(5);
  });

  it('handles null/undefined', () => {
    expect(parseTransactionError(null)).toBeTruthy();
    expect(parseTransactionError(undefined)).toBeTruthy();
  });
});

describe('formatGasEstimate', () => {
  let formatGasEstimate: (gasBudgetMist: bigint | string, balanceMist?: bigint | string) => string;

  beforeAll(async () => {
    const mod = await import('@/lib/errors');
    formatGasEstimate = mod.formatGasEstimate;
  });

  it('formats gas budget in SUI', () => {
    const msg = formatGasEstimate(185985200n);
    expect(msg).toContain('0.186');
    expect(msg).toContain('SUI');
  });

  it('shows balance when provided', () => {
    const msg = formatGasEstimate(185985200n, 50000000n);
    expect(msg).toContain('0.186'); // gas needed
    expect(msg).toContain('0.05');  // balance
  });

  it('handles string inputs', () => {
    const msg = formatGasEstimate('500000000');
    expect(msg).toContain('0.5');
  });
});
