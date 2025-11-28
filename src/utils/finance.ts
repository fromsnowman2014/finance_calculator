import { CalculatorState, CalculationResult, YearlyResult } from "@/types/calculator";

const INFLATION_RATE = 0.025; // 2.5% default inflation

export const calculateCompoundInterest = (state: CalculatorState): CalculationResult => {
  const { initialBalance, monthlyContribution, years, interestRate, yearlyIncrease, isInflationAdjusted } = state;
  
  let currentPrincipal = initialBalance;
  let currentBalance = initialBalance;
  let currentMonthlyContribution = monthlyContribution;
  
  const yearlyData: YearlyResult[] = [];
  const monthlyRate = interestRate / 100 / 12;
  
  // Initialize year 0
  yearlyData.push({
    year: 0,
    principal: initialBalance,
    interest: 0,
    total: initialBalance,
  });

  for (let year = 1; year <= years; year++) {
    // Calculate for 12 months
    for (let month = 1; month <= 12; month++) {
      // Add interest
      const interest = currentBalance * monthlyRate;
      currentBalance += interest;
      
      // Add contribution
      currentBalance += currentMonthlyContribution;
      currentPrincipal += currentMonthlyContribution;
    }

    // Apply inflation adjustment if enabled
    let displayedPrincipal = currentPrincipal;
    let displayedBalance = currentBalance;
    
    if (isInflationAdjusted) {
      const discountFactor = Math.pow(1 + INFLATION_RATE, year);
      displayedPrincipal = currentPrincipal / discountFactor;
      displayedBalance = currentBalance / discountFactor;
    }

    yearlyData.push({
      year,
      principal: Math.round(displayedPrincipal),
      interest: Math.round(displayedBalance - displayedPrincipal),
      total: Math.round(displayedBalance),
    });

    // Increase monthly contribution for next year if enabled
    if (yearlyIncrease > 0) {
      currentMonthlyContribution *= (1 + yearlyIncrease / 100);
    }
  }

  // Get final values from the last year's data to ensure consistency
  const finalYearData = yearlyData[yearlyData.length - 1];

  return {
    finalBalance: finalYearData.total,
    totalPrincipal: finalYearData.principal,
    totalInterest: finalYearData.interest,
    yearlyData,
  };
};
