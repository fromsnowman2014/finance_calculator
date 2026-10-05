'use client';

import { RefreshCw } from 'lucide-react';
import { useAppStore, MARKET_PERIODS } from '@/store/useAppStore';
import { useLang, useT } from '@/i18n';
import { INDICATORS, LAYERS } from '@/lib/market/indicators';
import { formatDay, periodStart } from '@/lib/market/time';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/controls';
import { useMarketData } from './useMarketData';
import { latestDay, useAssessment } from './useAssessment';
import { MarketSummary } from './MarketSummary';
import { IndicatorCard } from './IndicatorCard';

export function MarketTab() {
  const t = useT();
  const lang = useLang();
  const period = useAppStore((s) => s.marketPeriod);
  const setPeriod = useAppStore((s) => s.setMarketPeriod);
  const { state, retry } = useMarketData();
  const data = state.status === 'ready' ? state.data : undefined;
  const assessed = useAssessment(data);
  const endDay = data ? latestDay(data) : 0;
  const windowStart = data ? periodStart(period, endDay) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold text-ink sm:text-2xl">{t.market.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{t.market.subtitle}</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <Segmented
            ariaLabel={t.market.periodLabel}
            value={period}
            onChange={setPeriod}
            options={MARKET_PERIODS.map((p) => ({ value: p, label: t.market.periods[p] }))}
          />
          {data && <span className="text-xs text-ink-3">{t.market.dataAsOf(formatDay(endDay, lang))}</span>}
        </div>
      </div>

      <ol className="grid gap-2 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-3 sm:gap-4">
        <li className="text-xs font-semibold tracking-wide text-ink-3 uppercase sm:col-span-3">{t.market.howToUseTitle}</li>
        {t.market.howToUse.map((step, i) => (
          <li key={step} className="flex gap-2.5 text-sm text-ink-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      {(state.status === 'loading' || state.status === 'idle') && (
        <Card className="flex items-center justify-center gap-2 py-16 text-sm text-ink-3">
          <RefreshCw size={16} aria-hidden className="animate-spin" />
          {t.market.loading}
        </Card>
      )}

      {state.status === 'error' && (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-ink-2">
          {t.market.error}
          <button type="button" onClick={retry} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2">
            {t.market.retry}
          </button>
        </Card>
      )}

      {data && assessed && (
        <>
          <MarketSummary assessed={assessed} />

          {LAYERS.map((layer) => {
            const defs = INDICATORS.filter((d) => d.layer === layer && data.indicators[d.key] && assessed.assessment[d.key]);
            if (defs.length === 0) return null;
            return (
              <section key={layer} aria-labelledby={`layer-${layer}`}>
                <div className="mb-3">
                  <h3 id={`layer-${layer}`} className="text-base font-semibold text-ink">
                    {t.market.layers[layer].name}
                  </h3>
                  <p className="text-sm text-ink-3">{t.market.layers[layer].desc}</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {defs.map((def) => (
                    <IndicatorCard
                      key={def.key}
                      def={def}
                      data={data.indicators[def.key]!}
                      result={assessed.assessment[def.key]!}
                      windowStart={windowStart}
                      endDay={endDay}
                      recessions={data.recessions}
                      className={cn(defs.length === 1 && 'lg:col-span-2')}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <p className="border-t border-line pt-4 text-xs leading-relaxed text-ink-3">{t.market.footnote}</p>
        </>
      )}
    </div>
  );
}
