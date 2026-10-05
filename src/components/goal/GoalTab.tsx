'use client';

import { useMemo } from 'react';
import { Clock, Flag, PiggyBank, RotateCcw } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { useFormatters, useT } from '@/i18n';
import { calculateGoal, fireNumber, type GoalPathPoint } from '@/lib/finance/goal';
import { currencyScale } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Card, CardHeader } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/NumberField';
import { Divider, Segmented, Toggle } from '@/components/ui/controls';
import { StatTile } from '@/components/ui/StatTile';
import { MarketCheckStrip } from '@/components/market/MarketCheckStrip';
import { AXIS_TICK, INITIAL_CHART_SIZE, CHART_COLORS, yearTicks, ChartLegend, TooltipBox, type RechartsTooltipProps } from '@/components/charts/ChartParts';

export function GoalTab() {
  const t = useT();
  const f = useFormatters();
  const inputs = useAppStore((s) => s.goal);
  const update = useAppStore((s) => s.updateGoal);
  const reset = useAppStore((s) => s.resetTab);
  const currency = useAppStore((s) => s.currency);
  const scale = currencyScale(currency);
  const r = useMemo(() => calculateGoal(inputs), [inputs]);
  const years = Math.max(1, Math.round(inputs.years));

  const paceText =
    r.monthsAtCurrentPace === 0
      ? t.goal.reached
      : Number.isFinite(r.monthsAtCurrentPace)
        ? t.goal.currentPaceValue(f.num(r.monthsAtCurrentPace / 12, 1))
        : t.goal.never;

  const baseDelay = r.delays[0]?.requiredMonthly ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <Card>
          <CardHeader
            title={t.goal.inputsTitle}
            action={
              <button
                type="button"
                onClick={() => reset('goal')}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-3 hover:bg-surface-2 hover:text-ink-2"
              >
                <RotateCcw size={13} aria-hidden />
                {t.app.reset}
              </button>
            }
          />
          <Segmented
            ariaLabel={t.goal.mode}
            className="mb-5 flex w-full [&>button]:flex-1"
            value={inputs.mode}
            onChange={(mode) => update({ mode })}
            options={[
              { value: 'amount', label: t.goal.modes.amount },
              { value: 'fire', label: t.goal.modes.fire },
            ]}
          />
          <div className="space-y-5">
            {inputs.mode === 'amount' ? (
              <NumberField
                label={t.goal.target}
                value={inputs.target}
                onChange={(target) => update({ target })}
                max={1e13}
                decimals={0}
                prefix={f.symbol}
                slider={{ min: 0, max: 5000000 * scale, step: 10000 * scale }}
              />
            ) : (
              <>
                <NumberField
                  label={t.goal.annualExpenses}
                  value={inputs.annualExpenses}
                  onChange={(annualExpenses) => update({ annualExpenses })}
                  max={1e11}
                  decimals={0}
                  prefix={f.symbol}
                  slider={{ min: 0, max: 200000 * scale, step: 1000 * scale }}
                />
                <NumberField
                  label={t.goal.withdrawalRate}
                  hint={t.goal.withdrawalHint}
                  value={inputs.withdrawalRate}
                  onChange={(withdrawalRate) => update({ withdrawalRate })}
                  min={0.5}
                  max={20}
                  suffix="%"
                  slider={{ min: 2, max: 6, step: 0.1 }}
                />
                <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-ink">
                  {t.goal.fireNumber(f.money(fireNumber(inputs.annualExpenses, inputs.withdrawalRate)))}
                </p>
              </>
            )}
            <NumberField
              label={t.goal.years}
              value={inputs.years}
              onChange={(v) => update({ years: Math.round(v) })}
              min={1}
              max={60}
              decimals={0}
              suffix={t.common.years}
              slider={{ min: 1, max: 50, step: 1 }}
            />
            <NumberField
              label={t.goal.initial}
              value={inputs.initial}
              onChange={(initial) => update({ initial })}
              max={1e12}
              decimals={0}
              prefix={f.symbol}
              slider={{ min: 0, max: 500000 * scale, step: 1000 * scale }}
            />
            <NumberField
              label={t.goal.annualReturn}
              hint={t.goal.annualReturnHint}
              value={inputs.annualReturn}
              onChange={(annualReturn) => update({ annualReturn })}
              min={-20}
              max={40}
              suffix="%"
              slider={{ min: 0, max: 15, step: 0.1 }}
            />
            <div className="-mt-2">
              <MarketCheckStrip />
            </div>
            <NumberField
              label={t.goal.currentMonthly}
              value={inputs.currentMonthly}
              onChange={(currentMonthly) => update({ currentMonthly })}
              max={1e10}
              decimals={0}
              prefix={f.symbol}
              slider={{ min: 0, max: 10000 * scale, step: 50 * scale }}
            />
          </div>
          <Divider />
          <div className="space-y-5">
            <Toggle label={t.goal.todaysMoney} hint={t.goal.todaysMoneyHint} checked={inputs.todaysMoney} onChange={(todaysMoney) => update({ todaysMoney })} />
            {inputs.todaysMoney && (
              <NumberField
                label={t.goal.inflation}
                value={inputs.inflation}
                onChange={(inflation) => update({ inflation })}
                min={-5}
                max={30}
                suffix="%"
                slider={{ min: 0, max: 8, step: 0.1 }}
              />
            )}
          </div>
        </Card>
      </div>

      <div className="min-w-0 space-y-6 lg:col-span-8">
        <Card>
          <p className="text-sm font-medium text-ink-2">{t.goal.requiredMonthly}</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-ink sm:text-5xl" data-testid="required-monthly">
            {f.money(r.requiredMonthly)}
            <span className="ml-1 text-xl font-medium text-ink-3">{t.common.perMonth}</span>
          </p>
          <p className="mt-2 text-sm text-ink-2">
            {r.requiredMonthly > 0 ? t.goal.requiredSub(f.money(r.nominalTarget), f.num(years)) : t.goal.alreadyThere}
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatTile
            icon={<Flag size={15} />}
            label={t.goal.targetAtDeadline}
            value={f.money(r.nominalTarget)}
            sub={inputs.todaysMoney ? t.goal.targetToday(f.money(r.baseTarget)) : undefined}
          />
          <StatTile icon={<Clock size={15} />} label={t.goal.currentPace} value={paceText} />
          <StatTile
            icon={<PiggyBank size={15} />}
            label={t.goal.contributed}
            value={f.money(r.totalContributed)}
            sub={t.goal.contributedSub(f.pct(r.growthShare * 100, 0))}
          />
        </div>

        <Card>
          <CardHeader title={t.goal.chartTitle} className="mb-3" />
          <ChartLegend
            className="mb-4"
            items={[
              { label: t.goal.planLine, color: CHART_COLORS.contributions, kind: 'line' },
              { label: t.goal.currentLine, color: CHART_COLORS.gains, kind: 'line' },
              { label: t.goal.goalLine, color: CHART_COLORS.goal, kind: 'dashed' },
            ]}
          />
          <div className="h-[280px] w-full sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL_CHART_SIZE}>
              <LineChart data={r.path} margin={{ top: 12, right: 20, bottom: 0, left: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="year"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--line-strong)' }}
                  tickFormatter={(v: number) => t.common.yearShort(String(v))}
                  ticks={yearTicks(r.path.length - 1)}
                  interval={0}
                />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => f.money(v, { compact: true })} />
                <Tooltip
                  cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
                  content={(props: RechartsTooltipProps<GoalPathPoint>) => {
                    const p = props.active ? props.payload?.[0]?.payload : undefined;
                    if (!p) return null;
                    return (
                      <TooltipBox
                        title={t.common.yearLabel(String(p.year))}
                        rows={[
                          { label: t.goal.planLine, value: f.money(p.plan), color: CHART_COLORS.contributions, kind: 'line', emphasis: true },
                          { label: t.goal.currentLine, value: f.money(p.current), color: CHART_COLORS.gains, kind: 'line' },
                          { label: t.goal.goalLine, value: f.money(p.goal), color: CHART_COLORS.goal, kind: 'dashed' },
                        ]}
                      />
                    );
                  }}
                />
                <Line type="monotone" dataKey="goal" stroke={CHART_COLORS.goal} strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="current" stroke={CHART_COLORS.gains} strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="plan" stroke={CHART_COLORS.contributions} strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {r.delays.length > 1 && (
          <Card className="p-0 sm:p-0">
            <div className="p-5 pb-0 sm:p-6 sm:pb-0">
              <CardHeader title={t.goal.delayTitle} subtitle={t.goal.delaySubtitle} />
            </div>
            <div className="overflow-x-auto">
              <table className="tabular w-full min-w-[420px] text-sm">
                <thead className="border-y border-line bg-surface-2 text-xs text-ink-2">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 text-left font-medium sm:px-6">{t.goal.delayStart}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">{t.goal.delayMonthly}</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium sm:px-6">{t.goal.delayExtra}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {r.delays.map((d) => {
                    const extra = baseDelay > 0 ? (d.requiredMonthly / baseDelay - 1) * 100 : NaN;
                    return (
                      <tr key={d.delayYears} className={cn(d.delayYears === 0 && 'bg-accent-soft/60')}>
                        <td className="px-5 py-2.5 font-medium text-ink sm:px-6">
                          {d.delayYears === 0 ? t.goal.delayNow : t.goal.delayIn(String(d.delayYears))}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-ink">
                          {f.money(d.requiredMonthly)}
                          <span className="text-ink-3">{t.common.perMonth}</span>
                        </td>
                        <td className={cn('px-5 py-2.5 text-right sm:px-6', d.delayYears > 0 ? 'text-loss' : 'text-ink-3')}>
                          {d.delayYears === 0 ? '—' : f.pct(extra, 0, true)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
