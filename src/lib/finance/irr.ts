/**
 * Internal rate of return for evenly spaced cash flows (index = period).
 * Negative values are money invested, positive values are money received.
 * Returns the per-period rate, or NaN when no rate balances the flows.
 */
export const irr = (cashFlows: number[]): number => {
  const hasNegative = cashFlows.some((cf) => cf < 0);
  const hasPositive = cashFlows.some((cf) => cf > 0);
  if (!hasNegative || !hasPositive) return NaN;

  const npv = (rate: number) => {
    let total = 0;
    let discount = 1;
    const factor = 1 / (1 + rate);
    for (const cf of cashFlows) {
      total += cf * discount;
      discount *= factor;
    }
    return total;
  };

  let low = -0.9999;
  let high = 1;
  let npvLow = npv(low);
  let npvHigh = npv(high);

  // Widen the upper bound for very high returns.
  while (npvLow * npvHigh > 0 && high < 1e6) {
    high *= 4;
    npvHigh = npv(high);
  }
  if (npvLow * npvHigh > 0) return NaN;

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const npvMid = npv(mid);
    if (Math.abs(npvMid) < 1e-9 || high - low < 1e-12) return mid;
    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }
  return (low + high) / 2;
};

/** Converts a monthly rate to an annual effective rate. */
export const annualizeMonthly = (monthlyRate: number): number =>
  Math.pow(1 + monthlyRate, 12) - 1;

/** Converts an annual effective rate (in %) to a monthly rate (decimal). */
export const monthlyFromAnnualPct = (annualPct: number): number =>
  Math.pow(1 + annualPct / 100, 1 / 12) - 1;
