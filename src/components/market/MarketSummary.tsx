'use client';

import { ArrowRight, CircleCheck, CloudSun, ShieldAlert, Siren, Scale } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useFormatters, useT } from '@/i18n';
import {
  INDICATORS,
  LAYERS,
  cautiousScenario,
  type AssumptionLevel,
  type Layer,
  type Stance,
  type Status,
  type assessMarket,
} from '@/lib/market/indicators';
import { MARKET_PRESETS } from '@/lib/finance/presets';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { StatusIcon, StatusPill } from './StatusPill';

type Assessed = NonNullable<ReturnType<typeof assessMarket>>;

const STANCE_STATUS: Record<Stance, Status> = {
  calm: 'calm',
  mixed: 'watch',
  expensive: 'watch',
  fearful: 'warning',
  defensive: 'warning',
};

const STANCE_ICON = { calm: CircleCheck, mixed: CloudSun, expensive: Scale, fearful: Siren, defensive: ShieldAlert };

const LEVELS: AssumptionLevel[] = ['optimistic', 'modest', 'cautious'];
const LEVEL_STATUS: Record<AssumptionLevel, Status> = { optimistic: 'calm', modest: 'watch', cautious: 'warning' };

export function MarketSummary({ assessed }: { assessed: Assessed }) {
  const t = useT();
  const f = useFormatters();
  const growth = useAppStore((s) => s.growth);
  const updateGrowth = useAppStore((s) => s.updateGrowth);
  const setTab = useAppStore((s) => s.setTab);
  const { stance, level, layers, assessment } = assessed;
  if (!stance || !level) return null;

  const StanceIcon = STANCE_ICON[stance];
  const stanceStatus = STANCE_STATUS[stance];
  // Scenarios start from the selected market preset (S&P 500 when inputs are custom).
  const reference = MARKET_PRESETS.find((p) => p.id === growth.preset) ?? MARKET_PRESETS[0];
  const scenario = cautiousScenario(level, reference);

  const applyScenario = () => {
    if (!scenario) return;
    updateGrowth({ preset: 'custom', priceReturn: scenario.priceReturn, volatility: scenario.volatility });
    setTab('growth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const layerReason = (layer: Layer) => {
    const status = layers[layer];
    if (!status) return null;
    const def = INDICATORS.filter((d) => d.layer === layer).find((d) => assessment[d.key]?.status === status);
    if (!def) return null;
    const result = assessment[def.key]!;
    const readings = t.market.indicators[def.key].readings as Record<string, string>;
    return `${t.market.indicators[def.key].name}: ${readings[result.reading] ?? readings[result.status]}`;
  };

  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{t.market.verdict}</p>
          <div className="mt-2 flex items-start gap-3">
            <span
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in srgb, var(--status-${stanceStatus === 'calm' ? 'good' : stanceStatus === 'watch' ? 'warn' : 'bad'}) 16%, transparent)` }}
            >
              <StanceIcon size={20} aria-hidden className="text-ink" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-ink sm:text-xl" data-testid="market-stance">
                {t.market.stances[stance].title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{t.market.stances[stance].body}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-ink">{t.market.guideTitle}</p>
            <ol className="mt-2 grid grid-cols-3 gap-1.5" aria-label={t.market.guideTitle}>
              {LEVELS.map((l) => {
                const active = l === level;
                return (
                  <li
                    key={l}
                    aria-current={active ? 'step' : undefined}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-center text-xs font-semibold sm:text-sm',
                      active ? 'border-ink/20 bg-surface-2 text-ink shadow-sm' : 'border-line text-ink-3',
                    )}
                  >
                    {active && <StatusIcon status={LEVEL_STATUS[l]} size={14} />}
                    {t.market.levels[l]}
                  </li>
                );
              })}
            </ol>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[linear-gradient(90deg,var(--status-good),var(--status-warn),var(--status-bad))] opacity-70" aria-hidden />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-2 p-3.5">
            <p className="text-sm text-ink-2">
              {scenario
                ? level === 'cautious'
                  ? t.market.scenarioCautious(
                      f.pct(reference.priceReturn),
                      f.pct(scenario.priceReturn),
                      `${f.pct(reference.volatility, 0)} → ${f.pct(scenario.volatility, 0)}`,
                    )
                  : t.market.scenarioModest(f.pct(reference.priceReturn), f.pct(scenario.priceReturn))
                : t.market.scenarioCalm}
            </p>
            {scenario && (
              <button
                type="button"
                onClick={applyScenario}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                {t.market.apply}
                <ArrowRight size={15} aria-hidden />
              </button>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">{t.market.always}</p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1 xl:grid-cols-2">
          {LAYERS.map((layer) => {
            const status = layers[layer];
            return (
              <li key={layer} className="rounded-xl border border-line p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{t.market.layers[layer].name}</span>
                  {status ? (
                    <StatusPill status={status} label={t.market.status[status]} />
                  ) : (
                    <span className="text-xs text-ink-3">{t.market.noData}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-3">{t.market.layers[layer].desc}</p>
                {status && <p className="mt-2 text-xs font-medium text-ink-2">{layerReason(layer)}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
