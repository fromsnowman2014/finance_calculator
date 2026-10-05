import { monthlyFromAnnualPct } from './irr';

export interface GoalInputs {
  mode: 'amount' | 'fire';
  /** Target amount (mode = amount). */
  target: number;
  /** Yearly spending to cover (mode = fire). */
  annualExpenses: number;
  /** Safe withdrawal rate, % (mode = fire). */
  withdrawalRate: number;
  years: number;
  initial: number;
  /** Expected total annual return, %. */
  annualReturn: number;
  inflation: number;
  /** Treat the target as today's money and grow it with inflation. */
  todaysMoney: boolean;
  /** What you invest per month right now. */
  currentMonthly: number;
}

export interface GoalPathPoint {
  year: number;
  plan: number;
  current: number;
  goal: number;
}

export interface GoalResult {
  /** Target in today's money. */
  baseTarget: number;
  /** Target in future (nominal) money at the deadline. */
  nominalTarget: number;
  requiredMonthly: number;
  /** Months to reach the goal at the current pace (Infinity if never within 100 years). */
  monthsAtCurrentPace: number;
  totalContributed: number;
  growthShare: number;
  path: GoalPathPoint[];
  delays: { delayYears: number; requiredMonthly: number }[];
}

/** Future value with contributions at the start of each month (annuity due). */
export const futureValue = (initial: number, monthly: number, monthlyRate: number, months: number): number => {
  if (months <= 0) return initial;
  if (Math.abs(monthlyRate) < 1e-12) return initial + monthly * months;
  const growth = Math.pow(1 + monthlyRate, months);
  return initial * growth + monthly * ((growth - 1) / monthlyRate) * (1 + monthlyRate);
};

/** Monthly contribution needed to reach `target`. Never negative. */
export const requiredMonthlyContribution = (
  target: number,
  initial: number,
  annualReturnPct: number,
  months: number,
): number => {
  if (months <= 0) return target > initial ? Infinity : 0;
  const rate = monthlyFromAnnualPct(annualReturnPct);
  const fromInitial = futureValue(initial, 0, rate, months);
  const gap = target - fromInitial;
  if (gap <= 0) return 0;
  const annuityFactor = Math.abs(rate) < 1e-12 ? months : ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
  return gap / annuityFactor;
};

export const fireNumber = (annualExpenses: number, withdrawalRatePct: number): number =>
  withdrawalRatePct > 0 ? annualExpenses / (withdrawalRatePct / 100) : 0;

export const calculateGoal = (inputs: GoalInputs): GoalResult => {
  const years = Number.isFinite(inputs.years) ? Math.min(100, Math.max(1, Math.round(inputs.years))) : 1;
  const months = years * 12;
  const baseTarget =
    inputs.mode === 'fire' ? fireNumber(inputs.annualExpenses, inputs.withdrawalRate) : Math.max(0, inputs.target);
  const nominalTarget = inputs.todaysMoney ? baseTarget * Math.pow(1 + inputs.inflation / 100, years) : baseTarget;
  const initial = Math.max(0, inputs.initial);
  const requiredMonthly = requiredMonthlyContribution(nominalTarget, initial, inputs.annualReturn, months);
  const rate = monthlyFromAnnualPct(inputs.annualReturn);

  const horizon = Math.max(years, 1);
  const path: GoalPathPoint[] = [];
  for (let year = 0; year <= horizon; year++) {
    const goal = inputs.todaysMoney ? baseTarget * Math.pow(1 + inputs.inflation / 100, year) : baseTarget;
    path.push({
      year,
      plan: futureValue(initial, requiredMonthly, rate, year * 12),
      current: futureValue(initial, Math.max(0, inputs.currentMonthly), rate, year * 12),
      goal,
    });
  }

  const totalContributed = initial + requiredMonthly * months;
  const delays = [0, 1, 3, 5, 10]
    .filter((d) => d < years)
    .map((delayYears) => ({
      delayYears,
      requiredMonthly: requiredMonthlyContribution(
        nominalTarget,
        // The initial lump sum keeps compounding while you wait to start monthly investing.
        futureValue(initial, 0, rate, delayYears * 12),
        inputs.annualReturn,
        (years - delayYears) * 12,
      ),
    }));

  // With an inflation-linked target, the goal keeps moving; search month by month.
  let monthsAtCurrentPace = Infinity;
  {
    const monthly = Math.max(0, inputs.currentMonthly);
    let balance = initial;
    const inflationMonthly = monthlyFromAnnualPct(inputs.inflation);
    for (let m = 0; m <= 1200; m++) {
      const goalNow = inputs.todaysMoney ? baseTarget * Math.pow(1 + inflationMonthly, m) : baseTarget;
      if (balance >= goalNow && goalNow > 0) {
        monthsAtCurrentPace = m;
        break;
      }
      balance = (balance + monthly) * (1 + rate);
    }
  }

  return {
    baseTarget,
    nominalTarget,
    requiredMonthly,
    monthsAtCurrentPace,
    totalContributed,
    growthShare: nominalTarget > 0 ? Math.max(0, 1 - totalContributed / nominalTarget) : 0,
    path,
    delays,
  };
};
