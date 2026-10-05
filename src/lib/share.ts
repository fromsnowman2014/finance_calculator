import {
  DEFAULT_AVERAGE,
  DEFAULT_GOAL,
  DEFAULT_GROWTH,
  DEFAULT_TRADE,
  TABS,
  type GrowthState,
  type TabId,
  type TradeState,
} from '@/store/useAppStore';
import type { AverageCostInputs, Lot } from '@/lib/finance/averageCost';
import type { GoalInputs } from '@/lib/finance/goal';
import { isCurrencyCode, type CurrencyCode } from '@/lib/format';

type Flat = Record<string, number | boolean | string>;

export interface SharedState {
  tab?: TabId;
  currency?: CurrencyCode;
  growth?: Partial<GrowthState>;
  trade?: Partial<TradeState>;
  average?: Partial<AverageCostInputs>;
  goal?: Partial<GoalInputs>;
}

const LIMIT = 1e12;
const MAX_YEARS = 60;

const clampYears = (years: number) => Math.min(MAX_YEARS, Math.max(1, Math.round(years)));

const writeFlat = (params: URLSearchParams, values: Flat, defaults: Flat) => {
  for (const key of Object.keys(defaults)) {
    const value = values[key];
    if (typeof value === 'boolean') params.set(key, value ? '1' : '0');
    else if (typeof value === 'number') params.set(key, String(Math.round(value * 10000) / 10000));
    else if (typeof value === 'string') params.set(key, value);
  }
};

const readFlat = <T extends Flat>(params: URLSearchParams, defaults: T): Partial<T> => {
  const out: Partial<T> = {};
  for (const key of Object.keys(defaults) as (keyof T & string)[]) {
    const raw = params.get(key);
    if (raw === null) continue;
    const fallback = defaults[key];
    if (typeof fallback === 'boolean') {
      out[key] = (raw === '1' || raw === 'true') as T[typeof key];
    } else if (typeof fallback === 'number') {
      const n = Number(raw);
      if (Number.isFinite(n) && Math.abs(n) <= LIMIT) out[key] = n as T[typeof key];
    } else if (typeof fallback === 'string' && raw.length <= 32) {
      out[key] = raw as T[typeof key];
    }
  }
  return out;
};

/** Average-cost defaults without the lots list (encoded separately). */
const averageDefaults = (): Flat => {
  const flat: Partial<AverageCostInputs> = { ...DEFAULT_AVERAGE };
  delete flat.lots;
  return flat as unknown as Flat;
};

const encodeLots = (lots: Lot[]) => lots.map((l) => `${l.price}*${l.shares}`).join('_');

const decodeLots = (raw: string): Lot[] =>
  raw
    .split('_')
    .slice(0, 50)
    .map((part, i) => {
      const [price, shares] = part.split('*').map(Number);
      return { id: `lot-${i + 1}`, price, shares };
    })
    .filter((l) => Number.isFinite(l.price) && Number.isFinite(l.shares) && l.price >= 0 && l.shares >= 0);

export const buildShareQuery = (
  tab: TabId,
  currency: CurrencyCode,
  state: { growth: GrowthState; trade: TradeState; average: AverageCostInputs; goal: GoalInputs },
) => {
  const params = new URLSearchParams();
  params.set('tab', tab);
  params.set('cur', currency);
  if (tab === 'growth') writeFlat(params, state.growth as unknown as Flat, DEFAULT_GROWTH as unknown as Flat);
  if (tab === 'trade') writeFlat(params, state.trade as unknown as Flat, DEFAULT_TRADE as unknown as Flat);
  if (tab === 'goal') writeFlat(params, state.goal as unknown as Flat, DEFAULT_GOAL as unknown as Flat);
  if (tab === 'average') {
    writeFlat(params, state.average as unknown as Flat, averageDefaults());
    params.set('lots', encodeLots(state.average.lots));
  }
  return params.toString();
};

export const parseShareQuery = (search: string): SharedState | null => {
  const params = new URLSearchParams(search);
  if ([...params.keys()].length === 0) return null;

  const shared: SharedState = {};
  const cur = params.get('cur');
  if (isCurrencyCode(cur)) shared.currency = cur;

  const tab = params.get('tab');
  if (tab && (TABS as readonly string[]).includes(tab)) {
    shared.tab = tab as TabId;
  } else if (params.has('p') || params.has('r')) {
    // Links shared from the original compound interest calculator.
    shared.tab = 'growth';
    const legacy: Partial<GrowthState> = { preset: 'custom', dividendYield: 0, expenseRatio: 0, dividendTax: 0, capitalGainsTax: 0 };
    const num = (key: string) => {
      const n = Number(params.get(key));
      return params.has(key) && Number.isFinite(n) ? n : undefined;
    };
    if (num('p') !== undefined) legacy.initial = num('p');
    if (num('c') !== undefined) legacy.monthly = num('c');
    if (num('y') !== undefined) legacy.years = clampYears(num('y')!);
    if (num('r') !== undefined) legacy.priceReturn = num('r');
    if (num('inc') !== undefined) legacy.contributionGrowth = num('inc');
    shared.growth = legacy;
    return shared;
  } else {
    return Object.keys(shared).length ? shared : null;
  }

  if (shared.tab === 'growth') {
    const growth = readFlat(params, DEFAULT_GROWTH as unknown as Flat) as Partial<GrowthState>;
    if (growth.years !== undefined) growth.years = clampYears(growth.years);
    shared.growth = growth;
  }
  if (shared.tab === 'trade') {
    const trade = readFlat(params, DEFAULT_TRADE as unknown as Flat) as Partial<TradeState>;
    if (trade.homeCurrency !== undefined && !isCurrencyCode(trade.homeCurrency)) delete trade.homeCurrency;
    shared.trade = trade;
  }
  if (shared.tab === 'goal') {
    const goal = readFlat(params, DEFAULT_GOAL as unknown as Flat) as Partial<GoalInputs>;
    if (goal.years !== undefined) goal.years = clampYears(goal.years);
    if (goal.mode !== undefined && goal.mode !== 'amount' && goal.mode !== 'fire') delete goal.mode;
    shared.goal = goal;
  }
  if (shared.tab === 'average') {
    const average: Partial<AverageCostInputs> = readFlat(params, averageDefaults());
    const lots = params.get('lots');
    if (lots) {
      const decoded = decodeLots(lots);
      if (decoded.length) average.lots = decoded;
    }
    shared.average = average;
  }
  return shared;
};
