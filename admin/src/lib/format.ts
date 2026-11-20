export const ugx = (value: number): string =>
  `UGX ${Math.round(value).toLocaleString('en-UG')}`;

export const compactUgx = (value: number): string => {
  if (value >= 1_000_000) return `UGX ${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `UGX ${Math.round(value / 1_000)}k`;
  return `UGX ${value}`;
};

export const formatDate = (iso: string): string => {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatShortDate = (iso: string): string => {
  if (iso === '2026-11-20') return 'Today';
  if (iso === '2026-11-21') return 'Tomorrow';
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

export const initials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const cx = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

export const todayIso = (): string => '2026-11-20';

export const downloadCsv = (filename: string, rows: (string | number)[][]): void => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell);
          return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
