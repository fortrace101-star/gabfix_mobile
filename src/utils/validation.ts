/** Ugandan mobile number: 9 digits starting with 7 (Part 2, P2b). */
export const normalisePhone = (value: string): string =>
  value.replace(/\D/g, '').replace(/^256/, '').replace(/^0/, '');

export const isValidUGPhone = (value: string): boolean => /^7\d{8}$/.test(normalisePhone(value));

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export const isPhoneOrEmail = (value: string): boolean =>
  isValidUGPhone(value) || isValidEmail(value);

export const isStrongEnoughPassword = (value: string): boolean => value.length >= 8;

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong';
};

export const passwordStrength = (value: string): PasswordStrength => {
  if (value.length < 8) return { score: 0, label: 'Too short' };
  let score = 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  const capped = Math.min(score, 4) as 1 | 2 | 3 | 4;
  const labels = { 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' } as const;
  return { score: capped, label: labels[capped] };
};
