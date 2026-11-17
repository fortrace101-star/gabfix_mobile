/**
 * Dummy pricing values from Gabfix_App_Ui_1.md, Section 15.12.
 * Replace with Gabfix finance values; the UI must never hard-code a price.
 */
export const pricing = {
  currency: 'UGX',
  vatRate: 0.18,
  materialsPerHour: 3_000,
  /** Rate per cleaner per hour, by booking length. Longer bookings cost less per hour. */
  hourlyRates: [
    { minHours: 8, rate: 10_000 },
    { minHours: 4, rate: 10_000 },
    { minHours: 3, rate: 11_000 },
    { minHours: 2, rate: 12_000 },
  ],
  frequencyDiscounts: {
    once: 0,
    weekly: 0.1,
    severalPerWeek: 0.15,
    monthly: 0.05,
  },
  minimumHours: 2,
  maximumHours: 8,
  popularHours: 4,
  /** Minutes added by each extra on the add-ons page. */
  addOnMinutes: 30,
} as const;

export type Frequency = keyof typeof pricing.frequencyDiscounts;

export const hourlyRate = (hours: number): number => {
  const match = pricing.hourlyRates.find((tier) => hours >= tier.minHours);
  return match ? match.rate : pricing.hourlyRates[pricing.hourlyRates.length - 1].rate;
};

export const VAT_RATE = pricing.vatRate;
