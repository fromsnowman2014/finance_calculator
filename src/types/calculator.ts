export interface CalculatorState {
  initialBalance: number;
  monthlyContribution: number;
  years: number;
  interestRate: number;
  yearlyIncrease: number;
  isInflationAdjusted: boolean;
}

export interface YearlyResult {
  year: number;
  principal: number;
  interest: number;
  total: number;
}

export interface CalculationResult {
  finalBalance: number;
  totalPrincipal: number;
  totalInterest: number;
  yearlyData: YearlyResult[];
}

