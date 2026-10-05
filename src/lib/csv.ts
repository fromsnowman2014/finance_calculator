const escapeCell = (cell: string | number) => {
  const text = typeof cell === 'number' ? (Number.isFinite(cell) ? String(Math.round(cell * 100) / 100) : '') : cell;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows: (string | number)[][]) => rows.map((row) => row.map(escapeCell).join(',')).join('\n');

export const downloadCsv = (filename: string, rows: (string | number)[][]) => {
  // BOM so Excel opens non-ASCII headers (e.g. Korean) correctly.
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
