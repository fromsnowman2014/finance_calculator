'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useSearchParams } from 'next/navigation';
import { Share2, Check, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { calculateCompoundInterest } from '@/utils/finance';
import { formatCurrency, CURRENCIES, CurrencyCode } from '@/utils/format';
import { generateShareUrl, parseShareParams } from '@/utils/share';
import { CalculatorState } from '@/types/calculator';
import { InputControl } from './InputControl';
import { ResultCard } from './ResultCard';
import { GrowthChart } from './GrowthChart';
import { YearlyBreakdown } from './YearlyBreakdown';

export const CalculatorView: React.FC = () => {
  const searchParams = useSearchParams();
  const [isCopied, setIsCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const state = useCalculatorStore();
  const { 
    initialBalance, 
    monthlyContribution, 
    years, 
    interestRate, 
    yearlyIncrease,
    isInflationAdjusted,
    currency,
    setField 
  } = state;

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate from URL params on mount
  useEffect(() => {
    if (searchParams && searchParams.size > 0) {
      const parsed = parseShareParams(searchParams);
      Object.entries(parsed).forEach(([key, value]) => {
        if (value !== undefined) {
             setField(key as any, value);
        }
      });
    }
  }, [searchParams, setField]);

  const results = useMemo(() => calculateCompoundInterest(state), [
    initialBalance, 
    monthlyContribution, 
    years, 
    interestRate, 
    yearlyIncrease,
    isInflationAdjusted
  ]);

  const handleShare = () => {
    const url = generateShareUrl(state);
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const totalInvested = results.totalPrincipal;
  const totalInterest = results.totalInterest;
  const finalBalance = results.finalBalance;
  const returnRate = totalInvested > 0 ? (totalInterest / totalInvested) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Panel: Controls */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Inputs</h2>
            <div className="flex space-x-2">
              {mounted && (
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              )}
              <button
                  onClick={handleShare}
                  className="flex items-center space-x-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full transition-colors"
              >
                  {isCopied ? <Check size={16} /> : <Share2 size={16} />}
                  <span>{isCopied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Currency</label>
            <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map((c) => (
                    <button
                        key={c.code}
                        onClick={() => setField('currency', c.code)}
                        className={clsx(
                            "px-2 py-2 text-sm font-medium rounded-md border transition-colors",
                            currency === c.code
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-400"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        )}
                    >
                        {c.code}
                    </button>
                ))}
            </div>
          </div>
          
          <InputControl
            label="Initial Balance"
            value={initialBalance}
            onChange={(val) => setField('initialBalance', val)}
            min={0}
            max={10000000}
            step={100}
            prefix={currencySymbol}
          />
          
          <InputControl
            label="Monthly Contribution"
            value={monthlyContribution}
            onChange={(val) => setField('monthlyContribution', val)}
            min={0}
            max={500000}
            step={50}
            prefix={currencySymbol}
          />
          
          <InputControl
            label="Duration (Years)"
            value={years}
            onChange={(val) => setField('years', val)}
            min={1}
            max={50}
            step={1}
            suffix="years"
          />
          
          <InputControl
            label="Interest Rate"
            value={interestRate}
            onChange={(val) => setField('interestRate', val)}
            min={0}
            max={30}
            step={0.1}
            suffix="%"
          />
          
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
             <h3 className="text-sm font-medium text-gray-900 dark:text-white">Advanced Options</h3>
             
             {/* Annual Increase */}
             <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600 dark:text-gray-300">Annual Contribution Increase</label>
                <div className="flex items-center space-x-2 relative rounded-md shadow-sm">
                    <input 
                        type="number" 
                        value={yearlyIncrease}
                        onChange={(e) => setField('yearlyIncrease', Number(e.target.value))}
                        className="block w-20 rounded-md border-gray-300 py-1.5 pr-8 text-right text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        min={0}
                        max={20}
                        step={0.5}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">%</span>
                    </div>
                </div>
             </div>

             {/* Inflation Toggle */}
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Adjust for Inflation</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Assuming 2.5% annual inflation</span>
                </div>
                <button
                    onClick={() => setField('isInflationAdjusted', !isInflationAdjusted)}
                    className={clsx(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
                    isInflationAdjusted ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
                    )}
                    role="switch"
                    aria-checked={isInflationAdjusted}
                >
                    <span
                    aria-hidden="true"
                    className={clsx(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isInflationAdjusted ? "translate-x-5" : "translate-x-0"
                    )}
                    />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Dashboard */}
      <div className="lg:col-span-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard
                title={isInflationAdjusted ? "Real Final Balance" : "Final Balance"}
                value={formatCurrency(finalBalance, currency)}
                color="primary"
                highlight
                subValue={isInflationAdjusted ? "Adjusted for inflation" : undefined}
            />
            <ResultCard
                title={isInflationAdjusted ? "Real Principal" : "Total Principal"}
                value={formatCurrency(totalInvested, currency)}
            />
            <ResultCard
                title={isInflationAdjusted ? "Real Interest" : "Total Interest"}
                value={formatCurrency(totalInterest, currency)}
                subValue={`${returnRate.toFixed(1)}% Return`}
                color="green"
            />
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isInflationAdjusted ? "Asset Growth (Real Value)" : "Asset Growth (Nominal Value)"}
            </h3>
            <GrowthChart data={results} currency={currency} />
        </div>

        {/* Yearly Breakdown Table */}
        <YearlyBreakdown data={results.yearlyData} currency={currency} />
      </div>
    </div>
  );
};
