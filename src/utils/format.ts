import { CalculatorState } from "@/types/calculator";

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'KRW', symbol: '₩', label: 'Korean Won' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

export const formatCurrency = (value: number, currencyCode: CurrencyCode = 'USD'): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  
  // Special handling for KRW/JPY (no decimals usually)
  const isZeroDecimal = ['KRW', 'JPY'].includes(currencyCode);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: isZeroDecimal ? 0 : 0,
  }).format(value);
};

export const formatCompactCurrency = (value: number, currencyCode: CurrencyCode = 'USD'): string => {
  const isZeroDecimal = ['KRW', 'JPY'].includes(currencyCode);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    notation: 'compact',
    maximumFractionDigits: isZeroDecimal ? 0 : 1,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
};
