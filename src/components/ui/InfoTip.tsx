import { Info } from 'lucide-react';

/** Small info icon with a hover/focus tooltip. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        // Sits inside <label>s: don't let a click toggle or focus the labelled control.
        onClick={(e) => e.preventDefault()}
        className="rounded-full p-0.5 text-ink-3 transition-colors hover:text-ink-2 focus-visible:text-ink-2 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Info size={14} aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 max-w-[70vw] -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-normal normal-case leading-relaxed tracking-normal text-ink-2 opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
