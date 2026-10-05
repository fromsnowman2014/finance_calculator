import { describe, expect, it } from 'vitest';
import { createFormatters, parseInputNumber } from './format';
import { buildShareQuery, parseShareQuery } from './share';
import { DEFAULT_AVERAGE, DEFAULT_GOAL, DEFAULT_GROWTH, DEFAULT_TRADE } from '@/store/useAppStore';
import { yearTicks } from '@/components/charts/ChartParts';

const state = { growth: DEFAULT_GROWTH, trade: DEFAULT_TRADE, average: DEFAULT_AVERAGE, goal: DEFAULT_GOAL };

describe('formatters', () => {
  it('rounds small compact values regardless of what was formatted before', () => {
    const f = createFormatters('USD', 'en');
    expect(f.money(4067.88, { compact: true })).toBe('$4.1K');
    expect(f.money(-187.9, { compact: true, signed: true })).toBe('-$188');
    expect(f.money(7.2, { compact: true })).toBe('$7');
  });

  it('formats signed percentages and Korean compact won', () => {
    const f = createFormatters('USD', 'en');
    expect(f.pct(12.345, 1, true)).toBe('+12.3%');
    expect(createFormatters('KRW', 'ko').money(1_200_000_000, { compact: true })).toBe('₩12억');
  });

  it('parses user-typed numbers', () => {
    expect(parseInputNumber('12,500.5')).toBe(12500.5);
    expect(parseInputNumber('abc')).toBeNaN();
    expect(parseInputNumber('')).toBeNaN();
  });
});

describe('share links', () => {
  it('round-trips each tab', () => {
    const growth = parseShareQuery(buildShareQuery('growth', 'KRW', { ...state, growth: { ...DEFAULT_GROWTH, monthly: 777, reinvest: false } }));
    expect(growth?.tab).toBe('growth');
    expect(growth?.currency).toBe('KRW');
    expect(growth?.growth?.monthly).toBe(777);
    expect(growth?.growth?.reinvest).toBe(false);

    const average = parseShareQuery(buildShareQuery('average', 'USD', state));
    expect(average?.average?.lots?.map((l) => [l.price, l.shares])).toEqual(DEFAULT_AVERAGE.lots.map((l) => [l.price, l.shares]));

    const trade = parseShareQuery(buildShareQuery('trade', 'USD', state));
    expect(trade?.trade?.buyDate).toBe(DEFAULT_TRADE.buyDate);
  });

  it('understands links from the original compound interest calculator', () => {
    const legacy = parseShareQuery('?p=5000&c=200&y=30&r=7');
    expect(legacy?.tab).toBe('growth');
    expect(legacy?.growth).toMatchObject({ initial: 5000, monthly: 200, years: 30, priceReturn: 7, dividendYield: 0 });
  });

  it('ignores junk', () => {
    expect(parseShareQuery('')).toBeNull();
    expect(parseShareQuery('?tab=trade&homeCurrency=XYZ')?.trade?.homeCurrency).toBeUndefined();
    expect(parseShareQuery('?tab=growth&years=1000000000')?.growth?.years).toBe(60);
    expect(parseShareQuery('?tab=growth&monthly=abc')?.growth?.monthly).toBeUndefined();
  });
});

describe('yearTicks', () => {
  it('picks round steps and always ends on the horizon', () => {
    expect(yearTicks(20)).toEqual([0, 5, 10, 15, 20]);
    expect(yearTicks(10)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(yearTicks(5)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(yearTicks(23)).toEqual([0, 5, 10, 15, 23]);
    expect(yearTicks(20, 1)).toEqual([1, 5, 10, 15, 20]);
    expect(yearTicks(12, 1)).toEqual([1, 4, 6, 8, 10, 12]);
  });
});
