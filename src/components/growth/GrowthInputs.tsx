'use client';

import { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useAppStore, type GrowthState } from '@/store/useAppStore';
import { useFormatters, useT } from '@/i18n';
import { expectedTotalReturn } from '@/lib/finance/growth';
import { MARKET_PRESETS, TAX_PRESETS, matchTaxPreset, type MarketPresetId, type TaxPresetId } from '@/lib/finance/presets';
import { currencyScale } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Card, CardHeader, SectionLabel } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/NumberField';
import { ChipGroup, Divider, Toggle } from '@/components/ui/controls';

export function GrowthInputs() {
  const t = useT();
  const f = useFormatters();
  const g = useAppStore((s) => s.growth);
  const update = useAppStore((s) => s.updateGrowth);
  const reset = useAppStore((s) => s.resetTab);
  const currency = useAppStore((s) => s.currency);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const scale = currencyScale(currency);

  const setPreset = (id: MarketPresetId) => {
    const preset = MARKET_PRESETS.find((p) => p.id === id);
    update(preset ? { preset: id, priceReturn: preset.priceReturn, dividendYield: preset.dividendYield, volatility: preset.volatility } : { preset: 'custom' });
  };
  const setAssumption = (patch: Partial<GrowthState>) => update({ ...patch, preset: 'custom' });
  const setTaxPreset = (id: TaxPresetId) => {
    const preset = TAX_PRESETS.find((p) => p.id === id)!;
    update({ dividendTax: preset.dividendTax, capitalGainsTax: preset.capitalGainsTax });
  };

  const presetIds: MarketPresetId[] = [...MARKET_PRESETS.map((p) => p.id), 'custom'];

  return (
    <Card>
      <CardHeader
        title={t.growth.inputsTitle}
        action={
          <button
            type="button"
            onClick={() => reset('growth')}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-3 hover:bg-surface-2 hover:text-ink-2"
          >
            <RotateCcw size={13} aria-hidden />
            {t.app.reset}
          </button>
        }
      />

      <SectionLabel>{t.growth.preset}</SectionLabel>
      <ChipGroup
        ariaLabel={t.growth.preset}
        options={presetIds.map((id) => ({ value: id, label: t.growth.presets[id] }))}
        value={g.preset}
        onChange={setPreset}
      />
      <p className="mt-2 text-xs text-ink-3">
        {t.growth.presetSummary(f.pct(expectedTotalReturn(g)), f.pct(g.volatility, 0))}
        <span className="block">{t.growth.presetNote}</span>
      </p>

      <Divider />

      <div className="space-y-5">
        <NumberField
          label={t.growth.initial}
          value={g.initial}
          onChange={(initial) => update({ initial })}
          max={1e11}
          decimals={0}
          prefix={f.symbol}
          slider={{ min: 0, max: 500000 * scale, step: 1000 * scale }}
        />
        <NumberField
          label={t.growth.monthly}
          value={g.monthly}
          onChange={(monthly) => update({ monthly })}
          max={1e10}
          decimals={0}
          prefix={f.symbol}
          slider={{ min: 0, max: 10000 * scale, step: 50 * scale }}
        />
        <NumberField
          label={t.growth.years}
          value={g.years}
          onChange={(years) => update({ years: Math.round(years) })}
          min={1}
          max={60}
          decimals={0}
          suffix={t.common.years}
          slider={{ min: 1, max: 50, step: 1 }}
        />
        <NumberField
          label={t.growth.priceReturn}
          hint={t.growth.priceReturnHint}
          value={g.priceReturn}
          onChange={(priceReturn) => setAssumption({ priceReturn })}
          min={-30}
          max={50}
          suffix="%"
          slider={{ min: -5, max: 20, step: 0.1 }}
        />
        <NumberField
          label={t.growth.dividendYield}
          hint={t.growth.dividendYieldHint}
          value={g.dividendYield}
          onChange={(dividendYield) => setAssumption({ dividendYield })}
          max={20}
          suffix="%"
          slider={{ min: 0, max: 8, step: 0.1 }}
        />
        <Toggle label={t.growth.reinvest} hint={t.growth.reinvestHint} checked={g.reinvest} onChange={(reinvest) => update({ reinvest })} />
        <NumberField
          label={t.growth.goal}
          hint={t.growth.goalHint}
          value={g.goal}
          onChange={(goal) => update({ goal })}
          max={1e13}
          decimals={0}
          prefix={f.symbol}
          slider={{ min: 0, max: 5000000 * scale, step: 10000 * scale }}
        />
      </div>

      <Divider />

      <button
        type="button"
        aria-expanded={advancedOpen}
        onClick={() => setAdvancedOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg py-1 text-sm font-semibold text-ink hover:text-accent-ink"
      >
        {t.common.advanced}
        <ChevronDown size={18} aria-hidden className={cn('text-ink-3 transition-transform', advancedOpen && 'rotate-180')} />
      </button>

      {advancedOpen && (
        <div className="mt-5 space-y-5">
          <NumberField
            label={t.growth.contributionGrowth}
            value={g.contributionGrowth}
            onChange={(contributionGrowth) => update({ contributionGrowth })}
            max={30}
            suffix="%"
            slider={{ min: 0, max: 10, step: 0.5 }}
          />
          <NumberField
            label={t.growth.expenseRatio}
            hint={t.growth.expenseRatioHint}
            value={g.expenseRatio}
            onChange={(expenseRatio) => update({ expenseRatio })}
            max={5}
            suffix="%"
            slider={{ min: 0, max: 2, step: 0.01 }}
          />
          <NumberField
            label={t.growth.inflation}
            value={g.inflation}
            onChange={(inflation) => update({ inflation })}
            min={-5}
            max={30}
            suffix="%"
            slider={{ min: 0, max: 8, step: 0.1 }}
          />
          <NumberField
            label={t.growth.volatility}
            hint={t.growth.volatilityHint}
            value={g.volatility}
            onChange={(volatility) => setAssumption({ volatility })}
            max={80}
            decimals={1}
            suffix="%"
            slider={{ min: 0, max: 40, step: 1 }}
          />

          <div>
            <SectionLabel>{t.common.taxes}</SectionLabel>
            <ChipGroup
              ariaLabel={t.common.taxes}
              columns={2}
              options={TAX_PRESETS.map((p) => ({ value: p.id, label: t.common.taxPresets[p.id] }))}
              value={matchTaxPreset(g.dividendTax, g.capitalGainsTax)}
              onChange={setTaxPreset}
            />
            <div className="mt-4 space-y-5">
              <NumberField
                label={t.common.dividendTax}
                value={g.dividendTax}
                onChange={(dividendTax) => update({ dividendTax })}
                max={100}
                suffix="%"
                slider={{ min: 0, max: 50, step: 0.1 }}
              />
              <NumberField
                label={t.common.capitalGainsTax}
                hint={t.growth.capitalGainsHint}
                value={g.capitalGainsTax}
                onChange={(capitalGainsTax) => update({ capitalGainsTax })}
                max={100}
                suffix="%"
                slider={{ min: 0, max: 50, step: 0.1 }}
              />
            </div>
            <p className="mt-3 text-xs text-ink-3">{t.common.taxNote}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
