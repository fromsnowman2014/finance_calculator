'use client';

import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { useFormatters, useT } from '@/i18n';
import type { GrowthResult } from '@/lib/finance/growth';
import { downloadCsv } from '@/lib/csv';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';

export function GrowthTable({ result }: { result: GrowthResult }) {
  const t = useT();
  const f = useFormatters();
  const [open, setOpen] = useState(false);
  const rows = result.years.slice(1);
  const columns = t.growth.table;

  const exportCsv = () => {
    downloadCsv(t.growth.csvName, [
      [columns.year, columns.invested, columns.dividends, columns.value, columns.profit, `${columns.returnPct} (%)`, columns.real],
      ...rows.map((r) => {
        const profit = r.totalValue - r.contributions;
        return [
          r.year,
          r.contributions,
          r.dividendIncome,
          r.totalValue,
          profit,
          r.contributions > 0 ? (profit / r.contributions) * 100 : 0,
          r.realValue,
        ];
      }),
    ]);
  };

  return (
    <Card className="p-0 sm:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left text-base font-semibold text-ink hover:text-accent-ink"
        >
          {t.growth.tableTitle}
          <ChevronDown size={18} aria-hidden className={cn('text-ink-3 transition-transform', open && 'rotate-180')} />
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <Download size={14} aria-hidden />
          {t.common.downloadCsv}
        </button>
      </div>

      {open && (
        <div className="max-h-[480px] overflow-auto border-t border-line">
          <table className="tabular w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 bg-surface-2 text-xs text-ink-2">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">{columns.year}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">{columns.invested}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">{columns.dividends}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">{columns.value}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">{columns.profit}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">{columns.returnPct}</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">{columns.real}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const profit = r.totalValue - r.contributions;
                return (
                  <tr key={r.year} className="hover:bg-surface-2/60">
                    <td className="px-4 py-2 text-left font-medium text-ink">{r.year}</td>
                    <td className="px-4 py-2 text-right text-ink-2">{f.money(r.contributions)}</td>
                    <td className="px-4 py-2 text-right text-ink-2">{f.money(r.dividendIncome)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-ink">{f.money(r.totalValue)}</td>
                    <td className={cn('px-4 py-2 text-right', profit >= 0 ? 'text-gain' : 'text-loss')}>
                      {f.money(profit, { signed: true })}
                    </td>
                    <td className="px-4 py-2 text-right text-ink-2">
                      {f.pct(r.contributions > 0 ? (profit / r.contributions) * 100 : 0, 1, true)}
                    </td>
                    <td className="px-4 py-2 text-right text-ink-2">{f.money(r.realValue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
