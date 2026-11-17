const withThousands = (value: string): string =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** UGX 45,000 — no decimals, thousands separator (Part 1, Section 3). */
export const ugx = (amount: number): string => {
  const rounded = Math.round(amount);
  const formatted =
    typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function'
      ? new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(rounded)
      : withThousands(String(rounded));
  return `UGX ${formatted}`;
};

/** 7XX XXX XXX -> +256 7XX XXX XXX */
export const phoneUG = (digits: string): string => {
  const clean = digits.replace(/\D/g, '').replace(/^256/, '').replace(/^0/, '');
  return `+256 ${clean.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`.trim();
};

/** +256 7•• ••• 482 — used on the OTP and reset screens. */
export const maskPhone = (digits: string): string => {
  const clean = digits.replace(/\D/g, '').replace(/^256/, '').replace(/^0/, '');
  if (clean.length < 9) return phoneUG(clean);
  return `+256 ${clean.slice(0, 3)} ••• ${clean.slice(6, 7)}${clean.slice(7)}`;
};

export const dateLong = (date: Date): string =>
  date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Kampala',
  });

export const time12 = (date: Date): string =>
  date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Kampala',
    })
    .toLowerCase();

export const hoursLabel = (hours: number): string =>
  `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;

export const titleCase = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);
