import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GrowthInputs } from '@/lib/finance/growth';
import type { TradeInputs } from '@/lib/finance/trade';
import type { AverageCostInputs } from '@/lib/finance/averageCost';
import type { GoalInputs } from '@/lib/finance/goal';
import type { MarketPresetId } from '@/lib/finance/presets';
import type { CurrencyCode, Lang } from '@/lib/format';

export const TABS = ['growth', 'trade', 'average', 'goal'] as const;
export type TabId = (typeof TABS)[number];

export interface GrowthState extends GrowthInputs {
  preset: MarketPresetId;
}

export interface TradeState extends TradeInputs {
  homeCurrency: CurrencyCode;
}

export const DEFAULT_GROWTH: GrowthState = {
  preset: 'sp500',
  initial: 10000,
  monthly: 500,
  years: 20,
  priceReturn: 8.5,
  dividendYield: 1.5,
  reinvest: true,
  contributionGrowth: 0,
  expenseRatio: 0.1,
  dividendTax: 15,
  capitalGainsTax: 15,
  inflation: 2.5,
  volatility: 16,
  goal: 500000,
};

export const DEFAULT_TRADE: TradeState = {
  buyPrice: 150,
  sellPrice: 210,
  shares: 20,
  commission: 0.1,
  dividendsPerShare: 3,
  dividendTax: 15,
  capitalGainsTax: 15,
  buyDate: '2023-10-02',
  sellDate: '2026-10-01',
  fxEnabled: false,
  homeCurrency: 'KRW',
  buyFx: 1320,
  sellFx: 1390,
};

export const DEFAULT_AVERAGE: AverageCostInputs = {
  lots: [
    { id: 'lot-1', price: 120, shares: 10 },
    { id: 'lot-2', price: 100, shares: 10 },
    { id: 'lot-3', price: 85, shares: 15 },
  ],
  currentPrice: 90,
  targetAverage: 95,
  nextBuyPrice: 85,
};

export const DEFAULT_GOAL: GoalInputs = {
  mode: 'amount',
  target: 1000000,
  annualExpenses: 40000,
  withdrawalRate: 4,
  years: 25,
  initial: 20000,
  annualReturn: 8,
  inflation: 2.5,
  todaysMoney: false,
  currentMonthly: 1000,
};

interface AppState {
  hydrated: boolean;
  tab: TabId;
  lang: Lang;
  /** True once the visitor picked a language; otherwise we follow the browser. */
  langChosen: boolean;
  currency: CurrencyCode;
  growth: GrowthState;
  trade: TradeState;
  average: AverageCostInputs;
  goal: GoalInputs;
  setTab: (tab: TabId) => void;
  setLang: (lang: Lang) => void;
  setCurrency: (currency: CurrencyCode) => void;
  updateGrowth: (patch: Partial<GrowthState>) => void;
  updateTrade: (patch: Partial<TradeState>) => void;
  updateAverage: (patch: Partial<AverageCostInputs>) => void;
  updateGoal: (patch: Partial<GoalInputs>) => void;
  resetTab: (tab: TabId) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      tab: 'growth',
      lang: 'en',
      langChosen: false,
      currency: 'USD',
      growth: DEFAULT_GROWTH,
      trade: DEFAULT_TRADE,
      average: DEFAULT_AVERAGE,
      goal: DEFAULT_GOAL,
      setTab: (tab) => set({ tab }),
      setLang: (lang) => set({ lang, langChosen: true }),
      setCurrency: (currency) => set({ currency }),
      updateGrowth: (patch) => set((s) => ({ growth: { ...s.growth, ...patch } })),
      updateTrade: (patch) => set((s) => ({ trade: { ...s.trade, ...patch } })),
      updateAverage: (patch) => set((s) => ({ average: { ...s.average, ...patch } })),
      updateGoal: (patch) => set((s) => ({ goal: { ...s.goal, ...patch } })),
      resetTab: (tab) =>
        set(
          tab === 'growth'
            ? { growth: DEFAULT_GROWTH }
            : tab === 'trade'
              ? { trade: DEFAULT_TRADE }
              : tab === 'average'
                ? { average: DEFAULT_AVERAGE }
                : { goal: DEFAULT_GOAL },
        ),
    }),
    {
      name: 'stock-return-calculator',
      version: 1,
      skipHydration: true,
      partialize: (s) => ({
        tab: s.tab,
        lang: s.lang,
        langChosen: s.langChosen,
        currency: s.currency,
        growth: s.growth,
        trade: s.trade,
        average: s.average,
        goal: s.goal,
      }),
      // Fill in fields added after a visitor's data was saved.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          growth: { ...current.growth, ...p.growth },
          trade: { ...current.trade, ...p.trade },
          average: { ...current.average, ...p.average },
          goal: { ...current.goal, ...p.goal },
        };
      },
    },
  ),
);
