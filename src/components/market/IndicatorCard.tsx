'use client';

import { ChevronDown, ExternalLink } from 'lucide-react';
import { useFormatters, useLang, useT } from '@/i18n';
import type { IndicatorDef, Reading, Status } from '@/lib/market/indicators';
import type { IndicatorData } from '@/lib/market/fred';
import { formatDay, yearOf } from '@/lib/market/time';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { IndicatorChart } from './IndicatorChart';
import { STATUS_COLOR, StatusPill } from './StatusPill';

/** Fewer points than this in the window (quarterly data, short periods) → widen the window. */
const MIN_POINTS = 8;

const fixed = new Map<number, Intl.NumberFormat>();
const formatFixed = (value: number, decimals: number) => {
  let formatter = fixed.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    fixed.set(decimals, formatter);
  }
  return formatter.format(value);
};

export const useIndicatorFormat = () => {
  const t = useT();
  return (def: IndicatorDef, value: number) => {
    if (!Number.isFinite(value)) return '—';
    const sign = def.signed && value > 0 ? '+' : '';
    const unit = def.unit === 'pp' ? t.market.pp : def.unit;
    return `${sign}${formatFixed(value, def.decimals).replace(/^-/, '−')}${unit}`;
  };
};

export function IndicatorCard({
  def,
  data,
  result,
  windowStart,
  endDay,
  recessions,
  className,
}: {
  def: IndicatorDef;
  data: IndicatorData;
  result: { status: Status; reading: Reading };
  /** null = full history. */
  windowStart: number | null;
  endDay: number;
  recessions: [number, number][];
  className?: string;
}) {
  const t = useT();
  const f = useFormatters();
  const lang = useLang();
  const format = useIndicatorFormat();
  const copy = t.market.indicators[def.key];
  const readings = copy.readings as Record<string, string>;
  const points = data.points;
  const [lastDay, lastValue] = points[points.length - 1];

  let start = windowStart ?? points[0][0];
  let extended = false;
  const inWindow = points.filter(([d]) => d >= start).length;
  if (inWindow < MIN_POINTS && points.length >= MIN_POINTS) {
    start = Math.min(start, points[points.length - MIN_POINTS][0]);
    extended = true;
  }
  start = Math.max(start, points[0][0]);

  const zone = (status: 'watch' | 'warning') => {
    const value = status === 'watch' ? def.watch : def.warning;
    const op = def.direction === 'up' ? '≥' : '<';
    return `${t.market.zone[status]} ${op} ${format(def, value)}`;
  };
  const showRecessions = recessions.some(([a, b]) => b >= start && a <= endDay);
  const formatValue = (v: number) => format(def, v);

  return (
    <Card className={cn('flex flex-col p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-ink sm:text-base">{copy.name}</h4>
          <p className="text-xs text-ink-3">{copy.nickname}</p>
        </div>
        <StatusPill status={result.status} label={t.market.status[result.status]} />
      </div>
      <p className="mt-2 text-sm text-ink-2">{copy.short}</p>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold tracking-tight text-ink" data-testid={`indicator-${def.key}`}>
          {format(def, lastValue)}
        </span>
        <span className="text-sm font-medium text-ink-2">{readings[result.reading] ?? readings[result.status]}</span>
        <span className="text-xs text-ink-3">{t.market.asOf(formatDay(lastDay, lang))}</span>
      </div>
      {data.percentile !== null && data.since !== null && (
        <p className="mt-0.5 text-xs text-ink-3">{t.market.percentile(f.pct(data.percentile, 0), String(yearOf(data.since)))}</p>
      )}

      <div className="mt-3 h-[180px] w-full">
        <IndicatorChart
          def={def}
          name={copy.name}
          points={points}
          startDay={start}
          endDay={Math.max(endDay, lastDay)}
          recessions={recessions}
          lang={lang}
          formatValue={formatValue}
        />
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-3">
        <li className="flex items-center gap-1">
          <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: STATUS_COLOR.watch, opacity: 0.7 }} />
          {zone('watch')}
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: STATUS_COLOR.warning, opacity: 0.7 }} />
          {zone('warning')}
        </li>
        {showRecessions && (
          <li className="flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rounded-[2px] bg-[var(--chart-recession)] ring-1 ring-line-strong" />
            {t.market.recessionNote}
          </li>
        )}
      </ul>
      {extended && <p className="mt-1 text-[11px] text-ink-3">{t.market.extended}</p>}

      <details className="group mt-3 border-t border-line pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-ink-2 hover:text-ink">
          {t.market.howToRead}
          <ChevronDown size={14} aria-hidden className="text-ink-3 transition-transform group-open:rotate-180" />
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-ink-2">{copy.howTo}</p>
        <a
          href={`https://fred.stlouisfed.org/series/${def.fred[0]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-accent-ink hover:underline"
        >
          {t.market.source}: FRED {def.fred.join(' / ')}
          <ExternalLink size={11} aria-hidden />
        </a>
      </details>
    </Card>
  );
}
