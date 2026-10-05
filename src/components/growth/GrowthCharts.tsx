'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFormatters, useT } from '@/i18n';
import type { GrowthInputs, GrowthResult, GrowthYear } from '@/lib/finance/growth';
import type { MonteCarloResult, MonteCarloYear } from '@/lib/finance/monteCarlo';
import { Card, CardHeader } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/controls';
import {
  AXIS_TICK,
  INITIAL_CHART_SIZE,
  yearTicks,
  CHART_COLORS,
  ChartLegend,
  TooltipBox,
  type LegendItem,
  type RechartsTooltipProps,
} from '@/components/charts/ChartParts';

type View = 'growth' | 'risk' | 'dividends';
type Basis = 'nominal' | 'real';

interface GrowthPoint {
  year: number;
  contributions: number;
  dividends: number;
  gains: number;
  total: number;
  raw: GrowthYear;
  deflator: number;
}

interface RiskPoint {
  year: number;
  outer: [number, number];
  inner: [number, number];
  median: number;
  invested: number;
  raw: MonteCarloYear;
  deflator: number;
}

interface DividendPoint {
  year: number;
  net: number;
  tax: number;
}

const CHART_MARGIN = { top: 12, right: 20, bottom: 0, left: 4 };

export function GrowthCharts({
  inputs,
  result,
  monteCarlo,
}: {
  inputs: GrowthInputs;
  result: GrowthResult;
  monteCarlo: MonteCarloResult;
}) {
  const t = useT();
  const f = useFormatters();
  const [view, setView] = useState<View>('growth');
  const [basis, setBasis] = useState<Basis>('nominal');
  const real = basis === 'real';
  const showGoal = inputs.goal > 0 && !real;

  const growthData = useMemo<GrowthPoint[]>(
    () =>
      result.years.map((y) => {
        const d = real ? Math.pow(1 + inputs.inflation / 100, y.year) : 1;
        const total = y.totalValue / d;
        // Stack sums exactly to the total even when price growth is negative.
        const contributions = Math.min(y.contributions / d, total);
        const dividends = Math.min(y.dividends / d, total - contributions);
        return {
          year: y.year,
          contributions,
          dividends,
          gains: Math.max(0, total - contributions - dividends),
          total,
          raw: y,
          deflator: d,
        };
      }),
    [result, real, inputs.inflation],
  );

  const riskData = useMemo<RiskPoint[]>(
    () =>
      monteCarlo.years.map((y) => {
        const d = real ? Math.pow(1 + inputs.inflation / 100, y.year) : 1;
        return {
          year: y.year,
          outer: [y.p10 / d, y.p90 / d],
          inner: [y.p25 / d, y.p75 / d],
          median: y.p50 / d,
          invested: y.contributions / d,
          raw: y,
          deflator: d,
        };
      }),
    [monteCarlo, real, inputs.inflation],
  );

  const dividendData = useMemo<DividendPoint[]>(
    () =>
      result.years.slice(1).map((y) => {
        const d = real ? Math.pow(1 + inputs.inflation / 100, y.year) : 1;
        return { year: y.year, net: y.dividendIncome / d, tax: y.dividendTaxPaid / d };
      }),
    [result, real, inputs.inflation],
  );

  const yTick = (v: number) => f.money(v, { compact: true });
  const ticks = yearTicks(result.years.length - 1);
  const dividendTicks = yearTicks(result.years.length - 1, 1);
  const xTick = (v: number) => t.common.yearShort(String(v));
  const goalLine = showGoal ? (
    <ReferenceLine
      y={inputs.goal}
      stroke={CHART_COLORS.goal}
      strokeDasharray="5 4"
      strokeWidth={1.5}
      ifOverflow="extendDomain"
      label={{
        value: `${t.growth.goalLine} ${f.money(inputs.goal, { compact: true })}`,
        position: 'insideTopLeft',
        fill: 'var(--ink-2)',
        fontSize: 12,
      }}
    />
  ) : null;

  const goalLegend: LegendItem[] = showGoal ? [{ label: t.growth.goalLine, color: CHART_COLORS.goal, kind: 'dashed' }] : [];

  const legends: Record<View, LegendItem[]> = {
    growth: [
      { label: t.growth.contributions, color: CHART_COLORS.contributions, kind: 'area' },
      { label: t.growth.dividends, color: CHART_COLORS.dividends, kind: 'area' },
      { label: t.growth.capitalGains, color: CHART_COLORS.gains, kind: 'area' },
      ...goalLegend,
    ],
    risk: [
      { label: t.growth.band90, color: CHART_COLORS.bandOuter, kind: 'band' },
      { label: t.growth.band50, color: CHART_COLORS.bandInner, kind: 'band' },
      { label: t.growth.median, color: CHART_COLORS.median, kind: 'line' },
      { label: t.growth.invested, color: CHART_COLORS.neutral, kind: 'dashed' },
      ...goalLegend,
    ],
    dividends: [],
  };

  const finalRisk = riskData[riskData.length - 1];
  const hasDividends = inputs.dividendYield > 0;

  return (
    <Card>
      <CardHeader
        title={t.growth.chartTitles[view]}
        action={
          <Segmented
            ariaLabel={t.growth.chartTitles[view]}
            value={view}
            onChange={setView}
            options={(['growth', 'risk', 'dividends'] as const).map((v) => ({ value: v, label: t.growth.chartViews[v] }))}
          />
        }
        className="mb-3"
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ChartLegend items={legends[view]} />
        <Segmented
          ariaLabel={`${t.common.nominal} / ${t.common.real}`}
          value={basis}
          onChange={setBasis}
          options={[
            { value: 'nominal', label: t.common.nominal },
            { value: 'real', label: t.common.real },
          ]}
        />
      </div>

      <div className="h-[300px] w-full sm:h-[360px]">
        {view === 'growth' && (
          <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL_CHART_SIZE}>
            <AreaChart data={growthData} margin={CHART_MARGIN}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="year" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: 'var(--line-strong)' }} tickFormatter={xTick} ticks={ticks} interval={0} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={yTick} width={64} />
              <Tooltip
                cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
                content={(props: RechartsTooltipProps<GrowthPoint>) => {
                  const p = props.active ? props.payload?.[0]?.payload : undefined;
                  if (!p) return null;
                  const d = p.deflator;
                  const profit = p.raw.totalValue - p.raw.contributions;
                  return (
                    <TooltipBox
                      title={t.common.yearLabel(String(p.year))}
                      rows={[
                        { label: t.growth.total, value: f.money(p.total), emphasis: true },
                        { label: t.growth.capitalGains, value: f.money(p.raw.capitalGains / d), color: CHART_COLORS.gains, kind: 'area' },
                        { label: t.growth.dividends, value: f.money(p.raw.dividends / d), color: CHART_COLORS.dividends, kind: 'area' },
                        { label: t.growth.contributions, value: f.money(p.raw.contributions / d), color: CHART_COLORS.contributions, kind: 'area' },
                      ]}
                      footer={`${t.growth.table.returnPct} ${f.pct(p.raw.contributions > 0 ? (profit / p.raw.contributions) * 100 : 0, 1, true)}`}
                    />
                  );
                }}
              />
              <Area type="monotone" dataKey="contributions" stackId="1" stroke={CHART_COLORS.contributions} fill={CHART_COLORS.contributions} fillOpacity={0.22} strokeWidth={2} isAnimationActive={false} />
              <Area type="monotone" dataKey="dividends" stackId="1" stroke={CHART_COLORS.dividends} fill={CHART_COLORS.dividends} fillOpacity={0.22} strokeWidth={2} isAnimationActive={false} />
              <Area type="monotone" dataKey="gains" stackId="1" stroke={CHART_COLORS.gains} fill={CHART_COLORS.gains} fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
              {goalLine}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {view === 'risk' && (
          <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL_CHART_SIZE}>
            <ComposedChart data={riskData} margin={CHART_MARGIN}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="year" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: 'var(--line-strong)' }} tickFormatter={xTick} ticks={ticks} interval={0} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={yTick} width={64} />
              <Tooltip
                cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
                content={(props: RechartsTooltipProps<RiskPoint>) => {
                  const p = props.active ? props.payload?.[0]?.payload : undefined;
                  if (!p) return null;
                  const d = p.deflator;
                  return (
                    <TooltipBox
                      title={t.common.yearLabel(String(p.year))}
                      rows={[
                        { label: 'P90', value: f.money(p.raw.p90 / d), color: CHART_COLORS.bandOuter, kind: 'band' },
                        { label: 'P75', value: f.money(p.raw.p75 / d), color: CHART_COLORS.bandInner, kind: 'band' },
                        { label: t.growth.median, value: f.money(p.median), color: CHART_COLORS.median, kind: 'line', emphasis: true },
                        { label: 'P25', value: f.money(p.raw.p25 / d), color: CHART_COLORS.bandInner, kind: 'band' },
                        { label: 'P10', value: f.money(p.raw.p10 / d), color: CHART_COLORS.bandOuter, kind: 'band' },
                        { label: t.growth.invested, value: f.money(p.invested), color: CHART_COLORS.neutral, kind: 'dashed' },
                      ]}
                    />
                  );
                }}
              />
              <Area type="monotone" dataKey="outer" stroke="none" fill={CHART_COLORS.bandOuter} fillOpacity={1} isAnimationActive={false} activeDot={false} />
              <Area type="monotone" dataKey="inner" stroke="none" fill={CHART_COLORS.bandInner} fillOpacity={1} isAnimationActive={false} activeDot={false} />
              <Line type="monotone" dataKey="invested" stroke={CHART_COLORS.neutral} strokeDasharray="4 3" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="median" stroke={CHART_COLORS.median} strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
              {goalLine}
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {view === 'dividends' &&
          (hasDividends ? (
            <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL_CHART_SIZE}>
              <BarChart data={dividendData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="year" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: 'var(--line-strong)' }} tickFormatter={xTick} ticks={dividendTicks} interval={0} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={yTick} width={64} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-2)' }}
                  content={(props: RechartsTooltipProps<DividendPoint>) => {
                    const p = props.active ? props.payload?.[0]?.payload : undefined;
                    if (!p) return null;
                    return (
                      <TooltipBox
                        title={t.common.yearLabel(String(p.year))}
                        rows={[
                          { label: t.growth.dividendNet, value: f.money(p.net), color: CHART_COLORS.dividends, kind: 'bar', emphasis: true },
                          { label: t.growth.monthlyAvg, value: f.money(p.net / 12) },
                          { label: t.growth.dividendTaxRow, value: f.money(p.tax) },
                        ]}
                      />
                    );
                  }}
                />
                <Bar dataKey="net" fill={CHART_COLORS.dividends} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line text-sm text-ink-3">
              {t.growth.noDividends}
            </div>
          ))}
      </div>

      {view === 'risk' && finalRisk && (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RiskStat label={t.growth.probProfit} value={f.pct(monteCarlo.probabilityOfProfit * 100, 0)} />
            <RiskStat
              label={t.growth.probGoal}
              value={Number.isFinite(monteCarlo.probabilityOfGoal) ? f.pct(monteCarlo.probabilityOfGoal * 100, 0) : t.growth.noGoal}
              muted={!Number.isFinite(monteCarlo.probabilityOfGoal)}
            />
            <RiskStat label={t.growth.badCase} value={f.money(finalRisk.outer[0], { compact: true })} />
            <RiskStat label={t.growth.goodCase} value={f.money(finalRisk.outer[1], { compact: true })} />
          </dl>
          <p className="mt-3 text-xs text-ink-3">
            {t.growth.riskNote(f.num(monteCarlo.simulations), f.pct(inputs.volatility, 0))}{' '}
            {t.growth.probLossYear(f.pct(monteCarlo.probabilityOfLossYear * 100, 0))}
          </p>
        </>
      )}
    </Card>
  );
}

function RiskStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <dt className="text-xs text-ink-2">{label}</dt>
      <dd className={muted ? 'mt-0.5 text-sm font-medium text-ink-3' : 'mt-0.5 text-lg font-semibold text-ink'}>{value}</dd>
    </div>
  );
}
