'use client';

import { Coins, Percent, PiggyBank, TrendingUp } from 'lucide-react';
import { useFormatters, useT } from '@/i18n';
import type { GrowthInputs, GrowthResult } from '@/lib/finance/growth';
import { yearsToDouble } from '@/lib/finance/growth';
import { Card } from '@/components/ui/Card';
import { DeltaPill, StatTile, toneFor } from '@/components/ui/StatTile';
import { CHART_COLORS } from '@/components/charts/ChartParts';

export function GrowthSummary({ inputs, result }: { inputs: GrowthInputs; result: GrowthResult }) {
  const t = useT();
  const f = useFormatters();
  const last = result.years[result.years.length - 1];

  const parts = [
    { label: t.growth.contributions, value: last.contributions, color: CHART_COLORS.contributions },
    { label: t.growth.dividends, value: last.dividends, color: CHART_COLORS.dividends },
    { label: t.growth.capitalGains, value: last.capitalGains, color: CHART_COLORS.gains },
  ];
  const positiveTotal = parts.reduce((sum, p) => sum + Math.max(0, p.value), 0);
  const monthlyContributed = result.totalContributions - Math.max(0, inputs.initial);
  const doubling = yearsToDouble(result.annualizedReturnPct);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-2">{t.growth.finalValue(f.num(inputs.years))}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-ink sm:text-5xl" data-testid="final-value">
              {f.money(result.finalValue)}
            </p>
          </div>
          {result.multiple > 0 && (
            <DeltaPill value={result.multiple - 1}>{t.growth.multiple(`×${f.num(result.multiple, 1)}`)}</DeltaPill>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
          <span>{t.growth.realValueLine(f.money(result.realFinalValue))}</span>
          {result.capitalGainsTaxDue > 0 && <span>{t.growth.afterTaxLine(f.money(result.afterTaxValue))}</span>}
          {!inputs.reinvest && last.cashDividends > 0 && (
            <span>{t.growth.cashDividendsLine(f.money(result.finalBalance), f.money(last.cashDividends))}</span>
          )}
        </div>

        {positiveTotal > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium text-ink-3">{t.growth.composition}</p>
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={t.growth.composition}>
              {parts.map((p) =>
                p.value > 0 ? (
                  <div
                    key={p.label}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${(p.value / positiveTotal) * 100}%`, background: p.color }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              {parts.map((p) => (
                <li key={p.label} className="flex items-center gap-2">
                  <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: p.color }} />
                  <span className="text-ink-2">{p.label}</span>
                  <span className="ml-auto font-medium text-ink sm:ml-0">{f.money(p.value, { compact: true })}</span>
                  <span className="text-xs text-ink-3">
                    {f.pct(result.finalValue > 0 ? (p.value / result.finalValue) * 100 : 0, 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          icon={<PiggyBank size={15} />}
          label={t.growth.totalInvested}
          value={f.money(result.totalContributions)}
          sub={t.growth.totalInvestedSub(f.money(Math.max(0, inputs.initial), { compact: true }), f.money(monthlyContributed, { compact: true }))}
        />
        <StatTile
          icon={<TrendingUp size={15} />}
          label={t.growth.totalProfit}
          value={f.money(result.totalProfit, { signed: true })}
          tone={toneFor(result.totalProfit)}
          sub={t.growth.totalProfitSub(f.pct(result.totalReturnPct, 1, true))}
        />
        <StatTile
          icon={<Percent size={15} />}
          label={t.growth.annualized}
          hint={t.growth.annualizedHint}
          value={f.pct(result.annualizedReturnPct, 2)}
          sub={Number.isFinite(doubling) ? t.growth.doublesEvery(f.num(doubling, 1)) : undefined}
        />
        <StatTile
          icon={<Coins size={15} />}
          label={t.growth.dividendIncome}
          value={f.money(result.annualDividendIncome)}
          sub={t.growth.dividendIncomeSub(f.money(result.annualDividendIncome / 12))}
        />
      </div>
    </div>
  );
}
