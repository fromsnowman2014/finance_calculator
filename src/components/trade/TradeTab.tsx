'use client';

import { useId, useMemo } from 'react';
import { ArrowLeftRight, CalendarDays, Percent, RotateCcw, Scale, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppStore, type TradeState } from '@/store/useAppStore';
import { useFormatters, useLang, useT } from '@/i18n';
import { calculateTrade, priceForNetReturn } from '@/lib/finance/trade';
import { TAX_PRESETS, matchTaxPreset, type TaxPresetId } from '@/lib/finance/presets';
import { CURRENCIES, createFormatters, currencySymbol, isCurrencyCode } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Card, CardHeader, SectionLabel } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/NumberField';
import { ChipGroup, Divider, Toggle } from '@/components/ui/controls';
import { DeltaPill, StatTile, toneFor } from '@/components/ui/StatTile';
import { AXIS_TICK, INITIAL_CHART_SIZE, CHART_COLORS, TooltipBox, type RechartsTooltipProps } from '@/components/charts/ChartParts';

const TARGETS = [-20, -10, 0, 10, 20, 30, 50, 100];

interface Step {
  name: string;
  base: number;
  value: number;
  delta: number;
  kind: 'total' | 'up' | 'down';
  label: string;
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tabular h-9 w-36 shrink-0 rounded-lg border border-line bg-surface-2 px-2.5 text-sm font-medium text-ink outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20 sm:w-40"
      />
    </div>
  );
}

function TradeInputs({ inputs, update }: { inputs: TradeState; update: (patch: Partial<TradeState>) => void }) {
  const t = useT();
  const f = useFormatters();
  const reset = useAppStore((s) => s.resetTab);
  const currency = useAppStore((s) => s.currency);
  const homeOptions = CURRENCIES.filter((c) => c.code !== currency);
  const home = inputs.homeCurrency === currency ? homeOptions[0].code : inputs.homeCurrency;

  return (
    <Card>
      <CardHeader
        title={t.trade.inputsTitle}
        action={
          <button
            type="button"
            onClick={() => reset('trade')}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-3 hover:bg-surface-2 hover:text-ink-2"
          >
            <RotateCcw size={13} aria-hidden />
            {t.app.reset}
          </button>
        }
      />
      <div className="space-y-4">
        <NumberField label={t.trade.buyPrice} value={inputs.buyPrice} onChange={(buyPrice) => update({ buyPrice })} max={1e9} prefix={f.symbol} slider={false} />
        <NumberField label={t.trade.sellPrice} value={inputs.sellPrice} onChange={(sellPrice) => update({ sellPrice })} max={1e9} prefix={f.symbol} slider={false} />
        <NumberField label={t.trade.shares} value={inputs.shares} onChange={(shares) => update({ shares })} max={1e9} decimals={4} slider={false} />
        <NumberField
          label={t.trade.commission}
          hint={t.trade.commissionHint}
          value={inputs.commission}
          onChange={(commission) => update({ commission })}
          max={10}
          decimals={3}
          suffix="%"
          slider={false}
        />
        <NumberField
          label={t.trade.dividends}
          hint={t.trade.dividendsHint}
          value={inputs.dividendsPerShare}
          onChange={(dividendsPerShare) => update({ dividendsPerShare })}
          max={1e7}
          prefix={f.symbol}
          slider={false}
        />
        <DateField label={t.trade.buyDate} value={inputs.buyDate} onChange={(buyDate) => update({ buyDate })} />
        <DateField label={t.trade.sellDate} value={inputs.sellDate} onChange={(sellDate) => update({ sellDate })} />
      </div>

      <Divider />

      <SectionLabel>{t.common.taxes}</SectionLabel>
      <ChipGroup
        ariaLabel={t.common.taxes}
        columns={2}
        options={TAX_PRESETS.map((p) => ({ value: p.id, label: t.common.taxPresets[p.id] }))}
        value={matchTaxPreset(inputs.dividendTax, inputs.capitalGainsTax)}
        onChange={(id: TaxPresetId) => {
          const preset = TAX_PRESETS.find((p) => p.id === id)!;
          update({ dividendTax: preset.dividendTax, capitalGainsTax: preset.capitalGainsTax });
        }}
      />
      <div className="mt-4 space-y-4">
        <NumberField label={t.common.dividendTax} value={inputs.dividendTax} onChange={(dividendTax) => update({ dividendTax })} max={100} suffix="%" slider={false} />
        <NumberField label={t.common.capitalGainsTax} value={inputs.capitalGainsTax} onChange={(capitalGainsTax) => update({ capitalGainsTax })} max={100} suffix="%" slider={false} />
      </div>
      <p className="mt-3 text-xs text-ink-3">{t.common.taxNote}</p>

      <Divider />

      <Toggle label={t.trade.fx} hint={t.trade.fxHint} checked={inputs.fxEnabled} onChange={(fxEnabled) => update({ fxEnabled })} />
      {inputs.fxEnabled && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="home-currency" className="text-sm font-medium text-ink-2">
              {t.trade.homeCurrency}
            </label>
            <select
              id="home-currency"
              value={home}
              onChange={(e) => isCurrencyCode(e.target.value) && update({ homeCurrency: e.target.value })}
              className="h-9 w-36 shrink-0 cursor-pointer rounded-lg border border-line bg-surface-2 px-2 text-sm font-medium text-ink sm:w-40"
            >
              {homeOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>
          <NumberField
            label={t.trade.buyFx}
            hint={t.trade.fxUnit(home, currency)}
            value={inputs.buyFx}
            onChange={(buyFx) => update({ buyFx })}
            max={1e7}
            decimals={4}
            prefix={currencySymbol(home)}
            slider={false}
          />
          <NumberField
            label={t.trade.sellFx}
            hint={t.trade.fxUnit(home, currency)}
            value={inputs.sellFx}
            onChange={(sellFx) => update({ sellFx })}
            max={1e7}
            decimals={4}
            prefix={currencySymbol(home)}
            slider={false}
          />
        </div>
      )}
    </Card>
  );
}

export function TradeTab() {
  const t = useT();
  const f = useFormatters();
  const lang = useLang();
  const inputs = useAppStore((s) => s.trade);
  const update = useAppStore((s) => s.updateTrade);
  const currency = useAppStore((s) => s.currency);
  const r = useMemo(() => calculateTrade(inputs), [inputs]);
  const home = inputs.homeCurrency === currency ? CURRENCIES.find((c) => c.code !== currency)!.code : inputs.homeCurrency;
  const homeFormat = useMemo(() => createFormatters(home, lang), [home, lang]);

  const steps = useMemo<Step[]>(() => {
    const list: Step[] = [];
    let running = 0;
    const total = (name: string, value: number) => {
      list.push({ name, base: 0, value, delta: value, kind: 'total', label: f.money(value, { compact: true }) });
      running = value;
    };
    const change = (name: string, delta: number, always = false) => {
      if (!always && Math.abs(delta) < 0.005) return;
      const base = delta >= 0 ? running : running + delta;
      list.push({ name, base, value: Math.abs(delta), delta, kind: delta >= 0 ? 'up' : 'down', label: f.money(delta, { compact: true, signed: true }) });
      running += delta;
    };
    total(t.trade.steps.invested, r.cost);
    change(t.trade.steps.price, r.priceGain, true);
    change(t.trade.steps.dividends, r.dividendsGross);
    change(t.trade.steps.fees, -r.fees);
    change(t.trade.steps.taxes, -(r.capitalGainsTaxPaid + r.dividendTaxPaid));
    total(t.trade.steps.final, r.finalValue);
    return list;
  }, [r, t, f]);

  const targets = useMemo(
    () =>
      TARGETS.map((target) => {
        const price = priceForNetReturn(inputs, target);
        return {
          target,
          price,
          move: inputs.buyPrice > 0 ? (price / inputs.buyPrice - 1) * 100 : NaN,
          profit: (target / 100) * r.cost,
        };
      }),
    [inputs, r.cost],
  );

  const profitTone = toneFor(r.netProfit);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <TradeInputs inputs={inputs} update={update} />
      </div>
      <div className="min-w-0 space-y-6 lg:col-span-8">
        <Card>
          <p className="text-sm font-medium text-ink-2">{r.netProfit >= 0 ? t.trade.netProfit : t.trade.netLoss}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p
              data-testid="net-profit"
              className={cn('text-4xl font-semibold tracking-tight sm:text-5xl', profitTone === 'gain' ? 'text-gain' : profitTone === 'loss' ? 'text-loss' : 'text-ink')}
            >
              {f.money(r.netProfit, { cents: true, signed: true })}
            </p>
            <DeltaPill value={r.netReturnPct}>{f.pct(r.netReturnPct, 2, true)}</DeltaPill>
          </div>
          <p className="mt-2 text-sm text-ink-2">{t.trade.onInvested(f.money(r.cost, { cents: true }))}</p>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile
            icon={<Percent size={15} />}
            label={t.trade.annualized}
            value={f.pct(r.annualizedReturnPct, 2, true)}
            tone={toneFor(r.annualizedReturnPct)}
            sub={Number.isFinite(r.holdingDays) && r.holdingDays > 0 ? t.trade.heldFor(f.num(r.holdingDays)) : t.trade.noDates}
          />
          <StatTile
            icon={<CalendarDays size={15} />}
            label={t.trade.priceChange}
            value={f.pct(r.priceChangePct, 2, true)}
            tone={toneFor(r.priceChangePct)}
            sub={t.trade.priceChangeSub(f.money(inputs.buyPrice, { cents: true }), f.money(inputs.sellPrice, { cents: true }))}
          />
          <StatTile icon={<Scale size={15} />} label={t.trade.breakEven} value={f.money(r.breakEvenPrice, { cents: true })} sub={t.trade.breakEvenSub} />
          <StatTile icon={<Wallet size={15} />} label={t.trade.finalValue} value={f.money(r.finalValue, { cents: true })} sub={t.trade.finalValueSub} />
        </div>

        {r.fx && (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <ArrowLeftRight size={17} className="text-accent" aria-hidden />
                  {t.trade.fxTitle(home)}
                </span>
              }
              subtitle={`${homeFormat.money(r.fx.costHome)} → ${homeFormat.money(r.fx.finalValueHome)}`}
            />
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FxStat label={t.trade.fxStock} value={f.pct(r.netReturnPct, 2, true)} tone={toneFor(r.netReturnPct)} />
              <FxStat label={t.trade.fxCurrency} value={f.pct(r.fx.currencyChangePct, 2, true)} tone={toneFor(r.fx.currencyChangePct)} />
              <FxStat label={t.trade.fxCombined} value={f.pct(r.fx.returnHomePct, 2, true)} tone={toneFor(r.fx.returnHomePct)} strong />
              <FxStat label={t.trade.fxProfit} value={homeFormat.money(r.fx.profitHome, { signed: true })} tone={toneFor(r.fx.profitHome)} />
            </dl>
            <p className="mt-3 text-xs text-ink-3">{t.trade.fxNote}</p>
          </Card>
        )}

        <Card>
          <CardHeader title={t.trade.waterfallTitle} />
          <div className="h-[280px] w-full sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL_CHART_SIZE}>
              <BarChart data={steps} margin={{ top: 24, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: 'var(--line-strong)' }} interval={0} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => f.money(v, { compact: true })} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-2)' }}
                  content={(props: RechartsTooltipProps<Step>) => {
                    const p = props.active ? props.payload?.[0]?.payload : undefined;
                    if (!p) return null;
                    return (
                      <TooltipBox
                        title={p.name}
                        rows={[{ label: p.name, value: f.money(p.delta, { cents: true, signed: p.kind !== 'total' }), emphasis: true }]}
                      />
                    );
                  }}
                />
                <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="value" stackId="w" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
                  {steps.map((s) => (
                    <Cell
                      key={s.name}
                      fill={s.kind === 'total' ? CHART_COLORS.neutral : s.kind === 'up' ? CHART_COLORS.gain : CHART_COLORS.loss}
                    />
                  ))}
                  <LabelList dataKey="label" position="top" fill="var(--ink-2)" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-0 sm:p-0">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardHeader title={t.trade.targetsTitle} subtitle={t.trade.targetsSubtitle} />
          </div>
          <div className="overflow-x-auto">
            <table className="tabular w-full min-w-[480px] text-sm">
              <thead className="border-y border-line bg-surface-2 text-xs text-ink-2">
                <tr>
                  <th scope="col" className="px-5 py-2.5 text-left font-medium sm:px-6">{t.trade.targetReturn}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">{t.trade.targetPrice}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">{t.trade.targetMove}</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium sm:px-6">{t.trade.targetProfit}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {targets.map((row) => (
                  <tr key={row.target} className={cn(row.target === 0 && 'bg-accent-soft/60')}>
                    <td className={cn('px-5 py-2.5 font-medium sm:px-6', row.target > 0 ? 'text-gain' : row.target < 0 ? 'text-loss' : 'text-ink')}>
                      {row.target === 0 ? t.trade.breakEvenRow : f.pct(row.target, 0, true)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-ink">{f.money(row.price, { cents: true })}</td>
                    <td className="px-4 py-2.5 text-right text-ink-2">{f.pct(row.move, 1, true)}</td>
                    <td className="px-5 py-2.5 text-right text-ink-2 sm:px-6">{f.money(row.profit, { cents: true, signed: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FxStat({ label, value, tone, strong }: { label: string; value: string; tone: 'gain' | 'loss' | 'default'; strong?: boolean }) {
  return (
    <div className={cn('rounded-xl px-3 py-2.5', strong ? 'bg-accent-soft' : 'bg-surface-2')}>
      <dt className="text-xs text-ink-2">{label}</dt>
      <dd className={cn('mt-0.5 text-lg font-semibold', tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-ink')}>{value}</dd>
    </div>
  );
}
