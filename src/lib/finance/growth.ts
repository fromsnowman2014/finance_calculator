import { annualizeMonthly, irr, monthlyFromAnnualPct } from './irr';

export interface GrowthInputs {
  /** Lump sum invested at the start. */
  initial: number;
  /** Amount invested at the start of every month. */
  monthly: number;
  years: number;
  /** Expected price appreciation, % per year (CAGR). */
  priceReturn: number;
  /** Dividend yield, % of portfolio value per year. */
  dividendYield: number;
  /** Reinvest dividends (DRIP) instead of taking them as cash. */
  reinvest: boolean;
  /** Raise the monthly contribution by this % every year. */
  contributionGrowth: number;
  /** Annual fund expense ratio / account fee, % of value. */
  expenseRatio: number;
  /** Tax withheld on dividends, %. */
  dividendTax: number;
  /** Tax on realized gains if everything is sold at the end, %. */
  capitalGainsTax: number;
  /** Annual inflation, % — used for "today's money" values. */
  inflation: number;
  /** Annual volatility (standard deviation), % — used by the Monte Carlo simulation. */
  volatility: number;
  /** Optional target amount (0 = no goal). */
  goal: number;
}

export interface GrowthYear {
  year: number;
  /** Cumulative money put in (initial + contributions). */
  contributions: number;
  /** Cumulative after-tax dividends (reinvested or paid out). */
  dividends: number;
  /** Market value growth not explained by contributions or reinvested dividends. */
  capitalGains: number;
  /** Market value of the portfolio. */
  balance: number;
  /** Cumulative dividends taken as cash (only when not reinvesting). */
  cashDividends: number;
  /** Portfolio value + cash dividends collected. */
  totalValue: number;
  /** After-tax dividend income received during this year. */
  dividendIncome: number;
  /** Dividend tax withheld during this year. */
  dividendTaxPaid: number;
  /** Cumulative fees paid. */
  feesPaid: number;
  /** Total value expressed in today's money. */
  realValue: number;
  /** Cost basis of the portfolio (contributions + reinvested dividends). */
  costBasis: number;
}

export interface GrowthResult {
  years: GrowthYear[];
  finalValue: number;
  finalBalance: number;
  totalContributions: number;
  totalDividends: number;
  totalDividendTax: number;
  totalFees: number;
  totalProfit: number;
  totalReturnPct: number;
  /** Value after paying capital gains tax on a full sale at the end. */
  afterTaxValue: number;
  capitalGainsTaxDue: number;
  realFinalValue: number;
  /** Money-weighted annualized return (IRR), %. NaN when undefined. */
  annualizedReturnPct: number;
  /** Expected after-tax dividend income in the year after the horizon. */
  annualDividendIncome: number;
  /** Final value divided by money invested. */
  multiple: number;
}

const toPct = (x: number) => x * 100;

export const simulateGrowth = (inputs: GrowthInputs): GrowthResult => {
  const years = clampHorizon(inputs.years);
  const priceRate = monthlyFromAnnualPct(inputs.priceReturn);
  const dividendRate = Math.max(0, inputs.dividendYield) / 100 / 12;
  const feeRate = Math.max(0, inputs.expenseRatio) / 100 / 12;
  const divTax = clampPct(inputs.dividendTax) / 100;
  const cgTax = clampPct(inputs.capitalGainsTax) / 100;
  const inflation = inputs.inflation / 100;

  const initial = Math.max(0, inputs.initial);
  let balance = initial;
  let contributions = initial;
  let reinvested = 0;
  let cashDividends = 0;
  let fees = 0;
  let dividendTaxTotal = 0;
  let monthly = Math.max(0, inputs.monthly);

  const months = years * 12;
  const cashFlows = new Array<number>(months + 1).fill(0);
  cashFlows[0] -= initial;

  const yearly: GrowthYear[] = [
    {
      year: 0,
      contributions: initial,
      dividends: 0,
      capitalGains: 0,
      balance: initial,
      cashDividends: 0,
      totalValue: initial,
      dividendIncome: 0,
      dividendTaxPaid: 0,
      feesPaid: 0,
      realValue: initial,
      costBasis: initial,
    },
  ];

  for (let year = 1; year <= years; year++) {
    let dividendIncome = 0;
    let dividendTaxPaid = 0;

    for (let m = 0; m < 12; m++) {
      const k = (year - 1) * 12 + m;

      // Contribution at the start of the month.
      balance += monthly;
      contributions += monthly;
      cashFlows[k] -= monthly;

      // Price movement over the month.
      balance *= 1 + priceRate;

      // Dividend paid at the end of the month.
      const grossDividend = balance * dividendRate;
      const tax = grossDividend * divTax;
      const netDividend = grossDividend - tax;
      dividendIncome += netDividend;
      dividendTaxPaid += tax;
      if (inputs.reinvest) {
        balance += netDividend;
        reinvested += netDividend;
      } else {
        cashDividends += netDividend;
        cashFlows[k + 1] += netDividend;
      }

      // Fees charged on the remaining value.
      const fee = balance * feeRate;
      balance -= fee;
      fees += fee;
    }

    dividendTaxTotal += dividendTaxPaid;
    const totalValue = balance + cashDividends;
    const costBasis = contributions + reinvested;
    yearly.push({
      year,
      contributions,
      dividends: reinvested + cashDividends,
      capitalGains: balance - costBasis,
      balance,
      cashDividends,
      totalValue,
      dividendIncome,
      dividendTaxPaid,
      feesPaid: fees,
      realValue: totalValue / Math.pow(1 + inflation, year),
      costBasis,
    });

    monthly *= 1 + inputs.contributionGrowth / 100;
  }

  cashFlows[months] += balance;

  const last = yearly[yearly.length - 1];
  const unrealizedGain = Math.max(0, last.balance - last.costBasis);
  const capitalGainsTaxDue = unrealizedGain * cgTax;
  const totalProfit = last.totalValue - last.contributions;
  const monthlyIrr = irr(cashFlows);

  return {
    years: yearly,
    finalValue: last.totalValue,
    finalBalance: last.balance,
    totalContributions: last.contributions,
    totalDividends: last.dividends,
    totalDividendTax: dividendTaxTotal,
    totalFees: fees,
    totalProfit,
    totalReturnPct: last.contributions > 0 ? toPct(totalProfit / last.contributions) : 0,
    afterTaxValue: last.totalValue - capitalGainsTaxDue,
    capitalGainsTaxDue,
    realFinalValue: last.realValue,
    annualizedReturnPct: Number.isFinite(monthlyIrr) ? toPct(annualizeMonthly(monthlyIrr)) : NaN,
    annualDividendIncome: last.balance * (Math.max(0, inputs.dividendYield) / 100) * (1 - divTax),
    multiple: last.contributions > 0 ? last.totalValue / last.contributions : 0,
  };
};

/** Years for money to double at a given annual return (exact, not the rule-of-72 shortcut). */
export const yearsToDouble = (annualReturnPct: number): number =>
  annualReturnPct > 0 ? Math.log(2) / Math.log(1 + annualReturnPct / 100) : Infinity;

/** Approximate total annual return combining price growth, dividends and fees, %. */
export const expectedTotalReturn = (inputs: Pick<GrowthInputs, 'priceReturn' | 'dividendYield' | 'expenseRatio' | 'dividendTax'>): number => {
  const monthly =
    (1 + monthlyFromAnnualPct(inputs.priceReturn)) *
    (1 + (inputs.dividendYield / 100 / 12) * (1 - clampPct(inputs.dividendTax) / 100)) *
    (1 - inputs.expenseRatio / 100 / 12);
  return (Math.pow(monthly, 12) - 1) * 100;
};

/** Whole years between 0 and 100. */
export function clampHorizon(years: number) {
  return Number.isFinite(years) ? Math.min(100, Math.max(0, Math.round(years))) : 0;
}

function clampPct(value: number) {
  return Math.min(100, Math.max(0, value));
}
