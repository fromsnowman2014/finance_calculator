'use client';

import { ArrowRight, Gauge } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/i18n';
import type { AssumptionLevel, Status } from '@/lib/market/indicators';
import { useMarketData } from './useMarketData';
import { useAssessment } from './useAssessment';
import { StatusPill } from './StatusPill';

const LEVEL_STATUS: Record<AssumptionLevel, Status> = { optimistic: 'calm', modest: 'watch', cautious: 'warning' };

/** Compact market verdict shown where people set their return assumptions. */
export function MarketCheckStrip() {
  const t = useT();
  const setTab = useAppStore((s) => s.setTab);
  const { state } = useMarketData();
  const assessed = useAssessment(state.status === 'ready' ? state.data : undefined);

  if (state.status === 'error') return null;
  const ready = assessed?.stance && assessed.level;

  return (
    <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3" data-testid="market-strip">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
          <Gauge size={14} aria-hidden />
          {t.market.strip.title}
        </span>
        {ready && <StatusPill status={LEVEL_STATUS[assessed.level!]} label={t.market.levels[assessed.level!]} />}
      </div>
      {ready ? (
        <>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{t.market.stances[assessed.stance!].title}</p>
          <button
            type="button"
            onClick={() => {
              setTab('market');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
          >
            {t.market.strip.link}
            <ArrowRight size={12} aria-hidden />
          </button>
        </>
      ) : (
        <p className="mt-1.5 text-xs text-ink-3">{t.market.strip.loading}</p>
      )}
    </div>
  );
}
