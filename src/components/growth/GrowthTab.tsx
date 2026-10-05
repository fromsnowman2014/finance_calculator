'use client';

import { useDeferredValue, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { simulateGrowth } from '@/lib/finance/growth';
import { runMonteCarlo } from '@/lib/finance/monteCarlo';
import { GrowthInputs } from './GrowthInputs';
import { GrowthSummary } from './GrowthSummary';
import { GrowthCharts } from './GrowthCharts';
import { GrowthInsights } from './GrowthInsights';
import { GrowthTable } from './GrowthTable';

export function GrowthTab() {
  const inputs = useAppStore((s) => s.growth);
  const result = useMemo(() => simulateGrowth(inputs), [inputs]);
  // The simulation is heavier; let it lag behind slider drags.
  const deferredInputs = useDeferredValue(inputs);
  const monteCarlo = useMemo(() => runMonteCarlo(deferredInputs, { simulations: 1000 }), [deferredInputs]);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <GrowthInputs />
      </div>
      <div className="min-w-0 space-y-6 lg:col-span-8">
        <GrowthSummary inputs={inputs} result={result} />
        <GrowthCharts inputs={inputs} result={result} monteCarlo={monteCarlo} />
        <GrowthInsights inputs={inputs} result={result} />
        <GrowthTable result={result} />
      </div>
    </div>
  );
}
