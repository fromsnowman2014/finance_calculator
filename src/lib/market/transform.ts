/** A time series point: [days since 1970-01-01 (UTC), value]. */
export type Point = [number, number];

const MS_PER_DAY = 86_400_000;

export const toEpochDay = (isoDate: string) => Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / MS_PER_DAY);
export const epochDayToMs = (day: number) => day * MS_PER_DAY;
export const epochDayToIso = (day: number) => new Date(day * MS_PER_DAY).toISOString().slice(0, 10);

/**
 * Parses a FRED "fredgraph.csv" download. Missing observations (blank or ".")
 * are skipped rather than read as zero.
 */
export const parseFredCsv = (csv: string): Point[] => {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2 || !/^observation_date,|^DATE,/i.test(lines[0])) {
    throw new Error('Unexpected FRED response');
  }
  const points: Point[] = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, raw] = lines[i].split(',');
    if (!date || raw === undefined) continue;
    const text = raw.trim();
    if (text === '' || text === '.') continue;
    const value = Number(text);
    const day = toEpochDay(date);
    if (Number.isFinite(value) && Number.isFinite(day)) points.push([day, value]);
  }
  return points;
};

/** Parses the official FRED API response (`series/observations`, JSON). */
export const parseFredJson = (json: unknown): Point[] => {
  const observations = (json as { observations?: { date: string; value: string }[] })?.observations;
  if (!Array.isArray(observations)) throw new Error('Unexpected FRED response');
  const points: Point[] = [];
  for (const { date, value } of observations) {
    if (value === '' || value === '.') continue;
    const v = Number(value);
    const day = toEpochDay(date);
    if (Number.isFinite(v) && Number.isFinite(day)) points.push([day, v]);
  }
  return points;
};

/** Divides two series on matching dates. */
export const ratioSeries = (numerator: Point[], denominator: Point[], scale = 1): Point[] => {
  const byDay = new Map(denominator);
  const out: Point[] = [];
  for (const [day, value] of numerator) {
    const d = byDay.get(day);
    if (d !== undefined && d !== 0) out.push([day, (value / d) * scale]);
  }
  return out;
};

/** Monday-based week number. Epoch day 4 (1970-01-05) was a Monday. */
const weekOf = (day: number) => Math.floor((day - 4) / 7);

/**
 * Keeps daily detail for the most recent `recentDays` and one point per week
 * (the week's last observation) before that, so long histories stay small.
 */
export const downsample = (points: Point[], recentDays = 400): Point[] => {
  if (points.length === 0) return points;
  const cutoff = points[points.length - 1][0] - recentDays;
  const out: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (point[0] >= cutoff) {
      out.push(point);
      continue;
    }
    const next = points[i + 1];
    // Last observation of its week (or the last one before the cutoff).
    if (!next || next[0] >= cutoff || weekOf(next[0]) !== weekOf(point[0])) out.push(point);
  }
  return out;
};

/** Share of observations at or below `value`, 0–100. */
export const percentileOf = (points: Point[], value: number): number | null => {
  if (points.length === 0) return null;
  let below = 0;
  for (const [, v] of points) if (v <= value) below++;
  return (below / points.length) * 100;
};

/** Turns a monthly 0/1 recession indicator into [startDay, endDay) periods. */
export const recessionPeriods = (monthly: Point[]): [number, number][] => {
  const periods: [number, number][] = [];
  let start: number | null = null;
  for (let i = 0; i < monthly.length; i++) {
    const [day, flag] = monthly[i];
    if (flag >= 1 && start === null) start = day;
    if (flag < 1 && start !== null) {
      periods.push([start, day]);
      start = null;
    }
  }
  if (start !== null) {
    const last = monthly[monthly.length - 1][0];
    periods.push([start, last + 31]);
  }
  return periods;
};

/** Rounds to 4 significant digits to keep the payload compact. */
export const compact = (points: Point[]): Point[] => points.map(([d, v]) => [d, Number(v.toPrecision(4))]);
