'use client';

import { useMemo } from 'react';
import { Coins, Plus, RotateCcw, Scale, Trash2, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { useFormatters, useT } from '@/i18n';
import { calculateAverageCost, planAverage, type Lot } from '@/lib/finance/averageCost';
import { cn } from '@/lib/cn';
import { Card, CardHeader } from '@/components/ui/Card';
import { NumberField, NumberInput } from '@/components/ui/NumberField';
import { Divider } from '@/components/ui/controls';
import { DeltaPill, StatTile, toneFor } from '@/components/ui/StatTile';
import { AXIS_TICK, INITIAL_CHART_SIZE, CHART_COLORS, ChartLegend, TooltipBox, type RechartsTooltipProps } from '@/components/charts/ChartParts';

const newLotId = () => `lot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

interface LotPoint {
  name: string;
  price: number;
  shares: number;
}

export function AverageTab() {
  const t = useT();
  const f = useFormatters();
  const inputs = useAppStore((s) => s.average);
  const update = useAppStore((s) => s.updateAverage);
  const reset = useAppStore((s) => s.resetTab);
  const r = useMemo(() => calculateAverageCost(inputs), [inputs]);
  const plan = useMemo(
    () => planAverage(r.totalShares, r.averagePrice, inputs.targetAverage, inputs.nextBuyPrice),
    [r.totalShares, r.averagePrice, inputs.targetAverage, inputs.nextBuyPrice],
  );

  const setLot = (id: string, patch: Partial<Lot>) =>
    update({ lots: inputs.lots.map((lot) => (lot.id === id ? { ...lot, ...patch } : lot)) });
  const removeLot = (id: string) => update({ lots: inputs.lots.filter((lot) => lot.id !== id) });
  const addLot = (lot?: Partial<Lot>) =>
    update({
      lots: [...inputs.lots, { id: newLotId(), price: lot?.price ?? inputs.currentPrice, shares: lot?.shares ?? 1 }],
    });

  const chartData: LotPoint[] = inputs.lots.map((lot, i) => ({
    name: t.average.lotLabel(String(i + 1)),
    price: lot.price,
    shares: lot.shares,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <Card>
          <CardHeader
            title={t.average.inputsTitle}
            action={
              <button
                type="button"
                onClick={() => reset('average')}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-3 hover:bg-surface-2 hover:text-ink-2"
              >
                <RotateCcw size={13} aria-hidden />
                {t.app.reset}
              </button>
            }
          />
          <div className="grid grid-cols-[2.5rem_1fr_1fr_2rem] items-center gap-2 text-xs font-medium text-ink-3">
            <span>#</span>
            <span>{t.average.price}</span>
            <span>{t.average.shares}</span>
            <span />
          </div>
          <ul className="mt-2 space-y-2">
            {inputs.lots.map((lot, i) => (
              <li key={lot.id} className="grid grid-cols-[2.5rem_1fr_1fr_2rem] items-center gap-2">
                <span className="text-sm font-medium text-ink-2">{i + 1}</span>
                <NumberInput
                  ariaLabel={`${t.average.lotLabel(String(i + 1))} ${t.average.price}`}
                  value={lot.price}
                  onChange={(price) => setLot(lot.id, { price })}
                  min={0}
                  max={1e9}
                  prefix={f.symbol}
                />
                <NumberInput
                  ariaLabel={`${t.average.lotLabel(String(i + 1))} ${t.average.shares}`}
                  value={lot.shares}
                  onChange={(shares) => setLot(lot.id, { shares })}
                  min={0}
                  max={1e9}
                  decimals={4}
                />
                <button
                  type="button"
                  aria-label={t.average.removeLot}
                  onClick={() => removeLot(lot.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-loss-soft hover:text-loss"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => addLot()}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong py-2 text-sm font-medium text-ink-2 hover:border-accent hover:text-accent-ink"
          >
            <Plus size={15} aria-hidden />
            {t.average.addLot}
          </button>

          <Divider />

          <NumberField
            label={t.average.currentPrice}
            value={inputs.currentPrice}
            onChange={(currentPrice) => update({ currentPrice })}
            max={1e9}
            prefix={f.symbol}
            slider={false}
          />
        </Card>
      </div>

      <div className="min-w-0 space-y-6 lg:col-span-8">
        <Card>
          <p className="text-sm font-medium text-ink-2">{t.average.averagePrice}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl" data-testid="average-price">
              {f.money(r.averagePrice, { cents: true })}
            </p>
            {r.totalCost > 0 && <DeltaPill value={r.returnPct}>{f.pct(r.returnPct, 2, true)}</DeltaPill>}
          </div>
          <p className="mt-2 text-sm text-ink-2">{t.average.averageSub(f.num(r.totalShares, 4), f.money(r.totalCost, { cents: true }))}</p>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatTile icon={<Coins size={15} />} label={t.average.marketValue} value={f.money(r.marketValue, { cents: true })} />
          <StatTile
            icon={<TrendingUp size={15} />}
            label={t.average.profit}
            value={f.money(r.profit, { cents: true, signed: true })}
            tone={toneFor(r.profit)}
            sub={f.pct(r.returnPct, 2, true)}
          />
          <StatTile
            icon={<Scale size={15} />}
            label={t.average.breakEven}
            value={r.breakEvenMovePct > 0 ? f.pct(r.breakEvenMovePct, 2, true) : t.average.inProfit}
            tone={r.breakEvenMovePct > 0 ? 'default' : 'gain'}
            sub={r.breakEvenMovePct > 0 ? t.average.breakEvenSub(f.money(r.averagePrice, { cents: true })) : undefined}
          />
        </div>

        <Card>
          <CardHeader title={t.average.chartTitle} className="mb-3" />
          <ChartLegend
            className="mb-4"
            items={[
              { label: t.average.price, color: CHART_COLORS.contributions, kind: 'bar' },
              { label: `${t.average.averageLine} ${f.money(r.averagePrice, { cents: true })}`, color: CHART_COLORS.median, kind: 'line' },
              { label: `${t.average.currentLine} ${f.money(inputs.currentPrice, { cents: true })}`, color: CHART_COLORS.gains, kind: 'dashed' },
            ]}
          />
          <div className="h-[280px] w-full sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL_CHART_SIZE}>
              <BarChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: 'var(--line-strong)' }} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => f.money(v, { compact: true })} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-2)' }}
                  content={(props: RechartsTooltipProps<LotPoint>) => {
                    const p = props.active ? props.payload?.[0]?.payload : undefined;
                    if (!p) return null;
                    return (
                      <TooltipBox
                        title={p.name}
                        rows={[
                          { label: t.average.price, value: f.money(p.price, { cents: true }), color: CHART_COLORS.contributions, kind: 'bar', emphasis: true },
                          { label: t.average.shares, value: f.num(p.shares, 4) },
                          { label: t.average.marketValue, value: f.money(p.shares * inputs.currentPrice, { cents: true }) },
                        ]}
                      />
                    );
                  }}
                />
                <Bar dataKey="price" fill={CHART_COLORS.contributions} fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                {r.averagePrice > 0 && (
                  <ReferenceLine
                    y={r.averagePrice}
                    stroke={CHART_COLORS.median}
                    strokeWidth={2}
                    ifOverflow="extendDomain"
                  />
                )}
                {inputs.currentPrice > 0 && (
                  <ReferenceLine
                    y={inputs.currentPrice}
                    stroke={CHART_COLORS.gains}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    ifOverflow="extendDomain"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title={t.average.plannerTitle} subtitle={t.average.plannerSubtitle} />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label={t.average.targetAverage}
              value={inputs.targetAverage}
              onChange={(targetAverage) => update({ targetAverage })}
              max={1e9}
              prefix={f.symbol}
              slider={false}
            />
            <NumberField
              label={t.average.nextBuyPrice}
              value={inputs.nextBuyPrice}
              onChange={(nextBuyPrice) => update({ nextBuyPrice })}
              max={1e9}
              prefix={f.symbol}
              slider={false}
            />
          </div>

          <div className="mt-5 rounded-xl bg-surface-2 p-4">
            {plan.feasible ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-ink" data-testid="planner-result">
                    {t.average.plannerResult(f.num(plan.wholeShares), f.money(inputs.nextBuyPrice, { cents: true }))}
                  </p>
                  <button
                    type="button"
                    onClick={() => addLot({ price: inputs.nextBuyPrice, shares: plan.wholeShares })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    <Plus size={15} aria-hidden />
                    {t.average.addPlanned}
                  </button>
                </div>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <PlanStat label={t.average.plannerCost} value={f.money(plan.cost, { cents: true })} />
                  <PlanStat label={t.average.plannerNewAverage} value={f.money(plan.newAverage, { cents: true })} />
                  <PlanStat label={t.average.plannerNewShares} value={f.num(plan.newTotalShares, 4)} />
                </dl>
                {Math.abs(plan.shares - plan.wholeShares) > 1e-6 && (
                  <p className="text-xs text-ink-3">{t.average.plannerExact(f.num(plan.shares, 4))}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-2">
                {plan.reason === 'no-position'
                  ? t.average.plannerNoPosition
                  : plan.reason === 'already-there'
                    ? t.average.plannerAlready
                    : t.average.plannerUnreachable}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn('rounded-lg bg-surface px-3 py-2.5')}>
      <dt className="text-xs text-ink-2">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold text-ink">{value}</dd>
    </div>
  );
}
