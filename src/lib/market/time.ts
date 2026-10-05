import type { Lang } from '@/lib/format';

export type Period = '1y' | '3y' | '5y' | '10y' | 'max';

const PERIOD_DAYS: Record<Exclude<Period, 'max'>, number> = { '1y': 365, '3y': 1096, '5y': 1826, '10y': 3653 };

/** First day of the chart window, or null for the full history. */
export const periodStart = (period: Period, endDay: number): number | null =>
  period === 'max' ? null : endDay - PERIOD_DAYS[period];

const dayOf = (year: number, month: number) => Math.floor(Date.UTC(year, month, 1) / 86_400_000);
const parts = (day: number) => {
  const d = new Date(day * 86_400_000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), date: d.getUTCDate() };
};

/** Calendar-aligned ticks: quarters for short windows, then 1/2/5/10-year steps. */
export const timeTicks = (startDay: number, endDay: number): { ticks: number[]; monthly: boolean } => {
  const span = endDay - startDay;
  // Labels are centered on their tick, so skip ticks that would hang off either edge.
  const fits = (day: number) => day - startDay >= span * 0.04 && endDay - day >= span * 0.06;
  const ticks: number[] = [];
  const start = parts(startDay);
  if (span <= 550) {
    for (let y = start.year, m = Math.ceil(start.month / 3) * 3; ; m += 3) {
      if (m >= 12) {
        y += Math.floor(m / 12);
        m %= 12;
      }
      const day = dayOf(y, m);
      if (day > endDay) break;
      if (day >= startDay && fits(day)) ticks.push(day);
    }
    return { ticks, monthly: true };
  }
  const step = span <= 2200 ? 1 : span <= 5500 ? 2 : span <= 13000 ? 5 : 10;
  for (let y = Math.ceil((start.year + (start.month > 0 || start.date > 1 ? 1 : 0)) / step) * step; ; y += step) {
    const day = dayOf(y, 0);
    if (day > endDay) break;
    if (fits(day)) ticks.push(day);
  }
  return { ticks, monthly: false };
};

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatTick = (day: number, monthly: boolean, lang: Lang) => {
  const { year, month } = parts(day);
  if (!monthly) return String(year);
  return lang === 'ko' ? `${String(year).slice(2)}년 ${month + 1}월` : `${MONTHS_EN[month]} ’${String(year).slice(2)}`;
};

export const formatDay = (day: number, lang: Lang) => {
  const { year, month, date } = parts(day);
  return lang === 'ko'
    ? `${year}.${String(month + 1).padStart(2, '0')}.${String(date).padStart(2, '0')}`
    : `${MONTHS_EN[month]} ${date}, ${year}`;
};

export const yearOf = (day: number) => parts(day).year;

/** Round axis ticks (1, 2, 2.5 or 5 × 10ⁿ steps, about `count` intervals) covering [min, max]. */
export const niceTicks = (min: number, max: number, count = 4): { ticks: number[]; step: number } => {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / Math.max(1, count);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= raw) ?? 10) * magnitude;
  const clean = (v: number) => Number(v.toFixed(10)) || 0;
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(clean(v));
  if (ticks[ticks.length - 1] < max - step * 1e-9) ticks.push(clean(ticks[ticks.length - 1] + step));
  return { ticks, step };
};
