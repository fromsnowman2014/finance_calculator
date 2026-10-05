'use client';

import { useMemo, type ReactNode } from 'react';
import { Clock, Coins, Hourglass, Lightbulb, Receipt, Scale, Sparkles } from 'lucide-react';
import { useFormatters, useT } from '@/i18n';
import { expectedTotalReturn, simulateGrowth, yearsToDouble, type GrowthInputs, type GrowthResult } from '@/lib/finance/growth';
import { Card, CardHeader } from '@/components/ui/Card';

const DELAY_YEARS = 5;
const SAMPLE_FEE = 0.5;

export function GrowthInsights({ inputs, result }: { inputs: GrowthInputs; result: GrowthResult }) {
  const t = useT();
  const f = useFormatters();

  const items = useMemo(() => {
    const list: { icon: ReactNode; text: string }[] = [];
    const money = (v: number) => f.money(v, { compact: true });

    const totalRate = expectedTotalReturn(inputs);
    const doubling = yearsToDouble(totalRate);
    if (Number.isFinite(doubling)) {
      list.push({ icon: <Clock size={16} />, text: t.growth.insightDouble(f.pct(totalRate), f.num(doubling, 1)) });
    }

    if (result.totalProfit > 0 && result.finalValue > 0) {
      list.push({
        icon: <Sparkles size={16} />,
        text: t.growth.insightGrowthShare(f.pct((result.totalProfit / result.finalValue) * 100, 0)),
      });
    }

    if (inputs.expenseRatio > 0) {
      const noFees = simulateGrowth({ ...inputs, expenseRatio: 0 });
      list.push({
        icon: <Receipt size={16} />,
        text: t.growth.insightFees(f.pct(inputs.expenseRatio, 2), money(noFees.finalValue - result.finalValue), f.num(inputs.years)),
      });
    } else if (result.finalValue > 0) {
      const withFees = simulateGrowth({ ...inputs, expenseRatio: SAMPLE_FEE });
      list.push({ icon: <Receipt size={16} />, text: t.growth.insightFeesNone(money(result.finalValue - withFees.finalValue)) });
    }

    if (inputs.years > DELAY_YEARS) {
      const delayed = simulateGrowth({ ...inputs, years: inputs.years - DELAY_YEARS });
      list.push({
        icon: <Hourglass size={16} />,
        text: t.growth.insightDelay(String(DELAY_YEARS), money(result.finalValue - delayed.finalValue)),
      });
    }

    if (inputs.dividendYield > 0) {
      const other = simulateGrowth({ ...inputs, reinvest: !inputs.reinvest });
      const diff = inputs.reinvest ? result.finalValue - other.finalValue : other.finalValue - result.finalValue;
      if (diff > 0) {
        list.push({
          icon: <Coins size={16} />,
          text: inputs.reinvest ? t.growth.insightReinvest(money(diff)) : t.growth.insightReinvestOff(money(diff)),
        });
      }
    }

    if (inputs.inflation > 0) {
      list.push({
        icon: <Scale size={16} />,
        text: t.growth.insightInflation(money(result.finalValue), f.num(inputs.years), money(result.realFinalValue)),
      });
    }
    return list;
  }, [inputs, result, t, f]);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Lightbulb size={18} className="text-accent" aria-hidden />
            {t.growth.insightsTitle}
          </span>
        }
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.text} className="flex gap-3 rounded-xl bg-surface-2 p-3.5 text-sm leading-relaxed text-ink-2">
            <span className="mt-0.5 shrink-0 text-accent-ink" aria-hidden>
              {item.icon}
            </span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
