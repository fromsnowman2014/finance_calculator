# Phase 2 Implementation Plan

## Overview

This document contains the detailed technical plan for implementing Phase 2 PRD features.

---

## Sprint 1: Global Currency Support (Week 1-2)

### Goals
- Support 170+ currencies
- Integrate real-time exchange rate API
- Implement exchange rate caching system

### Tasks

#### 1.1 Currency Data Structure Design

**File**: `src/utils/currencies.ts`

```typescript
export interface Currency {
  code: string;          // ISO 4217 code (USD, KRW, etc.)
  name: string;          // Currency name
  nameLocal?: string;    // Local name (for future i18n)
  symbol: string;        // Symbol ($, ₩, etc.)
  flag: string;          // Flag emoji
  locale: string;        // Number format locale
  decimals: number;      // Decimal places
}

export const CURRENCIES: Currency[] = [
  // Major currencies
  {
    code: 'USD',
    name: 'US Dollar',
    nameLocal: 'US Dollar', // Will be 'US 달러' in Korean
    symbol: '$',
    flag: '🇺🇸',
    locale: 'en-US',
    decimals: 2
  },
  {
    code: 'EUR',
    name: 'Euro',
    nameLocal: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    locale: 'en-US', // Use en-US for consistency
    decimals: 2
  },
  {
    code: 'GBP',
    name: 'British Pound',
    nameLocal: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    locale: 'en-GB',
    decimals: 2
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    nameLocal: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    locale: 'ja-JP',
    decimals: 0
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    nameLocal: 'South Korean Won',
    symbol: '₩',
    flag: '🇰🇷',
    locale: 'ko-KR',
    decimals: 0
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    nameLocal: 'Chinese Yuan',
    symbol: '¥',
    flag: '🇨🇳',
    locale: 'zh-CN',
    decimals: 2
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    nameLocal: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    locale: 'en-AU',
    decimals: 2
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    nameLocal: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    locale: 'en-CA',
    decimals: 2
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    nameLocal: 'Swiss Franc',
    symbol: 'Fr',
    flag: '🇨🇭',
    locale: 'de-CH',
    decimals: 2
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    nameLocal: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    locale: 'en-SG',
    decimals: 2
  },
  // Add 160+ more currencies...
];

/**
 * Get currency information by code
 * @param code - ISO 4217 currency code
 * @returns Currency object or undefined
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

/**
 * Popular currencies for quick access
 */
export const POPULAR_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'KRW',
  'CNY', 'AUD', 'CAD', 'CHF', 'SGD'
];

/**
 * Get display name for currency (supports future i18n)
 * @param code - Currency code
 * @param locale - Optional locale (default: 'en')
 * @returns Display name
 */
export function getCurrencyName(code: string, locale: string = 'en'): string {
  const currency = getCurrency(code);
  if (!currency) return code;

  // For now, return English name
  // Future: return currency.nameLocal based on locale
  return currency.name;
}
```

#### 1.2 Exchange Rate API Service Implementation

**File**: `src/services/exchangeRate.ts`

```typescript
interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CachedRates extends ExchangeRates {
  timestamp: number;
}

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_API_KEY;

/**
 * Singleton service for exchange rate operations
 */
export class ExchangeRateService {
  private static instance: ExchangeRateService;

  private constructor() {}

  static getInstance(): ExchangeRateService {
    if (!this.instance) {
      this.instance = new ExchangeRateService();
    }
    return this.instance;
  }

  /**
   * Get cached exchange rates
   * @returns Cached rates or null if expired/missing
   */
  private getCachedRates(): CachedRates | null {
    if (typeof window === 'undefined') return null;

    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    try {
      const data: CachedRates = JSON.parse(cached);
      const now = Date.now();

      // Use cache if within 24 hours
      if (now - data.timestamp < CACHE_DURATION) {
        return data;
      }
    } catch (error) {
      console.error('Failed to parse cached rates:', error);
    }

    return null;
  }

  /**
   * Save exchange rates to cache
   * @param rates - Exchange rates to cache
   */
  private setCachedRates(rates: ExchangeRates): void {
    if (typeof window === 'undefined') return;

    const data: CachedRates = {
      ...rates,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to cache rates:', error);
    }
  }

  /**
   * Fetch latest exchange rates from API
   * @param baseCurrency - Base currency code (default: USD)
   * @returns Exchange rates object
   */
  async fetchLatestRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    // Check cache first
    const cached = this.getCachedRates();
    if (cached && cached.base === baseCurrency) {
      return cached;
    }

    try {
      // Use ExchangeRate-API
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.result === 'error') {
        throw new Error(data['error-type']);
      }

      const rates: ExchangeRates = {
        base: data.base_code,
        date: data.time_last_update_utc,
        rates: data.conversion_rates
      };

      // Cache the rates
      this.setCachedRates(rates);

      return rates;
    } catch (error) {
      console.error('Exchange rate fetch error:', error);

      // Use stale cache if API fails
      const cached = this.getCachedRates();
      if (cached) {
        console.warn('Using stale cached rates due to API error');
        return cached;
      }

      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   * @param amount - Amount to convert
   * @param from - Source currency code
   * @param to - Target currency code
   * @returns Converted amount
   */
  async convert(
    amount: number,
    from: string,
    to: string
  ): Promise<number> {
    if (from === to) return amount;

    const rates = await this.fetchLatestRates(from);
    const rate = rates.rates[to];

    if (!rate) {
      throw new Error(`Exchange rate not available for ${to}`);
    }

    return amount * rate;
  }

  /**
   * Force refresh cached rates
   * @param baseCurrency - Base currency code
   * @returns Fresh exchange rates
   */
  async refreshRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    localStorage.removeItem(CACHE_KEY);
    return this.fetchLatestRates(baseCurrency);
  }

  /**
   * Get multiple currency conversions at once
   * @param amount - Amount to convert
   * @param from - Source currency
   * @param toCurrencies - Array of target currencies
   * @returns Map of currency code to converted amount
   */
  async convertMultiple(
    amount: number,
    from: string,
    toCurrencies: string[]
  ): Promise<Map<string, number>> {
    const rates = await this.fetchLatestRates(from);
    const results = new Map<string, number>();

    for (const to of toCurrencies) {
      if (from === to) {
        results.set(to, amount);
      } else {
        const rate = rates.rates[to];
        if (rate) {
          results.set(to, amount * rate);
        }
      }
    }

    return results;
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();
```

#### 1.3 API Routes

**File**: `src/app/api/currency/rates/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exchangeRateService } from '@/services/exchangeRate';

/**
 * GET /api/currency/rates
 * Fetch latest exchange rates
 * Query params:
 *   - base: Base currency code (default: USD)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const base = searchParams.get('base') || 'USD';

  try {
    const rates = await exchangeRateService.fetchLatestRates(base);

    return NextResponse.json({
      success: true,
      data: rates
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/currency/convert/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exchangeRateService } from '@/services/exchangeRate';

/**
 * POST /api/currency/convert
 * Convert amount between currencies
 * Body:
 *   - amount: number
 *   - from: string (currency code)
 *   - to: string (currency code)
 */
export async function POST(request: NextRequest) {
  try {
    const { amount, from, to } = await request.json();

    if (!amount || !from || !to) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const converted = await exchangeRateService.convert(
      Number(amount),
      from,
      to
    );

    return NextResponse.json({
      success: true,
      data: {
        amount: Number(amount),
        from,
        to,
        converted,
        rate: converted / Number(amount)
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

#### 1.4 Currency Selector Component

**File**: `src/components/calculator/CurrencySelector.tsx`

```typescript
'use client';

import React, { useState, useMemo } from 'react';
import { Check, Search } from 'lucide-react';
import { CURRENCIES, POPULAR_CURRENCIES, getCurrency, getCurrencyName } from '@/utils/currencies';

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  label = 'Currency'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCurrency = getCurrency(value);

  const filteredCurrencies = useMemo(() => {
    if (!search) {
      // Show popular currencies first
      const popular = CURRENCIES.filter(c => POPULAR_CURRENCIES.includes(c.code));
      const others = CURRENCIES.filter(c => !POPULAR_CURRENCIES.includes(c.code));
      return [...popular, ...others];
    }

    const query = search.toLowerCase();
    return CURRENCIES.filter(c =>
      c.code.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query)
    );
  }, [search]);

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 transition-colors"
        >
          <span className="text-2xl">{selectedCurrency?.flag}</span>
          <span className="font-medium">{selectedCurrency?.code}</span>
          <span className="text-sm text-gray-500">{selectedCurrency?.symbol}</span>
          <span className="flex-1 text-left text-sm text-gray-600 dark:text-gray-400">
            {getCurrencyName(value)}
          </span>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
              {/* Search input */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search currency..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Currency list */}
              <div className="overflow-y-auto max-h-80">
                {filteredCurrencies.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No currencies found
                  </div>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => {
                        onChange(currency.code);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <span className="text-2xl">{currency.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-sm text-gray-500">{currency.symbol}</span>
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {getCurrencyName(currency.code)}
                        </div>
                      </div>
                      {currency.code === value && (
                        <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

#### 1.5 Exchange Rate Info Component

**File**: `src/components/calculator/ExchangeRateInfo.tsx`

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { exchangeRateService } from '@/services/exchangeRate';
import { formatDistanceToNow } from 'date-fns';

interface ExchangeRateInfoProps {
  baseCurrency: string;
  targetCurrency: string;
}

export const ExchangeRateInfo: React.FC<ExchangeRateInfoProps> = ({
  baseCurrency,
  targetCurrency
}) => {
  const [rate, setRate] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRate = async () => {
    setError(null);
    try {
      const rates = await exchangeRateService.fetchLatestRates(baseCurrency);
      setRate(rates.rates[targetCurrency]);
      setLastUpdate(rates.date);
    } catch (err) {
      console.error('Failed to load exchange rate:', err);
      setError('Failed to load exchange rate');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await exchangeRateService.refreshRates(baseCurrency);
      await loadRate();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRate();
  }, [baseCurrency, targetCurrency]);

  if (!rate || baseCurrency === targetCurrency) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      {error ? (
        <span className="text-red-500">{error}</span>
      ) : (
        <>
          <span>
            1 {baseCurrency} = {rate.toFixed(4)} {targetCurrency}
          </span>
          <span className="text-xs">
            (updated {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })})
          </span>
        </>
      )}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
        title="Refresh exchange rate"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
```

---

## Sprint 2: Compounding Frequency & Tax Features (Week 3-4)

### 2.1 Advanced Calculation Logic

**File**: `src/utils/finance.ts` (Update)

```typescript
export type CompoundingFrequency =
  | 'daily'      // 365 times per year
  | 'monthly'    // 12 times per year
  | 'quarterly'  // 4 times per year
  | 'annually'   // Once per year
  | 'continuous'; // Continuous compounding

export interface CalculationParams {
  initialBalance: number;
  monthlyContribution: number;
  years: number;
  interestRate: number;
  compoundingFrequency: CompoundingFrequency;
  taxRate?: number;
  inflationRate?: number;
}

export interface YearlyData {
  year: number;
  balance: number;
  contributions: number;
  interest: number;
  afterTaxBalance: number;
  realValue: number;
  taxPaid: number;
}

/**
 * Get compounding periods per year
 */
function getCompoundingPeriods(frequency: CompoundingFrequency): number {
  switch (frequency) {
    case 'daily': return 365;
    case 'monthly': return 12;
    case 'quarterly': return 4;
    case 'annually': return 1;
    case 'continuous': return Infinity;
  }
}

/**
 * Calculate compound interest with advanced features
 */
export function calculateCompoundInterestAdvanced(
  params: CalculationParams
): YearlyData[] {
  const {
    initialBalance,
    monthlyContribution,
    years,
    interestRate,
    compoundingFrequency,
    taxRate = 0,
    inflationRate = 0
  } = params;

  const n = getCompoundingPeriods(compoundingFrequency);
  const r = interestRate / 100;
  const data: YearlyData[] = [];

  let balance = initialBalance;
  let totalContributions = initialBalance;

  for (let year = 0; year <= years; year++) {
    // Calculate interest growth
    if (compoundingFrequency === 'continuous') {
      // Continuous compounding: A = Pe^(rt)
      balance = balance * Math.exp(r);
    } else {
      // Standard compounding: A = P(1 + r/n)^(nt)
      balance = balance * Math.pow(1 + r / n, n);
    }

    // Add monthly contributions (at end of year)
    const yearlyContribution = monthlyContribution * 12;
    balance += yearlyContribution;
    totalContributions += yearlyContribution;

    // Calculate interest earned
    const interest = balance - totalContributions;

    // Apply tax
    const taxAmount = interest * (taxRate / 100);
    const afterTaxInterest = interest - taxAmount;
    const afterTaxBalance = totalContributions + afterTaxInterest;

    // Adjust for inflation
    const inflationAdjusted = afterTaxBalance / Math.pow(1 + inflationRate / 100, year);

    data.push({
      year,
      balance: Math.round(balance),
      contributions: Math.round(totalContributions),
      interest: Math.round(interest),
      afterTaxBalance: Math.round(afterTaxBalance),
      realValue: Math.round(inflationAdjusted),
      taxPaid: Math.round(taxAmount)
    });
  }

  return data;
}

/**
 * Calculate required monthly contribution to reach target
 */
export function calculateRequiredContribution(
  targetAmount: number,
  initialBalance: number,
  years: number,
  interestRate: number,
  compoundingFrequency: CompoundingFrequency = 'monthly'
): number {
  const n = getCompoundingPeriods(compoundingFrequency);
  if (n === Infinity) {
    // Use monthly for continuous
    return calculateRequiredContribution(
      targetAmount,
      initialBalance,
      years,
      interestRate,
      'monthly'
    );
  }

  const r = interestRate / 100 / n;
  const totalPeriods = years * n;

  // FV = P(1+r)^n + PMT * [((1+r)^n - 1) / r]
  // Rearrange: PMT = (FV - P(1+r)^n) * r / ((1+r)^n - 1)

  const futureValueOfInitial = initialBalance * Math.pow(1 + r, totalPeriods);
  const remaining = targetAmount - futureValueOfInitial;

  if (remaining <= 0) return 0;

  const periodicPayment = remaining * r / (Math.pow(1 + r, totalPeriods) - 1);

  // Convert to monthly if needed
  if (compoundingFrequency === 'monthly') {
    return Math.round(periodicPayment);
  } else {
    // Convert periodic payment to monthly
    const monthsPerPeriod = 12 / n;
    return Math.round(periodicPayment / monthsPerPeriod);
  }
}
```

---

## Environment Variables

**File**: `.env.local.example`

```bash
# ExchangeRate-API
# Get free API key from https://www.exchangerate-api.com
NEXT_PUBLIC_EXCHANGE_API_KEY=your_api_key_here

# Optional: Fixer API (backup)
# NEXT_PUBLIC_FIXER_API_KEY=your_fixer_api_key_here
```

**File**: `.env.local` (create this, add to .gitignore)

```bash
NEXT_PUBLIC_EXCHANGE_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

---

## Testing

### Unit Tests

**File**: `__tests__/services/exchangeRate.test.ts`

```typescript
import { exchangeRateService } from '@/services/exchangeRate';

describe('ExchangeRateService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should fetch and cache exchange rates', async () => {
    const rates = await exchangeRateService.fetchLatestRates('USD');

    expect(rates.base).toBe('USD');
    expect(rates.rates).toHaveProperty('KRW');
    expect(rates.rates).toHaveProperty('EUR');
  });

  it('should convert currency correctly', async () => {
    const converted = await exchangeRateService.convert(100, 'USD', 'KRW');

    expect(converted).toBeGreaterThan(100);
  });

  it('should return same amount for same currency', async () => {
    const converted = await exchangeRateService.convert(100, 'USD', 'USD');

    expect(converted).toBe(100);
  });

  it('should use cached rates', async () => {
    const rates1 = await exchangeRateService.fetchLatestRates('USD');
    const rates2 = await exchangeRateService.fetchLatestRates('USD');

    expect(rates1.date).toBe(rates2.date);
  });
});
```

**File**: `__tests__/utils/finance.test.ts`

```typescript
import { calculateRequiredContribution, getCompoundingPeriods } from '@/utils/finance';

describe('Financial Calculations', () => {
  it('should calculate required contribution', () => {
    const contribution = calculateRequiredContribution(
      100000, // target
      0,      // initial
      10,     // years
      5,      // interest rate
      'monthly'
    );

    expect(contribution).toBeGreaterThan(0);
    expect(contribution).toBeLessThan(1000);
  });

  it('should return 0 if initial balance exceeds target', () => {
    const contribution = calculateRequiredContribution(
      100000,
      150000,
      10,
      5,
      'monthly'
    );

    expect(contribution).toBe(0);
  });
});
```

---

## Deployment Checklist

### Phase 2.1 Pre-deployment
- [ ] All currency data validated
- [ ] API key environment variable configured
- [ ] Exchange rate caching tested
- [ ] Mobile responsive testing
- [ ] Lighthouse performance test (> 90 score)
- [ ] Playwright E2E tests passing
- [ ] Currency conversion accuracy verified
- [ ] Error handling for API failures tested

### Performance Targets
- API response time: < 200ms (with cache)
- First screen load: < 2s
- Currency conversion: < 100ms (local calculation)

---

## Next Steps

Based on this implementation plan:
1. Start with Sprint 1 sequentially
2. Code review and testing after each Sprint
3. Collect and incorporate user feedback
4. Proceed to Phase 2.2, 2.3

---

**Created**: December 3, 2024
**Version**: 1.0
**Next Update**: After Sprint 1 completion
