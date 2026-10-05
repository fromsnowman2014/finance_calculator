import { describe, expect, it } from 'vitest';
import { annualizeMonthly, irr, monthlyFromAnnualPct } from './irr';
import { expectedTotalReturn, simulateGrowth, yearsToDouble, type GrowthInputs } from './growth';
import { runMonteCarlo } from './monteCarlo';
import { calculateTrade, priceForNetReturn, type TradeInputs } from './trade';
import { calculateAverageCost, planAverage } from './averageCost';
import { calculateGoal, futureValue, requiredMonthlyContribution, fireNumber } from './goal';

const baseGrowth: GrowthInputs = {
  initial: 10000,
  monthly: 0,
  years: 10,
  priceReturn: 10,
  dividendYield: 0,
  reinvest: true,
  contributionGrowth: 0,
  expenseRatio: 0,
  dividendTax: 0,
  capitalGainsTax: 0,
  inflation: 0,
  volatility: 15,
  goal: 0,
};

const baseTrade: TradeInputs = {
  buyPrice: 100,
  sellPrice: 150,
  shares: 10,
  commission: 0,
  dividendsPerShare: 0,
  dividendTax: 0,
  capitalGainsTax: 0,
  buyDate: '2024-01-01',
  sellDate: '2025-01-01',
  fxEnabled: false,
  buyFx: 1300,
  sellFx: 1400,
};

describe('irr', () => {
  it('finds the rate of a simple investment', () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 8);
    expect(irr([-100, 0, 121])).toBeCloseTo(0.1, 8);
  });

  it('returns NaN without both inflows and outflows', () => {
    expect(irr([100, 100])).toBeNaN();
    expect(irr([-100, -100])).toBeNaN();
  });

  it('converts between monthly and annual rates', () => {
    expect(annualizeMonthly(monthlyFromAnnualPct(8))).toBeCloseTo(0.08, 10);
  });
});

describe('simulateGrowth', () => {
  it('compounds a lump sum at the expected annual rate', () => {
    const result = simulateGrowth(baseGrowth);
    expect(result.finalValue).toBeCloseTo(10000 * Math.pow(1.1, 10), 4);
    expect(result.totalContributions).toBe(10000);
    expect(result.annualizedReturnPct).toBeCloseTo(10, 6);
    expect(result.years).toHaveLength(11);
  });

  it('adds monthly contributions at the start of each month', () => {
    const result = simulateGrowth({ ...baseGrowth, initial: 0, monthly: 100, years: 1, priceReturn: 0 });
    expect(result.finalValue).toBeCloseTo(1200, 8);
    expect(result.totalContributions).toBe(1200);
    expect(result.totalProfit).toBeCloseTo(0, 8);
  });

  it('keeps the stacked parts consistent with the total', () => {
    const result = simulateGrowth({ ...baseGrowth, monthly: 500, dividendYield: 2, dividendTax: 15, expenseRatio: 0.2, years: 25 });
    for (const y of result.years) {
      expect(y.contributions + y.dividends + y.capitalGains).toBeCloseTo(y.totalValue, 6);
    }
  });

  it('matches the expected total return when dividends are reinvested', () => {
    const inputs = { ...baseGrowth, dividendYield: 2, dividendTax: 15, expenseRatio: 0.5 };
    const result = simulateGrowth(inputs);
    expect(result.annualizedReturnPct).toBeCloseTo(expectedTotalReturn(inputs), 6);
  });

  it('collects dividends as cash when not reinvesting', () => {
    const result = simulateGrowth({ ...baseGrowth, priceReturn: 0, dividendYield: 12, reinvest: false, years: 1 });
    expect(result.finalBalance).toBeCloseTo(10000, 6);
    expect(result.years[1].cashDividends).toBeCloseTo(1200, 6);
    expect(result.finalValue).toBeCloseTo(11200, 6);
  });

  it('charges capital gains tax only on the gain', () => {
    const result = simulateGrowth({ ...baseGrowth, capitalGainsTax: 20 });
    const gain = result.finalBalance - 10000;
    expect(result.capitalGainsTaxDue).toBeCloseTo(gain * 0.2, 6);
    expect(result.afterTaxValue).toBeCloseTo(result.finalValue - gain * 0.2, 6);
  });

  it('expresses values in today\'s money', () => {
    const result = simulateGrowth({ ...baseGrowth, inflation: 3 });
    expect(result.realFinalValue).toBeCloseTo(result.finalValue / Math.pow(1.03, 10), 6);
  });

  it('grows the contribution every year', () => {
    const result = simulateGrowth({ ...baseGrowth, initial: 0, monthly: 100, priceReturn: 0, years: 2, contributionGrowth: 10 });
    expect(result.totalContributions).toBeCloseTo(1200 + 1320, 8);
  });

  it('computes doubling time', () => {
    expect(yearsToDouble(7.2)).toBeCloseTo(9.97, 1);
    expect(yearsToDouble(0)).toBe(Infinity);
  });
});

describe('runMonteCarlo', () => {
  it('is deterministic for a given seed', () => {
    const a = runMonteCarlo({ ...baseGrowth, monthly: 200 }, { simulations: 200, seed: 1 });
    const b = runMonteCarlo({ ...baseGrowth, monthly: 200 }, { simulations: 200, seed: 1 });
    expect(a.years.at(-1)?.p50).toBe(b.years.at(-1)?.p50);
  });

  it('orders percentiles and centers the median near the projection', () => {
    const inputs = { ...baseGrowth, years: 20 };
    const mc = runMonteCarlo(inputs, { simulations: 4000 });
    const last = mc.years.at(-1)!;
    expect(last.p10).toBeLessThan(last.p25);
    expect(last.p25).toBeLessThan(last.p50);
    expect(last.p50).toBeLessThan(last.p75);
    expect(last.p75).toBeLessThan(last.p90);
    const deterministic = simulateGrowth(inputs).finalValue;
    expect(Math.abs(last.p50 / deterministic - 1)).toBeLessThan(0.08);
  });

  it('collapses to the projection with zero volatility', () => {
    const inputs = { ...baseGrowth, volatility: 0, monthly: 300 };
    const mc = runMonteCarlo(inputs, { simulations: 10 });
    expect(mc.years.at(-1)!.p10).toBeCloseTo(simulateGrowth(inputs).finalValue, 4);
    expect(mc.probabilityOfProfit).toBe(1);
  });

  it('reports goal probability only when a goal is set', () => {
    expect(runMonteCarlo(baseGrowth, { simulations: 50 }).probabilityOfGoal).toBeNaN();
    const withGoal = runMonteCarlo({ ...baseGrowth, goal: 1 }, { simulations: 50 });
    expect(withGoal.probabilityOfGoal).toBe(1);
  });
});

describe('calculateTrade', () => {
  it('computes a simple profit and return', () => {
    const r = calculateTrade(baseTrade);
    expect(r.cost).toBe(1000);
    expect(r.netProfit).toBe(500);
    expect(r.netReturnPct).toBe(50);
    expect(r.holdingDays).toBe(366);
  });

  it('applies commissions, dividends and taxes', () => {
    const r = calculateTrade({ ...baseTrade, commission: 1, dividendsPerShare: 2, dividendTax: 15, capitalGainsTax: 20 });
    expect(r.cost).toBeCloseTo(1010, 8);
    expect(r.proceeds).toBeCloseTo(1485, 8);
    expect(r.capitalGainsTaxPaid).toBeCloseTo(475 * 0.2, 8);
    expect(r.dividendsNet).toBeCloseTo(17, 8);
    expect(r.netProfit).toBeCloseTo(475 - 95 + 17, 8);
  });

  it('does not tax losses', () => {
    const r = calculateTrade({ ...baseTrade, sellPrice: 80, capitalGainsTax: 22 });
    expect(r.capitalGainsTaxPaid).toBe(0);
    expect(r.netProfit).toBe(-200);
  });

  it('annualizes over the holding period', () => {
    const r = calculateTrade({ ...baseTrade, sellPrice: 121, buyDate: '2023-01-01', sellDate: '2025-01-01' });
    expect(r.annualizedReturnPct).toBeCloseTo(10, 0);
  });

  it('finds break-even and target prices that round-trip', () => {
    const inputs = { ...baseTrade, commission: 0.25, dividendsPerShare: 1, dividendTax: 15, capitalGainsTax: 22 };
    const breakEven = calculateTrade({ ...inputs, sellPrice: calculateTrade(inputs).breakEvenPrice });
    expect(breakEven.netProfit).toBeCloseTo(0, 6);
    for (const target of [-20, 0, 10, 50]) {
      const price = priceForNetReturn(inputs, target);
      expect(calculateTrade({ ...inputs, sellPrice: price }).netReturnPct).toBeCloseTo(target, 6);
    }
  });

  it('splits home-currency return into stock and currency effects', () => {
    const r = calculateTrade({ ...baseTrade, fxEnabled: true, buyFx: 1000, sellFx: 1100 });
    expect(r.fx?.currencyChangePct).toBeCloseTo(10, 8);
    expect(r.fx?.returnHomePct).toBeCloseTo((1.5 * 1.1 - 1) * 100, 8);
  });
});

describe('average cost', () => {
  const lots = [
    { id: 'a', price: 100, shares: 10 },
    { id: 'b', price: 80, shares: 10 },
  ];

  it('computes the weighted average and P/L', () => {
    const r = calculateAverageCost({ lots, currentPrice: 72, targetAverage: 85, nextBuyPrice: 70 });
    expect(r.averagePrice).toBe(90);
    expect(r.totalShares).toBe(20);
    expect(r.profit).toBe(72 * 20 - 1800);
    expect(r.breakEvenMovePct).toBeCloseTo(25, 8);
  });

  it('plans the shares needed to reach a target average', () => {
    const plan = planAverage(20, 90, 85, 70);
    expect(plan.feasible).toBe(true);
    if (plan.feasible) {
      expect(plan.shares).toBeCloseTo(6.6667, 3);
      expect(plan.wholeShares).toBe(7);
      expect(plan.newAverage).toBeLessThanOrEqual(85);
    }
  });

  it('rejects targets outside the reachable range', () => {
    expect(planAverage(20, 90, 60, 70)).toEqual({ feasible: false, reason: 'unreachable' });
    expect(planAverage(0, 0, 60, 70)).toEqual({ feasible: false, reason: 'no-position' });
  });
});

describe('goal planning', () => {
  it('round-trips the required contribution through the future value', () => {
    const monthly = requiredMonthlyContribution(100000, 5000, 7, 120);
    const fv = futureValue(5000, monthly, monthlyFromAnnualPct(7), 120);
    expect(fv).toBeCloseTo(100000, 4);
  });

  it('needs nothing when the lump sum already gets there', () => {
    expect(requiredMonthlyContribution(1000, 1000, 5, 12)).toBe(0);
  });

  it('handles a zero return', () => {
    expect(requiredMonthlyContribution(12000, 0, 0, 12)).toBeCloseTo(1000, 8);
  });

  it('computes the FIRE number from the withdrawal rate', () => {
    expect(fireNumber(40000, 4)).toBe(1000000);
  });

  it('inflates a target given in today\'s money and asks more when you delay', () => {
    const r = calculateGoal({
      mode: 'amount', target: 100000, annualExpenses: 0, withdrawalRate: 4, years: 10, initial: 0,
      annualReturn: 7, inflation: 3, todaysMoney: true, currentMonthly: 500,
    });
    expect(r.nominalTarget).toBeCloseTo(100000 * Math.pow(1.03, 10), 6);
    expect(r.path.at(-1)!.plan).toBeCloseTo(r.nominalTarget, 4);
    expect(r.delays[1].requiredMonthly).toBeGreaterThan(r.delays[0].requiredMonthly);
    expect(Number.isFinite(r.monthsAtCurrentPace)).toBe(true);
  });
});
