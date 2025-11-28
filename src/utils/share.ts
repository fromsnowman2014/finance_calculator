import { CalculatorState } from "@/types/calculator";

export const generateShareUrl = (state: CalculatorState): string => {
  if (typeof window === 'undefined') return '';
  
  const params = new URLSearchParams();
  params.set('p', state.initialBalance.toString());
  params.set('c', state.monthlyContribution.toString());
  params.set('y', state.years.toString());
  params.set('r', state.interestRate.toString());
  
  if (state.yearlyIncrease > 0) {
    params.set('inc', state.yearlyIncrease.toString());
  }
  
  if (state.isInflationAdjusted) {
    params.set('inf', '1');
  }

  return `${window.location.protocol}//${window.location.host}${window.location.pathname}?${params.toString()}`;
};

export const parseShareParams = (searchParams: URLSearchParams): Partial<CalculatorState> => {
  const state: Partial<CalculatorState> = {};
  
  const p = searchParams.get('p');
  if (p) state.initialBalance = Number(p);
  
  const c = searchParams.get('c');
  if (c) state.monthlyContribution = Number(c);
  
  const y = searchParams.get('y');
  if (y) state.years = Number(y);
  
  const r = searchParams.get('r');
  if (r) state.interestRate = Number(r);
  
  const inc = searchParams.get('inc');
  if (inc) state.yearlyIncrease = Number(inc);
  
  const inf = searchParams.get('inf');
  if (inf) state.isInflationAdjusted = inf === '1';
  
  return state;
};

