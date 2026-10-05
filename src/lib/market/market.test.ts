import { describe, expect, it } from 'vitest';
import { downsample, parseFredCsv, parseFredJson, percentileOf, ratioSeries, recessionPeriods, toEpochDay, type Point } from './transform';
import { assessMarket, assumptionLevel, cautiousScenario, classify, layerStatuses, marketStance } from './indicators';
import { formatDay, formatTick, niceTicks, periodStart, timeTicks } from './time';

const d = toEpochDay;

describe('parseFredCsv', () => {
  it('skips blank and "." observations instead of reading them as zero', () => {
    const csv = 'observation_date,T10Y3M\n2026-09-04,0.87\n2026-09-07,\n2026-09-08,.\n2026-09-09,-0.12\n';
    expect(parseFredCsv(csv)).toEqual([
      [d('2026-09-04'), 0.87],
      [d('2026-09-09'), -0.12],
    ]);
  });

  it('rejects responses that are not FRED CSV', () => {
    expect(() => parseFredCsv('<html>error</html>')).toThrow();
  });

  it('parses the official API format the same way', () => {
    const json = { observations: [{ date: '2026-09-04', value: '0.87' }, { date: '2026-09-07', value: '.' }] };
    expect(parseFredJson(json)).toEqual([[d('2026-09-04'), 0.87]]);
    expect(() => parseFredJson({ error_code: 400 })).toThrow();
  });
});

describe('series helpers', () => {
  it('divides series on matching dates', () => {
    const a: Point[] = [[1, 10], [2, 20], [3, 30]];
    const b: Point[] = [[1, 5], [3, 10]];
    expect(ratioSeries(a, b)).toEqual([[1, 2], [3, 3]]);
  });

  it('keeps recent days and one point per week before that', () => {
    const daily: Point[] = Array.from({ length: 1000 }, (_, i) => [d('2020-01-06') + i, i]);
    const out = downsample(daily, 100);
    const recent = out.filter(([day]) => day >= daily[999][0] - 100);
    expect(recent).toHaveLength(101);
    const older = out.length - recent.length;
    expect(older).toBeGreaterThan(120);
    expect(older).toBeLessThan(135);
    expect(out[out.length - 1]).toEqual(daily[999]);
  });

  it('computes percentiles inclusively', () => {
    const pts: Point[] = [[1, 1], [2, 2], [3, 3], [4, 4]];
    expect(percentileOf(pts, 3)).toBe(75);
    expect(percentileOf([], 3)).toBeNull();
  });

  it('turns a monthly flag into recession periods', () => {
    const flags: Point[] = [
      [d('2020-01-01'), 0],
      [d('2020-02-01'), 1],
      [d('2020-03-01'), 1],
      [d('2020-04-01'), 1],
      [d('2020-05-01'), 0],
    ];
    expect(recessionPeriods(flags)).toEqual([[d('2020-02-01'), d('2020-05-01')]]);
  });
});

describe('classify', () => {
  const at = (value: number, day = d('2026-10-01')): Point[] => [[day, value]];

  it('applies thresholds in the risky direction', () => {
    expect(classify('creditSpread', at(1.5))?.status).toBe('calm');
    expect(classify('creditSpread', at(2.8))?.status).toBe('watch');
    expect(classify('creditSpread', at(4))?.status).toBe('warning');
    expect(classify('yieldCurve', at(1.2))?.status).toBe('calm');
    expect(classify('yieldCurve', at(0.2))?.status).toBe('watch');
    expect(classify('yieldCurve', at(-0.3))?.status).toBe('warning');
    expect(classify('buffett', at(255))).toEqual({ status: 'warning', reading: 'warning' });
  });

  it('flags a curve that turned positive within the last year', () => {
    const pts: Point[] = [[d('2026-03-01'), -0.2], [d('2026-10-01'), 0.9]];
    expect(classify('yieldCurve', pts)).toEqual({ status: 'watch', reading: 'reSteepening' });
    const old: Point[] = [[d('2025-08-01'), -0.13], [d('2026-10-01'), 1.09]];
    expect(classify('yieldCurve', old)?.status).toBe('calm');
  });

  it('notes complacency when VIX is very low', () => {
    expect(classify('vix', at(11))).toEqual({ status: 'calm', reading: 'complacent' });
  });

  it('returns null without data', () => {
    expect(classify('vix', [])).toBeNull();
  });
});

describe('market verdict', () => {
  it('ranks stress above fear above valuation', () => {
    expect(marketStance({ valuation: 'warning', recession: 'calm', credit: 'warning', fear: 'calm' })).toBe('defensive');
    expect(marketStance({ valuation: 'warning', recession: 'calm', credit: 'calm', fear: 'warning' })).toBe('fearful');
    expect(marketStance({ valuation: 'warning', recession: 'watch', credit: 'calm', fear: 'calm' })).toBe('expensive');
    expect(marketStance({ valuation: 'calm', recession: 'watch', credit: 'calm', fear: 'calm' })).toBe('mixed');
    expect(marketStance({ valuation: 'calm', recession: 'calm', credit: 'calm', fear: 'calm' })).toBe('calm');
    expect(marketStance({ valuation: null, recession: null, credit: null, fear: null })).toBeNull();
  });

  it('takes the worst indicator in each layer', () => {
    expect(layerStatuses({ vix: { status: 'calm', reading: 'calm' }, vixTerm: { status: 'warning', reading: 'warning' } }).fear).toBe('warning');
  });

  it('maps the verdict to an assumption level and scenario', () => {
    expect(assumptionLevel('calm')).toBe('optimistic');
    expect(assumptionLevel('expensive')).toBe('modest');
    expect(assumptionLevel('defensive')).toBe('cautious');
    expect(cautiousScenario('optimistic', { priceReturn: 8.5, volatility: 16 })).toBeNull();
    expect(cautiousScenario('modest', { priceReturn: 8.5, volatility: 16 })).toEqual({ priceReturn: 6.5, volatility: 16 });
    expect(cautiousScenario('cautious', { priceReturn: 8.5, volatility: 16 })).toEqual({ priceReturn: 6.5, volatility: 21 });
  });

  it('assesses the October 2026 readings as calm but expensive', () => {
    const day = d('2026-10-01');
    const result = assessMarket({
      buffett: { points: [[day, 255]] },
      // Last dipped below zero on 2025-10-16, so the curve still counts as re-steepening.
      yieldCurve: { points: [[d('2025-10-16'), -0.03], [day, 1.09]] },
      sahm: { points: [[day, 0]] },
      creditSpread: { points: [[day, 1.49]] },
      nfci: { points: [[day, -0.55]] },
      vix: { points: [[day, 16.4]] },
      vixTerm: { points: [[day, 0.88]] },
    });
    expect(result.assessment.yieldCurve?.reading).toBe('reSteepening');
    expect(result.layers.recession).toBe('watch');
    expect(result.stance).toBe('expensive');
    expect(result.level).toBe('modest');
  });
});

describe('time helpers', () => {
  it('starts windows relative to the latest data', () => {
    expect(periodStart('max', 100)).toBeNull();
    expect(periodStart('1y', 1000)).toBe(635);
  });

  it('uses quarterly ticks for a year and round years for long windows', () => {
    const quarterly = timeTicks(d('2025-10-02'), d('2026-10-01'));
    expect(quarterly.monthly).toBe(true);
    // Oct 1 sits on the right edge, so its label is skipped.
    expect(quarterly.ticks.map((t) => formatTick(t, true, 'en'))).toEqual(['Jan ’26', 'Apr ’26', 'Jul ’26']);
    const decade = timeTicks(d('2016-10-01'), d('2026-10-01'));
    expect(decade.ticks.map((t) => formatTick(t, false, 'en'))).toEqual(['2018', '2020', '2022', '2024', '2026']);
    expect(formatTick(d('2026-01-01'), true, 'ko')).toBe('26년 1월');
  });

  it('picks round axis ticks', () => {
    expect(niceTicks(88, 255).ticks).toEqual([50, 100, 150, 200, 250, 300]);
    expect(niceTicks(-0.78, 0.39).ticks).toEqual([-1, -0.5, 0, 0.5]);
    expect(niceTicks(0.69, 1.39).ticks).toEqual([0.6, 0.8, 1, 1.2, 1.4]);
  });

  it('formats dates per language', () => {
    expect(formatDay(d('2026-10-01'), 'en')).toBe('Oct 1, 2026');
    expect(formatDay(d('2026-10-01'), 'ko')).toBe('2026.10.01');
  });
});
