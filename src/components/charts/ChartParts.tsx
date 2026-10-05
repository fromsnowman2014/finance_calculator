import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type KeyKind = 'area' | 'line' | 'dashed' | 'band' | 'bar';

/** Swatch mirroring the mark: rect for areas/bars, stroke for lines. */
function Key({ kind, color }: { kind: KeyKind; color: string }) {
  if (kind === 'line' || kind === 'dashed') {
    return (
      <svg width="16" height="8" aria-hidden className="shrink-0">
        <line
          x1="1"
          y1="4"
          x2="15"
          y2="4"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={kind === 'dashed' ? '3 3' : undefined}
        />
      </svg>
    );
  }
  return (
    <span
      aria-hidden
      className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]', kind === 'area' && 'opacity-80')}
      style={{ background: color }}
    />
  );
}

export interface LegendItem {
  label: string;
  color: string;
  kind: KeyKind;
}

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-2', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <Key kind={item.kind} color={item.color} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  kind?: KeyKind;
  emphasis?: boolean;
}

/** Tooltip body: values lead, labels follow, line keys identify series. */
export function TooltipBox({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: ReactNode }) {
  return (
    <div className="min-w-48 rounded-xl border border-line bg-surface px-3.5 py-3 text-xs shadow-xl">
      <div className="mb-2 font-semibold text-ink">{title}</div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-2">
              {row.color && <Key kind={row.kind ?? 'line'} color={row.color} />}
              {row.label}
            </span>
            <span className={cn('tabular text-ink', row.emphasis ? 'font-semibold' : 'font-medium')}>{row.value}</span>
          </div>
        ))}
      </div>
      {footer && <div className="mt-2 border-t border-line pt-2 text-ink-3">{footer}</div>}
    </div>
  );
}

export const AXIS_TICK = { fill: 'var(--chart-axis)', fontSize: 12 };

export const CHART_COLORS = {
  contributions: 'var(--series-1)',
  gains: 'var(--series-2)',
  dividends: 'var(--series-3)',
  neutral: 'var(--series-neutral)',
  bandOuter: 'var(--band-outer)',
  bandInner: 'var(--band-inner)',
  median: 'var(--median)',
  goal: 'var(--ink-3)',
  gain: 'var(--gain)',
  loss: 'var(--loss)',
};

/** Minimal shape of the props Recharts passes to a custom tooltip. */
export interface RechartsTooltipProps<T> {
  active?: boolean;
  label?: string | number;
  payload?: readonly { payload: T }[];
}

/** Round year ticks (about six labels) so the axis stays readable on phones. */
export const yearTicks = (maxYear: number, minYear = 0): number[] => {
  const span = maxYear - minYear;
  const step = span <= 6 ? 1 : span <= 12 ? 2 : span <= 30 ? 5 : 10;
  const ticks = [minYear];
  for (let y = Math.ceil((minYear + 1) / step) * step; y <= maxYear; y += step) ticks.push(y);
  // Keep labels at least a step apart at both ends.
  if (ticks.length > 2 && ticks[1] - minYear <= step / 2) ticks.splice(1, 1);
  if (ticks[ticks.length - 1] !== maxYear) {
    if (ticks.length > 1) ticks.pop();
    ticks.push(maxYear);
  }
  return ticks;
};

/** Size used for the server render before the container is measured. */
export const INITIAL_CHART_SIZE = { width: 800, height: 320 };
