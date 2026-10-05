'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatInputNumber, parseInputNumber } from '@/lib/format';
import { InfoTip } from './InfoTip';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * Text input for numbers: shows thousands separators when idle and keeps
 * whatever the user types while focused. Clamps to [min, max] on blur.
 */
export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  decimals = 2,
  prefix,
  suffix,
  id,
  ariaLabel,
  className,
  inputClassName,
}: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? formatInputNumber(value, decimals);

  const commit = () => {
    if (draft !== null) {
      const parsed = parseInputNumber(draft);
      const next = Number.isFinite(parsed) ? parsed : value;
      const clamped = Math.min(max, Math.max(min, next));
      if (clamped !== value) onChange(clamped);
    } else if (value < min || value > max) {
      onChange(Math.min(max, Math.max(min, value)));
    }
    setDraft(null);
  };

  return (
    <div
      className={cn(
        'flex h-9 items-center rounded-lg border border-line bg-surface-2 px-2.5 transition-colors focus-within:border-accent focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent/20',
        className,
      )}
    >
      {prefix && <span className="mr-1 shrink-0 text-sm text-ink-3">{prefix}</span>}
      <input
        id={id}
        aria-label={ariaLabel}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cn('tabular w-full min-w-0 bg-transparent text-right text-sm font-medium text-ink outline-none', inputClassName)}
        value={display}
        onFocus={(e) => {
          setDraft(Number.isFinite(value) ? String(value) : '');
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          const parsed = parseInputNumber(e.target.value);
          if (Number.isFinite(parsed) && parsed >= Math.min(0, min) && parsed <= max) onChange(parsed);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
      {suffix && <span className="ml-1 shrink-0 text-sm text-ink-3">{suffix}</span>}
    </div>
  );
}

interface NumberFieldProps extends Omit<NumberInputProps, 'id' | 'ariaLabel' | 'className'> {
  label: string;
  hint?: string;
  /** Slider range; defaults to [min, max]. Pass false to hide the slider. */
  slider?: { min: number; max: number; step: number } | false;
  className?: string;
}

export function NumberField({ label, hint, slider, className, min = 0, max = Infinity, ...input }: NumberFieldProps) {
  const id = useId();
  const range = slider === false ? null : slider ?? { min, max: Number.isFinite(max) ? max : 100, step: 1 };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="min-w-0 text-sm leading-snug font-medium text-ink-2">
          {label}
          {hint && (
            <span className="ml-1">
              <InfoTip text={hint} />
            </span>
          )}
        </label>
        <NumberInput {...input} id={id} min={min} max={max} className="w-36 shrink-0 sm:w-40" />
      </div>
      {range && (
        <input
          type="range"
          aria-label={label}
          min={range.min}
          max={range.max}
          step={range.step}
          value={Math.min(range.max, Math.max(range.min, input.value))}
          onChange={(e) => input.onChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer"
        />
      )}
    </div>
  );
}
