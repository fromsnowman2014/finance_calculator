'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { IndicatorDef } from '@/lib/market/indicators';
import { epochDayToMs, type Point } from '@/lib/market/transform';
import { formatDay, formatTick, niceTicks, timeTicks } from '@/lib/market/time';
import type { Lang } from '@/lib/format';
import { AXIS_TICK, INITIAL_CHART_SIZE, TooltipBox, type RechartsTooltipProps } from '@/components/charts/ChartParts';
import { STATUS_COLOR } from './StatusPill';

interface Row {
  t: number;
  v: number;
}

const MS_PER_DAY = 86_400_000;

export function IndicatorChart({
  def,
  name,
  points,
  startDay,
  endDay,
  recessions,
  lang,
  formatValue,
}: {
  def: IndicatorDef;
  name: string;
  points: Point[];
  startDay: number;
  endDay: number;
  recessions: [number, number][];
  lang: Lang;
  formatValue: (v: number) => string;
}) {
  const rows = useMemo<Row[]>(
    () => points.filter(([d]) => d >= startDay && d <= endDay).map(([d, v]) => ({ t: epochDayToMs(d), v })),
    [points, startDay, endDay],
  );

  const { ticks, monthly } = useMemo(() => timeTicks(startDay, endDay), [startDay, endDay]);

  // Always show both thresholds so the reader can see how far today is from the danger zones.
  const { yTicks, yMin, yMax, axisDecimals } = useMemo(() => {
    let lo = Math.min(def.watch, def.warning);
    let hi = Math.max(def.watch, def.warning);
    for (const r of rows) {
      if (r.v < lo) lo = r.v;
      if (r.v > hi) hi = r.v;
    }
    const { ticks: yt, step } = niceTicks(lo, hi, 4);
    return {
      yTicks: yt,
      yMin: yt[0],
      yMax: yt[yt.length - 1],
      // Enough decimals to print the step itself (2.5 → 1, 0.25 → 2, 50 → 0).
      axisDecimals: Math.min(3, (String(Number(step.toPrecision(6))).split('.')[1] ?? '').length),
    };
  }, [rows, def.watch, def.warning]);
  // Axis labels stay short: units only for percentages (the card header shows full values).
  const axisLabel = (v: number) =>
    `${new Intl.NumberFormat('en-US', { minimumFractionDigits: axisDecimals, maximumFractionDigits: axisDecimals }).format(v).replace(/^-/, '−')}${def.unit === '%' ? '%' : ''}`;

  const last = rows[rows.length - 1];
  const up = def.direction === 'up';
  const watchZone = up ? [def.watch, def.warning] : [def.warning, def.watch];
  const warningZone = up ? [def.warning, yMax] : [yMin, def.warning];

  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL_CHART_SIZE}>
      <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        {recessions.map(([a, b]) => (
          <ReferenceArea
            key={a}
            x1={Math.max(epochDayToMs(a), epochDayToMs(startDay))}
            x2={Math.min(epochDayToMs(b), epochDayToMs(endDay))}
            fill="var(--chart-recession)"
            fillOpacity={1}
            ifOverflow="hidden"
            strokeOpacity={0}
          />
        ))}
        <ReferenceArea y1={watchZone[0]} y2={watchZone[1]} fill={STATUS_COLOR.watch} fillOpacity={0.1} strokeOpacity={0} ifOverflow="hidden" />
        <ReferenceArea y1={warningZone[0]} y2={warningZone[1]} fill={STATUS_COLOR.warning} fillOpacity={0.09} strokeOpacity={0} ifOverflow="hidden" />
        <XAxis
          type="number"
          dataKey="t"
          scale="time"
          domain={[epochDayToMs(startDay), epochDayToMs(endDay)]}
          ticks={ticks.map(epochDayToMs)}
          tickFormatter={(ms: number) => formatTick(Math.round(ms / MS_PER_DAY), monthly, lang)}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: 'var(--line-strong)' }}
          interval={0}
          allowDataOverflow
        />
        <YAxis
          domain={[yMin, yMax]}
          ticks={yTicks}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={axisLabel}
          allowDataOverflow
        />
        <Tooltip
          cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
          content={(props: RechartsTooltipProps<Row>) => {
            const p = props.active ? props.payload?.[0]?.payload : undefined;
            if (!p) return null;
            return (
              <TooltipBox
                title={formatDay(Math.round(p.t / MS_PER_DAY), lang)}
                rows={[{ label: name, value: formatValue(p.v), color: 'var(--series-1)', kind: 'line', emphasis: true }]}
              />
            );
          }}
        />
        <Line
          type="linear"
          dataKey="v"
          stroke="var(--series-1)"
          strokeWidth={1.75}
          dot={false}
          isAnimationActive={false}
          activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }}
        />
        {last && <ReferenceDot x={last.t} y={last.v} r={4} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
