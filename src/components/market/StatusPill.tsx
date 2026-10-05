import { CircleCheck, OctagonAlert, TriangleAlert } from 'lucide-react';
import type { Status } from '@/lib/market/indicators';
import { cn } from '@/lib/cn';

export const STATUS_COLOR: Record<Status, string> = {
  calm: 'var(--status-good)',
  watch: 'var(--status-warn)',
  warning: 'var(--status-bad)',
};

const INK: Record<Status, string> = {
  calm: 'text-[var(--status-good-ink)]',
  watch: 'text-[var(--status-warn-ink)]',
  warning: 'text-[var(--status-bad-ink)]',
};

const BG: Record<Status, string> = {
  calm: 'bg-[color-mix(in_srgb,var(--status-good)_13%,transparent)]',
  watch: 'bg-[color-mix(in_srgb,var(--status-warn)_18%,transparent)]',
  warning: 'bg-[color-mix(in_srgb,var(--status-bad)_14%,transparent)]',
};

export function StatusIcon({ status, size = 14, className }: { status: Status; size?: number; className?: string }) {
  const Icon = status === 'calm' ? CircleCheck : status === 'watch' ? TriangleAlert : OctagonAlert;
  return <Icon size={size} aria-hidden className={cn(INK[status], className)} />;
}

/** Status always pairs an icon and a label with the color, never color alone. */
export function StatusPill({ status, label, className }: { status: Status; label: string; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-ink', BG[status], className)}>
      <StatusIcon status={status} size={13} />
      {label}
    </span>
  );
}
