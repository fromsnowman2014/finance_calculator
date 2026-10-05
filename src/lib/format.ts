export const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'KRW', symbol: '₩' },
  { code: 'EUR', symbol: '€' },
  { code: 'JPY', symbol: '¥' },
  { code: 'GBP', symbol: '£' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];
export type Lang = 'en' | 'ko';

export const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  CURRENCIES.some((c) => c.code === value);

export const currencySymbol = (code: CurrencyCode) => CURRENCIES.find((c) => c.code === code)?.symbol ?? '$';

const ZERO_DECIMAL = new Set<CurrencyCode>(['KRW', 'JPY']);

export interface MoneyOptions {
  /** Show cents (prices). Ignored for zero-decimal currencies. */
  cents?: boolean;
  signed?: boolean;
  compact?: boolean;
}

export const createFormatters = (currency: CurrencyCode, lang: Lang) => {
  const zeroDecimal = ZERO_DECIMAL.has(currency);
  const cache = new Map<string, Intl.NumberFormat>();
  const get = (key: string, make: () => Intl.NumberFormat) => {
    let f = cache.get(key);
    if (!f) {
      f = make();
      cache.set(key, f);
    }
    return f;
  };

  const money = (value: number, options: MoneyOptions = {}) => {
    if (!Number.isFinite(value)) return '—';
    const { cents = false, signed = false, compact = false } = options;
    const locale = compact && lang === 'ko' && currency === 'KRW' ? 'ko-KR' : 'en-US';
    const digits = zeroDecimal ? 0 : cents ? 2 : 0;
    // Compact values ("$1.2M") keep one decimal; small ones round like regular amounts.
    const maxDigits = compact && Math.abs(value) >= 1000 ? 1 : digits;
    const key = `m|${locale}|${digits}|${maxDigits}|${signed}|${compact}`;
    const formatter = get(key, () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: compact ? 'compact' : 'standard',
        minimumFractionDigits: compact ? 0 : digits,
        maximumFractionDigits: maxDigits,
        signDisplay: signed ? 'exceptZero' : 'auto',
      }),
    );
    // Avoid "-$0" for tiny negative rounding noise.
    const rounded = Math.abs(value) < (digits ? 0.005 : 0.5) ? 0 : value;
    return formatter.format(rounded);
  };

  const pct = (value: number, decimals = 1, signed = false) => {
    if (!Number.isFinite(value)) return '—';
    const key = `p|${decimals}|${signed}`;
    const formatter = get(key, () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        signDisplay: signed ? 'exceptZero' : 'auto',
      }),
    );
    return `${formatter.format(value)}%`;
  };

  const num = (value: number, decimals = 0) => {
    if (!Number.isFinite(value)) return '—';
    return get(`n|${decimals}`, () =>
      new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: 0 }),
    ).format(value);
  };

  return { money, pct, num, symbol: currencySymbol(currency), currency };
};

export type Formatters = ReturnType<typeof createFormatters>;

/** Formats a number for an input box: thousands separators, trimmed decimals. */
export const formatInputNumber = (value: number, maxDecimals = 2) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: maxDecimals, useGrouping: true }).format(value)
    : '';

/** Parses user input like "12,500.5" or "1 000". Returns NaN when invalid. */
export const parseInputNumber = (raw: string) => {
  const cleaned = raw.replace(/[,\s_]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return NaN;
  return /^-?\d*\.?\d*$/.test(cleaned) ? Number(cleaned) : NaN;
};

/** Multiplier for slider ranges so they stay useful in low-value currencies. */
export const currencyScale = (code: CurrencyCode) => (code === 'KRW' ? 1000 : code === 'JPY' ? 100 : 1);
