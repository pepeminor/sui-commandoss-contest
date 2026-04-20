import { describe, expect, it } from 'vitest';
import {
  commentSchema,
  createPostSchema,
  makeSendTokenSchema,
  parseDecimalToUnits,
  SUI_ADDRESS_REGEX,
} from '@/lib/validation';

const ADDRESS = `0x${'1'.repeat(64)}`;

describe('validation helpers', () => {
  it('requires full Sui addresses', () => {
    expect(SUI_ADDRESS_REGEX.test(ADDRESS)).toBe(true);
    expect(SUI_ADDRESS_REGEX.test('0x1234')).toBe(false);
    expect(SUI_ADDRESS_REGEX.test(`0x${'z'.repeat(64)}`)).toBe(false);
  });

  it('parses decimal strings to atomic units without float precision', () => {
    expect(parseDecimalToUnits('0.001', 9)).toBe(1_000_000n);
    expect(parseDecimalToUnits('1.234567891', 9)).toBe(1_234_567_891n);
    expect(() => parseDecimalToUnits('1.2345678911', 9)).toThrow();
    expect(() => parseDecimalToUnits('1e9', 9)).toThrow();
  });

  it('validates create post product limits', () => {
    const valid = createPostSchema.safeParse({
      title: 'Song',
      content: 'Lyrics',
      priceSui: '0.001',
      maxSupply: 100,
    });
    expect(valid.success).toBe(true);

    expect(createPostSchema.safeParse({
      title: '',
      content: 'Lyrics',
      priceSui: '0.001',
      maxSupply: 100,
    }).success).toBe(false);
    expect(createPostSchema.safeParse({
      title: 'Song',
      content: 'Lyrics',
      priceSui: '0.000000001',
      maxSupply: 100,
    }).success).toBe(false);
    expect(createPostSchema.safeParse({
      title: 'Song',
      content: 'Lyrics',
      priceSui: '0.001',
      maxSupply: 100_001,
    }).success).toBe(false);
  });

  it('validates comments', () => {
    expect(commentSchema.safeParse({
      postId: ADDRESS,
      address: ADDRESS,
      content: 'Nice track',
    }).success).toBe(true);
    expect(commentSchema.safeParse({
      postId: ADDRESS,
      address: ADDRESS,
      content: 'x'.repeat(501),
    }).success).toBe(false);
  });

  it('validates send token amount against available balance', () => {
    const schema = makeSendTokenSchema({
      senderAddress: ADDRESS,
      decimals: 9,
      maxUnits: 1_000_000_000n,
    });

    expect(schema.safeParse({
      recipient: `0x${'2'.repeat(64)}`,
      amount: '1',
      selectedCoin: 0,
    }).success).toBe(true);
    expect(schema.safeParse({
      recipient: `0x${'2'.repeat(64)}`,
      amount: '1.000000001',
      selectedCoin: 0,
    }).success).toBe(false);
    expect(schema.safeParse({
      recipient: ADDRESS,
      amount: '0.5',
      selectedCoin: 0,
    }).success).toBe(false);
  });
});
