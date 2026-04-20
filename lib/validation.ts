import { z } from 'zod';

export const MIST_PER_SUI = 1_000_000_000n;
export const MAX_AUDIO_SIZE = 100 * 1024 * 1024;
export const SUI_ADDRESS_REGEX = /^0x[a-fA-F0-9]{64}$/;

const DECIMAL_REGEX = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function parseDecimalToUnits(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  if (!DECIMAL_REGEX.test(trimmed)) {
    throw new Error('validation.amount.invalid');
  }

  const [whole, fraction = ''] = trimmed.split('.');
  if (fraction.length > decimals) {
    throw new Error('validation.amount.decimals');
  }

  const paddedFraction = fraction.padEnd(decimals, '0');
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
}

function tryParseDecimalToUnits(value: string, decimals: number): bigint | null {
  try {
    return parseDecimalToUnits(value, decimals);
  } catch {
    return null;
  }
}

export function formatUnits(value: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function makeDecimalAmountSchema(decimals: number, minUnits: bigint, maxUnits?: bigint) {
  return z.string()
    .trim()
    .min(1, 'validation.amount.required')
    .regex(DECIMAL_REGEX, 'validation.amount.invalid')
    .refine((value) => {
      const fraction = value.split('.')[1] ?? '';
      return fraction.length <= decimals;
    }, 'validation.amount.decimals')
    .refine((value) => {
      const units = tryParseDecimalToUnits(value, decimals);
      return units == null || units >= minUnits;
    }, 'validation.amount.min')
    .refine((value) => {
      const units = tryParseDecimalToUnits(value, decimals);
      return units == null || maxUnits == null || units <= maxUnits;
    }, 'validation.amount.exceedsBalance');
}

export const suiAddressSchema = z.string()
  .trim()
  .regex(SUI_ADDRESS_REGEX, 'validation.suiAddress');

export const createPostSchema = z.object({
  title: z.string().trim().min(1, 'validation.title.required').max(120, 'validation.title.max'),
  content: z.string().trim().min(1, 'validation.content.required').max(20_000, 'validation.content.max'),
  priceSui: makeDecimalAmountSchema(9, 1_000_000n),
  maxSupply: z.number()
    .int('validation.supply.integer')
    .min(1, 'validation.supply.min')
    .max(100_000, 'validation.supply.max'),
  audioFile: z.instanceof(File).optional()
    .refine((file) => !file || file.size <= MAX_AUDIO_SIZE, 'validation.audio.size')
    .refine((file) => !file || file.type.startsWith('audio/'), 'validation.audio.type'),
});

export const commentSchema = z.object({
  postId: suiAddressSchema,
  address: suiAddressSchema,
  content: z.string().trim().min(1, 'validation.comment.required').max(500, 'validation.comment.max'),
});

export const commentPostIdSchema = z.object({
  postId: suiAddressSchema,
});

export function makeSendTokenSchema(options: {
  senderAddress?: string;
  decimals: number;
  minUnits?: bigint;
  maxUnits: bigint;
}) {
  return z.object({
    recipient: suiAddressSchema,
    amount: makeDecimalAmountSchema(options.decimals, options.minUnits ?? 1n, options.maxUnits),
    selectedCoin: z.number().int().min(0),
  }).superRefine((value, ctx) => {
    if (options.senderAddress && value.recipient.toLowerCase() === options.senderAddress.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recipient'],
        message: 'validation.recipient.self',
      });
    }
  });
}

export function makeTransferNftSchema(senderAddress?: string) {
  return z.object({
    recipient: suiAddressSchema,
  }).superRefine((value, ctx) => {
    if (senderAddress && value.recipient.toLowerCase() === senderAddress.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recipient'],
        message: 'validation.recipient.self',
      });
    }
  });
}

export interface CreatePostFormValues {
  title: string;
  content: string;
  priceSui: string;
  maxSupply: number;
  audioFile?: File;
}

export type CommentFormValues = z.input<typeof commentSchema>;
