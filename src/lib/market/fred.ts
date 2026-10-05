import type { IndicatorKey } from './indicators';
import {
  compact,
  downsample,
  parseFredCsv,
  parseFredJson,
  percentileOf,
  ratioSeries,
  recessionPeriods,
  type Point,
} from './transform';

export interface IndicatorData {
  /** Downsampled history for charts. */
  points: Point[];
  /** Share of all observations since `since` at or below the latest value, 0–100. */
  percentile: number | null;
  /** First observation used for the percentile (epoch day). */
  since: number | null;
}

export interface MarketData {
  generatedAt: string;
  indicators: Partial<Record<IndicatorKey, IndicatorData>>;
  recessions: [number, number][];
  errors: string[];
}

const HISTORY_START = '1990-01-01';
const VALUATION_START = '1950-01-01';
const TIMEOUT_MS = 15_000;
// FRED's edge rejects anonymous clients; identify the app with a standard product token.
const USER_AGENT = 'finance-calculator/1.0 (+https://github.com/fromsnowman2014/finance_calculator)';

const request = async (id: string, start: string) => {
  // With a free API key (FRED_API_KEY) use the official API; otherwise the public CSV download.
  const key = process.env.FRED_API_KEY;
  const url = key
    ? `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&observation_start=${start}&file_type=json&api_key=${key}`
    : `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${start}`;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  return key ? parseFredJson(await response.json()) : parseFredCsv(await response.text());
};

const fetchSeries = async (id: string, start: string): Promise<Point[]> => {
  try {
    return await request(id, start);
  } catch {
    // One retry for transient upstream errors.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return request(id, start);
  }
};

const summarize = (raw: Point[]): IndicatorData => ({
  points: compact(downsample(raw)),
  percentile: raw.length ? percentileOf(raw, raw[raw.length - 1][1]) : null,
  since: raw.length ? raw[0][0] : null,
});

/** Downloads every series from FRED. Never throws: failed series are listed in `errors`. */
export const loadMarketData = async (): Promise<MarketData> => {
  const ids: Record<string, string> = {
    NCBEILQ027S: VALUATION_START,
    GDP: VALUATION_START,
    USREC: VALUATION_START,
    T10Y3M: HISTORY_START,
    SAHMREALTIME: HISTORY_START,
    BAA10Y: HISTORY_START,
    NFCI: HISTORY_START,
    VIXCLS: HISTORY_START,
    VXVCLS: HISTORY_START,
  };
  const errors: string[] = [];
  const entries = await Promise.all(
    Object.entries(ids).map(async ([id, start]) => {
      try {
        return [id, await fetchSeries(id, start)] as const;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${id}: failed`);
        return [id, null] as const;
      }
    }),
  );
  const series = Object.fromEntries(entries) as Record<string, Point[] | null>;

  const indicators: MarketData['indicators'] = {};
  const set = (key: IndicatorKey, raw: Point[] | null) => {
    if (raw && raw.length) indicators[key] = summarize(raw);
  };

  // Equities are in millions of dollars and GDP in billions: ×0.1 gives percent of GDP.
  if (series.NCBEILQ027S && series.GDP) set('buffett', ratioSeries(series.NCBEILQ027S, series.GDP, 0.1));
  set('yieldCurve', series.T10Y3M);
  set('sahm', series.SAHMREALTIME);
  set('creditSpread', series.BAA10Y);
  set('nfci', series.NFCI);
  set('vix', series.VIXCLS);
  if (series.VIXCLS && series.VXVCLS) set('vixTerm', ratioSeries(series.VIXCLS, series.VXVCLS));

  return {
    generatedAt: new Date().toISOString(),
    indicators,
    recessions: series.USREC ? recessionPeriods(series.USREC) : [],
    errors,
  };
};
