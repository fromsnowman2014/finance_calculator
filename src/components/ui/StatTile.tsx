import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { InfoTip } from './InfoTip';

export type Tone = 'default' | 'gain' | 'loss';

export const toneFor = (value: number): Tone => (value > 0 ? 'gain' : value < 0 ? 'loss' : 'default');

export function StatTile({
  label,
  value,
  sub,
  tone = 'default',
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-1.5 text-xs leading-snug font-medium text-ink-2 sm:text-sm">
        {icon && <span className="mt-0.5 text-ink-3">{icon}</span>}
        <span className="min-w-0">
          {label}
          {hint && (
            <span className="ml-1">
              <InfoTip text={hint} />
            </span>
          )}
        </span>
      </div>
      <div
        className={cn(
          'mt-1.5 truncate text-xl font-semibold tracking-tight sm:text-2xl',
          tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-ink',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-ink-3">{sub}</div>}
    </div>
  );
}

/** Small pill showing a signed percentage, colored by direction. */
export function DeltaPill({ value, children }: { value: number; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        value > 0 ? 'bg-gain-soft text-gain' : value < 0 ? 'bg-loss-soft text-loss' : 'bg-surface-2 text-ink-2',
      )}
    >
      {children}
    </span>
  );
}
