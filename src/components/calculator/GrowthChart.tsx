'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CalculationResult } from '@/types/calculator';
import { formatCompactCurrency, formatCurrency, CurrencyCode } from '@/utils/format';
import { useTheme } from 'next-themes';

interface GrowthChartProps {
  data: CalculationResult;
  currency?: CurrencyCode;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency?: CurrencyCode;
}

const CustomTooltip = ({ active, payload, label, currency = 'USD' }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700 shadow-lg rounded-lg text-sm">
        <p className="font-bold text-gray-900 dark:text-white mb-2">Year {label}</p>
        <div className="space-y-1">
          <p className="text-indigo-600 dark:text-indigo-400">
            Total: <span className="font-semibold">{formatCurrency(payload[1].value as number, currency)}</span>
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Principal: <span className="font-medium">{formatCurrency(payload[0].value as number, currency)}</span>
          </p>
          <p className="text-green-600 dark:text-green-400">
            Interest: <span className="font-medium">{formatCurrency((payload[1].value as number) - (payload[0].value as number), currency)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const GrowthChart: React.FC<GrowthChartProps> = ({ data, currency = 'USD' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="h-[400px] w-full mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data.yearlyData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isDark ? "#9ca3af" : "#9ca3af"} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={isDark ? "#9ca3af" : "#9ca3af"} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#f3f4f6"} />
          <XAxis 
            dataKey="year" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => formatCompactCurrency(value, currency)}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="principal"
            stackId="1"
            stroke="#9ca3af"
            fill="url(#colorPrincipal)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="interest"
            stackId="1"
            stroke="#4f46e5"
            fill="url(#colorTotal)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
