# Phase 2 구현 계획 (Implementation Plan)

## 개요

이 문서는 Phase 2 PRD의 기능들을 실제로 구현하기 위한 상세한 기술 계획을 담고 있습니다.

---

## Sprint 1: 전세계 통화 지원 (Week 1-2)

### 목표
- 170+ 통화 지원
- 실시간 환율 API 통합
- 환율 캐싱 시스템

### 작업 항목

#### 1.1 통화 데이터 구조 설계

**파일**: `src/utils/currencies.ts`

```typescript
export interface Currency {
  code: string;          // ISO 4217 코드 (USD, KRW 등)
  name: string;          // 통화명
  symbol: string;        // 심볼 ($, ₩ 등)
  flag: string;          // 국기 이모지
  locale: string;        // 숫자 포맷 로케일
  decimals: number;      // 소수점 자릿수
}

export const CURRENCIES: Currency[] = [
  // 주요 통화
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', locale: 'en-US', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', locale: 'de-DE', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', locale: 'en-GB', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', locale: 'ja-JP', decimals: 0 },
  { code: 'KRW', name: 'Korean Won', symbol: '₩', flag: '🇰🇷', locale: 'ko-KR', decimals: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', locale: 'zh-CN', decimals: 2 },
  // ... 170+ 통화
];

// 통화 코드로 통화 정보 조회
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

// 인기 통화 필터
export const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY', 'AUD', 'CAD'];
```

#### 1.2 환율 API 서비스 구현

**파일**: `src/services/exchangeRate.ts`

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
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간
const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_API_KEY;

export class ExchangeRateService {
  private static instance: ExchangeRateService;

  private constructor() {}

  static getInstance(): ExchangeRateService {
    if (!this.instance) {
      this.instance = new ExchangeRateService();
    }
    return this.instance;
  }

  // 캐시에서 환율 조회
  private getCachedRates(): CachedRates | null {
    if (typeof window === 'undefined') return null;

    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedRates = JSON.parse(cached);
    const now = Date.now();

    // 24시간 이내 캐시면 사용
    if (now - data.timestamp < CACHE_DURATION) {
      return data;
    }

    return null;
  }

  // 캐시에 환율 저장
  private setCachedRates(rates: ExchangeRates): void {
    if (typeof window === 'undefined') return;

    const data: CachedRates = {
      ...rates,
      timestamp: Date.now()
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }

  // API에서 최신 환율 가져오기
  async fetchLatestRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    // 캐시 확인
    const cached = this.getCachedRates();
    if (cached && cached.base === baseCurrency) {
      return cached;
    }

    try {
      // ExchangeRate-API 사용
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
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

      // 캐시 저장
      this.setCachedRates(rates);

      return rates;
    } catch (error) {
      console.error('Exchange rate fetch error:', error);

      // 캐시된 데이터라도 있으면 반환 (오래되었어도)
      const cached = this.getCachedRates();
      if (cached) {
        console.warn('Using stale cached rates due to API error');
        return cached;
      }

      throw error;
    }
  }

  // 통화 변환
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

  // 캐시 강제 새로고침
  async refreshRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    localStorage.removeItem(CACHE_KEY);
    return this.fetchLatestRates(baseCurrency);
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();
```

#### 1.3 API Route 생성

**파일**: `src/app/api/currency/rates/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exchangeRateService } from '@/services/exchangeRate';

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

**파일**: `src/app/api/currency/convert/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exchangeRateService } from '@/services/exchangeRate';

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

#### 1.4 UI 컴포넌트 개선

**파일**: `src/components/calculator/CurrencySelector.tsx` (새 파일)

```typescript
'use client';

import React, { useState, useMemo } from 'react';
import { Check, Search } from 'lucide-react';
import { CURRENCIES, POPULAR_CURRENCIES, getCurrency } from '@/utils/currencies';

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCurrency = getCurrency(value);

  const filteredCurrencies = useMemo(() => {
    if (!search) {
      // 검색어 없으면 인기 통화 우선 표시
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 transition-colors"
      >
        <span className="text-2xl">{selectedCurrency?.flag}</span>
        <span className="font-medium">{selectedCurrency?.code}</span>
        <span className="text-sm text-gray-500">{selectedCurrency?.symbol}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* 검색 입력 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search currency..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 통화 목록 */}
          <div className="overflow-y-auto max-h-80">
            {filteredCurrencies.map((currency) => (
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
                  <div className="text-sm text-gray-500 truncate">{currency.name}</div>
                </div>
                {currency.code === value && (
                  <Check className="w-5 h-5 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 1.5 환율 정보 표시 컴포넌트

**파일**: `src/components/calculator/ExchangeRateInfo.tsx` (새 파일)

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { exchangeRateService } from '@/services/exchangeRate';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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

  const loadRate = async () => {
    try {
      const rates = await exchangeRateService.fetchLatestRates(baseCurrency);
      setRate(rates.rates[targetCurrency]);
      setLastUpdate(rates.date);
    } catch (error) {
      console.error('Failed to load exchange rate:', error);
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
      <span>
        1 {baseCurrency} = {rate.toFixed(4)} {targetCurrency}
      </span>
      <span className="text-xs">
        ({formatDistanceToNow(new Date(lastUpdate), { addSuffix: true, locale: ko })})
      </span>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
        title="환율 새로고침"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
```

### 테스트 계획

```typescript
// __tests__/services/exchangeRate.test.ts
describe('ExchangeRateService', () => {
  it('should fetch and cache exchange rates', async () => {
    const rates = await exchangeRateService.fetchLatestRates('USD');
    expect(rates.base).toBe('USD');
    expect(rates.rates).toHaveProperty('KRW');
  });

  it('should convert currency correctly', async () => {
    const converted = await exchangeRateService.convert(100, 'USD', 'KRW');
    expect(converted).toBeGreaterThan(100);
  });

  it('should return same amount for same currency', async () => {
    const converted = await exchangeRateService.convert(100, 'USD', 'USD');
    expect(converted).toBe(100);
  });
});
```

---

## Sprint 2: 복리 빈도 & 세금 기능 (Week 3-4)

### 2.1 복리 빈도 계산 로직

**파일**: `src/utils/finance.ts` (업데이트)

```typescript
export type CompoundingFrequency =
  | 'daily'      // 365일
  | 'monthly'    // 12개월
  | 'quarterly'  // 4분기
  | 'annually'   // 1년
  | 'continuous'; // 연속 복리

export interface CalculationParams {
  initialBalance: number;
  monthlyContribution: number;
  years: number;
  interestRate: number;
  compoundingFrequency: CompoundingFrequency;
  taxRate?: number;
  inflationRate?: number;
}

function getCompoundingPeriods(frequency: CompoundingFrequency): number {
  switch (frequency) {
    case 'daily': return 365;
    case 'monthly': return 12;
    case 'quarterly': return 4;
    case 'annually': return 1;
    case 'continuous': return Infinity;
  }
}

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
    if (compoundingFrequency === 'continuous') {
      // 연속 복리: A = Pe^(rt)
      balance = balance * Math.exp(r);
    } else {
      // 일반 복리: A = P(1 + r/n)^(nt)
      balance = balance * Math.pow(1 + r / n, n);
    }

    // 월별 납입 추가 (연말 기준)
    const yearlyContribution = monthlyContribution * 12;
    balance += yearlyContribution;
    totalContributions += yearlyContribution;

    // 이자 수익 계산
    const interest = balance - totalContributions;

    // 세후 이자
    const taxAmount = interest * (taxRate / 100);
    const afterTaxInterest = interest - taxAmount;
    const afterTaxBalance = totalContributions + afterTaxInterest;

    // 인플레이션 조정
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
```

### 2.2 세금 UI 컴포넌트

**파일**: `src/components/calculator/TaxSettings.tsx` (새 파일)

```typescript
'use client';

import React from 'react';
import { InputControl } from './InputControl';

interface TaxSettingsProps {
  capitalGainsTax: number;
  onCapitalGainsTaxChange: (value: number) => void;
}

const TAX_PRESETS = [
  { name: '한국', rate: 22, description: '양도소득세' },
  { name: '미국 (장기)', rate: 15, description: '장기 자본이득세' },
  { name: '일본', rate: 20.315, description: '양도소득세' },
  { name: '싱가포르', rate: 0, description: '비과세' },
];

export const TaxSettings: React.FC<TaxSettingsProps> = ({
  capitalGainsTax,
  onCapitalGainsTaxChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">국가별 세율 프리셋</h3>
        <div className="grid grid-cols-2 gap-2">
          {TAX_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onCapitalGainsTaxChange(preset.rate)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:border-indigo-500 transition-colors text-left"
            >
              <div className="font-medium">{preset.name}</div>
              <div className="text-xs text-gray-500">{preset.rate}% - {preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      <InputControl
        label="자본 이득세율"
        value={capitalGainsTax}
        onChange={onCapitalGainsTaxChange}
        min={0}
        max={50}
        step={0.1}
        suffix="%"
        description="투자 수익에 대한 세금"
      />
    </div>
  );
};
```

---

## Sprint 3-4: 시나리오 비교 & 목표 계산 (Week 5-8)

### 3.1 Zustand Store 확장

**파일**: `src/store/useCalculatorStore.ts` (업데이트)

```typescript
interface Scenario {
  id: string;
  name: string;
  state: CalculatorState;
  color: string;
}

interface CalculatorStoreExtended extends CalculatorState {
  // 시나리오 관련
  scenarios: Scenario[];
  activeScenarioId: string | null;
  compareMode: boolean;

  addScenario: (name: string) => void;
  removeScenario: (id: string) => void;
  updateScenario: (id: string, state: Partial<CalculatorState>) => void;
  setActiveScenario: (id: string | null) => void;
  toggleCompareMode: () => void;

  // 목표 기반 계산
  goalMode: boolean;
  targetAmount: number;
  setGoalMode: (enabled: boolean) => void;
  setTargetAmount: (amount: number) => void;
  calculateRequiredContribution: () => number;
}

export const useCalculatorStore = create<CalculatorStoreExtended>((set, get) => ({
  // ... 기존 상태

  // 시나리오
  scenarios: [],
  activeScenarioId: null,
  compareMode: false,

  addScenario: (name) => {
    const state = get();
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name,
      state: {
        initialBalance: state.initialBalance,
        monthlyContribution: state.monthlyContribution,
        years: state.years,
        interestRate: state.interestRate,
        // ... 모든 상태 복사
      },
      color: CHART_COLORS[get().scenarios.length % CHART_COLORS.length]
    };

    set({ scenarios: [...state.scenarios, newScenario] });
  },

  // 목표 모드
  goalMode: false,
  targetAmount: 100000000, // 1억원

  calculateRequiredContribution: () => {
    const { targetAmount, years, interestRate, initialBalance } = get();

    // 필요한 월 납입액 계산 (역산)
    const r = interestRate / 100 / 12;
    const n = years * 12;

    // FV = P(1+r)^n + PMT * [((1+r)^n - 1) / r]
    // 변형: PMT = (FV - P(1+r)^n) * r / ((1+r)^n - 1)

    const futureValueOfInitial = initialBalance * Math.pow(1 + r, n);
    const remaining = targetAmount - futureValueOfInitial;

    if (remaining <= 0) return 0;

    const pmt = remaining * r / (Math.pow(1 + r, n) - 1);

    return Math.round(pmt);
  }
}));
```

### 3.2 시나리오 비교 UI

**파일**: `src/components/calculator/ScenarioComparison.tsx` (새 파일)

```typescript
'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { calculateCompoundInterest } from '@/utils/finance';

export const ScenarioComparison: React.FC = () => {
  const { scenarios, removeScenario } = useCalculatorStore();

  if (scenarios.length === 0) return null;

  // 각 시나리오의 데이터 계산
  const allData = scenarios.map(scenario => ({
    ...scenario,
    data: calculateCompoundInterest(scenario.state)
  }));

  // 차트 데이터 병합
  const chartData = allData[0].data.map((_, index) => {
    const point: any = { year: index };

    allData.forEach(scenario => {
      point[scenario.id] = scenario.data[index].balance;
    });

    return point;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">시나리오 비교</h2>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" label={{ value: '년', position: 'insideBottomRight', offset: -10 }} />
          <YAxis />
          <Tooltip />
          <Legend />

          {scenarios.map(scenario => (
            <Line
              key={scenario.id}
              type="monotone"
              dataKey={scenario.id}
              name={scenario.name}
              stroke={scenario.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* 시나리오 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allData.map(({ scenario, data }) => {
          const finalData = data[data.length - 1];

          return (
            <div
              key={scenario.id}
              className="p-4 border-2 rounded-lg"
              style={{ borderColor: scenario.color }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{scenario.name}</h3>
                <button
                  onClick={() => removeScenario(scenario.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-1 text-sm">
                <div>초기: {formatCurrency(scenario.state.initialBalance)}</div>
                <div>월 납입: {formatCurrency(scenario.state.monthlyContribution)}</div>
                <div>기간: {scenario.state.years}년</div>
                <div>수익률: {scenario.state.interestRate}%</div>
                <div className="pt-2 border-t font-bold">
                  최종: {formatCurrency(finalData.balance)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

## 환경 변수 설정

**파일**: `.env.local`

```bash
# ExchangeRate-API
NEXT_PUBLIC_EXCHANGE_API_KEY=your_api_key_here

# 개발 모드에서는 무료 API 사용
# https://www.exchangerate-api.com 에서 무료 키 발급 가능
```

---

## 배포 체크리스트

### Phase 2.1 배포 전
- [ ] 모든 통화 데이터 검증
- [ ] API 키 환경 변수 설정
- [ ] 환율 캐싱 테스트
- [ ] 모바일 반응형 테스트
- [ ] Lighthouse 성능 테스트 (> 90점)
- [ ] Playwright E2E 테스트 통과

### 성능 목표
- API 응답 시간: < 200ms (캐시 사용 시)
- 첫 화면 로딩: < 2초
- 통화 변환: < 100ms (로컬 계산)

---

## 다음 단계

이 구현 계획을 기반으로:
1. Sprint 1부터 순차적으로 진행
2. 각 Sprint 완료 후 코드 리뷰 및 테스트
3. 사용자 피드백 수집 및 반영
4. Phase 2.2, 2.3으로 진행

---

**작성일**: 2024-12-03
**버전**: 1.0
**다음 업데이트**: Sprint 1 완료 후
