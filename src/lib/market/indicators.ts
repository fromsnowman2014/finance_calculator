import type { Point } from './transform';

export type Status = 'calm' | 'watch' | 'warning';
export type Layer = 'valuation' | 'recession' | 'credit' | 'fear';
export type IndicatorKey = 'buffett' | 'yieldCurve' | 'sahm' | 'creditSpread' | 'nfci' | 'vix' | 'vixTerm';
export type Reading = Status | 'reSteepening' | 'complacent';

export interface IndicatorDef {
  key: IndicatorKey;
  layer: Layer;
  /** FRED series the indicator is built from (first one is linked as the source). */
  fred: readonly string[];
  /** 'up': higher is riskier. 'down': lower is riskier. */
  direction: 'up' | 'down';
  watch: number;
  warning: number;
  decimals: number;
  unit: '%' | 'pp' | '';
  signed?: boolean;
}

/**
 * Thresholds are calibrated on history since 1990 (1950 for valuation):
 * - Baa spread: median 2.1%, 90th pct 3.2%; 2008 peak 6.2%, 2020 peak 4.3%.
 * - NFCI: median −0.52 since 1990; 2020 peak 0.31, 2008 peak 3.1.
 * - VIX/VIX3M: ≥ 1 on about 10% of days since 2007.
 * - Market value ÷ GDP: median 72% since 1950, 90th pct 152%.
 */
export const INDICATORS: readonly IndicatorDef[] = [
  { key: 'buffett', layer: 'valuation', fred: ['NCBEILQ027S', 'GDP'], direction: 'up', watch: 100, warning: 150, decimals: 0, unit: '%' },
  { key: 'yieldCurve', layer: 'recession', fred: ['T10Y3M'], direction: 'down', watch: 0.5, warning: 0, decimals: 2, unit: 'pp', signed: true },
  { key: 'sahm', layer: 'recession', fred: ['SAHMREALTIME'], direction: 'up', watch: 0.3, warning: 0.5, decimals: 2, unit: 'pp' },
  { key: 'creditSpread', layer: 'credit', fred: ['BAA10Y'], direction: 'up', watch: 2.5, warning: 3.5, decimals: 2, unit: '%' },
  { key: 'nfci', layer: 'credit', fred: ['NFCI'], direction: 'up', watch: -0.2, warning: 0.3, decimals: 2, unit: '', signed: true },
  { key: 'vix', layer: 'fear', fred: ['VIXCLS'], direction: 'up', watch: 20, warning: 30, decimals: 1, unit: '' },
  { key: 'vixTerm', layer: 'fear', fred: ['VIXCLS', 'VXVCLS'], direction: 'up', watch: 0.9, warning: 1, decimals: 2, unit: '' },
];

export const LAYERS: readonly Layer[] = ['valuation', 'recession', 'credit', 'fear'];

export const indicatorDef = (key: IndicatorKey) => INDICATORS.find((d) => d.key === key)!;

const RANK: Record<Status, number> = { calm: 0, watch: 1, warning: 2 };
const worst = (a: Status, b: Status) => (RANK[b] > RANK[a] ? b : a);

/** A recession has usually started within months after an inverted curve turns positive again. */
const RESTEEPENING_LOOKBACK_DAYS = 365;
const COMPLACENT_VIX = 12;

export const classify = (key: IndicatorKey, points: Point[]): { status: Status; reading: Reading } | null => {
  if (points.length === 0) return null;
  const def = indicatorDef(key);
  const [lastDay, value] = points[points.length - 1];

  let status: Status;
  if (def.direction === 'up') status = value >= def.warning ? 'warning' : value >= def.watch ? 'watch' : 'calm';
  else status = value < def.warning ? 'warning' : value < def.watch ? 'watch' : 'calm';

  if (key === 'yieldCurve' && status !== 'warning') {
    const recentlyInverted = points.some(([day, v]) => day >= lastDay - RESTEEPENING_LOOKBACK_DAYS && v < 0);
    if (recentlyInverted) return { status: 'watch', reading: 'reSteepening' };
  }
  if (key === 'vix' && value < COMPLACENT_VIX) return { status: 'calm', reading: 'complacent' };
  return { status, reading: status };
};

export type Assessment = Partial<Record<IndicatorKey, { status: Status; reading: Reading }>>;

/** Classifies every indicator that has data, then rolls the results up. */
export const assessMarket = (series: Partial<Record<IndicatorKey, { points: Point[] }>>) => {
  const assessment: Assessment = {};
  for (const def of INDICATORS) {
    const data = series[def.key];
    const result = data ? classify(def.key, data.points) : null;
    if (result) assessment[def.key] = result;
  }
  const layers = layerStatuses(assessment);
  const stance = marketStance(layers);
  return { assessment, layers, stance, level: stance ? assumptionLevel(stance) : null };
};

export const layerStatuses = (assessment: Assessment): Record<Layer, Status | null> => {
  const result: Record<Layer, Status | null> = { valuation: null, recession: null, credit: null, fear: null };
  for (const def of INDICATORS) {
    const a = assessment[def.key];
    if (!a) continue;
    const current = result[def.layer];
    result[def.layer] = current ? worst(current, a.status) : a.status;
  }
  return result;
};

export type Stance = 'calm' | 'mixed' | 'expensive' | 'fearful' | 'defensive';
export type AssumptionLevel = 'optimistic' | 'modest' | 'cautious';

export const marketStance = (layers: Record<Layer, Status | null>): Stance | null => {
  const known = LAYERS.filter((l) => layers[l] !== null);
  if (known.length === 0) return null;
  if (layers.recession === 'warning' || layers.credit === 'warning') return 'defensive';
  if (layers.fear === 'warning') return 'fearful';
  if (layers.valuation === 'warning') return 'expensive';
  if (known.some((l) => layers[l] === 'watch')) return 'mixed';
  return 'calm';
};

export const assumptionLevel = (stance: Stance): AssumptionLevel =>
  stance === 'calm' ? 'optimistic' : stance === 'mixed' || stance === 'expensive' ? 'modest' : 'cautious';

/** Scenario to test in the simulator: −2%p price growth, and +5%p volatility when cautious. */
export const cautiousScenario = (level: AssumptionLevel, base: { priceReturn: number; volatility: number }) => {
  if (level === 'optimistic') return null;
  return {
    priceReturn: Math.round((base.priceReturn - 2) * 10) / 10,
    volatility: level === 'cautious' ? base.volatility + 5 : base.volatility,
  };
};
