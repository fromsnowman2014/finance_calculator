import { create } from 'zustand';
import { CalculatorState } from '@/types/calculator';
import { CurrencyCode } from '@/utils/format';

interface CalculatorStore extends CalculatorState {
  currency: CurrencyCode;
  setField: (field: keyof CalculatorStore, value: number | boolean | string) => void;
}

export const useCalculatorStore = create<CalculatorStore>((set) => ({
  initialBalance: 10000,
  monthlyContribution: 500,
  years: 20,
  interestRate: 8,
  yearlyIncrease: 0,
  isInflationAdjusted: false,
  currency: 'USD',
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
}));
