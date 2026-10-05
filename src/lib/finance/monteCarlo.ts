import { clampHorizon, type GrowthInputs } from './growth';

export interface MonteCarloYear {
  year: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  /** Cumulative money invested by this year (same in every path). */
  contributions: number;
}

export interface MonteCarloResult {
  years: MonteCarloYear[];
  simulations: number;
  /** Share of paths ending above the money invested, 0–1. */
  probabilityOfProfit: number;
  /** Share of paths reaching the goal, 0–1 (NaN when there is no goal). */
  probabilityOfGoal: number;
  /** Share of paths that were ever below the money invested at a year end, 0–1. */
  probabilityOfLossYear: number;
}

/** Small, fast, seedable PRNG so results stay stable while inputs change. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const normalGenerator = (random: () => number) => {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }
    let u = 0;
    while (u === 0) u = random();
    const v = random();
    const radius = Math.sqrt(-2 * Math.log(u));
    spare = radius * Math.sin(2 * Math.PI * v);
    return radius * Math.cos(2 * Math.PI * v);
  };
};

const percentile = (sorted: Float64Array, p: number) => {
  if (sorted.length === 0) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

/**
 * Simulates many possible markets with log-normally distributed monthly returns.
 * The expected price return is treated as the median annual growth rate, so the
 * median path lines up with the deterministic projection.
 */
export const runMonteCarlo = (
  inputs: GrowthInputs,
  options: { simulations?: number; seed?: number } = {},
): MonteCarloResult => {
  const simulations = options.simulations ?? 1000;
  const years = clampHorizon(inputs.years);
  const random = mulberry32(options.seed ?? 20240501);
  const normal = normalGenerator(random);

  const mu = Math.log(1 + inputs.priceReturn / 100) / 12;
  const sigma = Math.max(0, inputs.volatility) / 100 / Math.sqrt(12);
  const dividendRate = Math.max(0, inputs.dividendYield) / 100 / 12;
  const divTax = Math.min(100, Math.max(0, inputs.dividendTax)) / 100;
  const feeRate = Math.max(0, inputs.expenseRatio) / 100 / 12;
  const initial = Math.max(0, inputs.initial);

  // Contributions are the same in every path.
  const contributionsByYear = [initial];
  const monthlyByYear: number[] = [];
  {
    let monthly = Math.max(0, inputs.monthly);
    let total = initial;
    for (let y = 1; y <= years; y++) {
      monthlyByYear.push(monthly);
      total += monthly * 12;
      contributionsByYear.push(total);
      monthly *= 1 + inputs.contributionGrowth / 100;
    }
  }

  const valuesByYear = Array.from({ length: years + 1 }, () => new Float64Array(simulations));
  let everBelowCount = 0;

  for (let s = 0; s < simulations; s++) {
    let balance = initial;
    let cash = 0;
    let everBelow = false;
    valuesByYear[0][s] = initial;

    for (let y = 1; y <= years; y++) {
      const monthly = monthlyByYear[y - 1];
      for (let m = 0; m < 12; m++) {
        balance += monthly;
        balance *= Math.exp(mu + sigma * normal());
        const netDividend = balance * dividendRate * (1 - divTax);
        if (inputs.reinvest) balance += netDividend;
        else cash += netDividend;
        balance -= balance * feeRate;
      }
      const total = balance + cash;
      valuesByYear[y][s] = total;
      if (total < contributionsByYear[y]) everBelow = true;
    }
    if (everBelow) everBelowCount++;
  }

  const result: MonteCarloYear[] = valuesByYear.map((values, year) => {
    const sorted = values.slice().sort();
    return {
      year,
      p10: percentile(sorted, 0.1),
      p25: percentile(sorted, 0.25),
      p50: percentile(sorted, 0.5),
      p75: percentile(sorted, 0.75),
      p90: percentile(sorted, 0.9),
      contributions: contributionsByYear[year],
    };
  });

  const finals = valuesByYear[years];
  const invested = contributionsByYear[years];
  let profitCount = 0;
  let goalCount = 0;
  for (let s = 0; s < simulations; s++) {
    if (finals[s] > invested) profitCount++;
    if (inputs.goal > 0 && finals[s] >= inputs.goal) goalCount++;
  }

  return {
    years: result,
    simulations,
    probabilityOfProfit: simulations > 0 ? profitCount / simulations : 0,
    probabilityOfGoal: inputs.goal > 0 && simulations > 0 ? goalCount / simulations : NaN,
    probabilityOfLossYear: simulations > 0 ? everBelowCount / simulations : 0,
  };
};
