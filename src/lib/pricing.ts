import { hourlyRate, pricing, type Frequency } from '@/config/pricing';

/** Booking model from Gabfix_App_Ui_2.md, Section 3.5. Persisted by `src/store/booking.ts`. */
export type BookingFrequency = Frequency;

export type BookingDetails = {
  cleaners: number;
  hours: number;
  frequency: BookingFrequency;
  materials: boolean;
  instructions?: string;
};

export type PaymentPlan = 'full_now' | 'deposit' | 'after_service';
export type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'visa_card' | 'cash';

export type BookingPayment = {
  plan: PaymentPlan;
  /** Method for the amount due at booking. Never cash. */
  method?: PaymentMethod;
  /** Method for the balance collected after the service. Any method, including cash. */
  balanceMethod: PaymentMethod;
  payerPhone?: string;
  depositAmount?: number;
  savedCardId?: string;
};

export type BookingLocation = {
  addressId?: string;
  area: string;
  street: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  propertyType: 'apartment' | 'house' | 'office';
  access?: string;
  contactName: string;
  contactPhone: string;
  /** Set when someone else will let the cleaner in (P11). */
  alternateContactName?: string;
  alternateContactPhone?: string;
};

export type BookingDraft = {
  serviceSlug: string;
  details: BookingDetails;
  addOns: string[];
  schedule?: { dateISO: string; startTime: string; repeatUntil?: string };
  location?: BookingLocation;
  promoCode?: string;
  payment?: BookingPayment;
};

export type PriceBreakdown = {
  base: number;
  materials: number;
  addOns: number;
  frequencyDiscount: number;
  promoDiscount: number;
  vat: number;
  total: number;
  minutes: number;
};

export type PriceableDraft = Pick<BookingDraft, 'details' | 'addOns' | 'promoCode'>;

const addOnPrices: Record<string, { price: number } | undefined> = pricing.addOns;
const promoRates: Record<string, { rate: number } | undefined> = pricing.promos;

/** Unknown ids are not priced; the UI only offers ids from the catalogue. */
export const addOnPrice = (id: string): number => addOnPrices[id]?.price ?? 0;

const frequencyRate = (frequency: BookingFrequency): number =>
  pricing.frequencyDiscounts[frequency] ?? 0;

const promoRate = (code?: string): number => {
  if (!code) return 0;
  return promoRates[code.trim().toUpperCase()]?.rate ?? 0;
};

/**
 * Live preview of the booking total (Gabfix_App_Ui_2.md, Section 3.6).
 * VAT is charged on the discounted subtotal; the server remains the source of truth.
 */
export function price(draft: PriceableDraft): PriceBreakdown {
  const { cleaners, hours, frequency, materials } = draft.details;
  const base = hourlyRate(hours) * hours * cleaners;
  const materialsCost = materials ? pricing.materialsPerHour * hours * cleaners : 0;
  const addOns = draft.addOns.reduce((sum, id) => sum + addOnPrice(id), 0);
  const frequencyDiscount = Math.round((base + materialsCost) * frequencyRate(frequency));
  const subtotal = base + materialsCost + addOns - frequencyDiscount;
  const promoDiscount = Math.round(subtotal * promoRate(draft.promoCode));
  const taxable = subtotal - promoDiscount;
  const vat = Math.round(taxable * pricing.vatRate);

  return {
    base,
    materials: materialsCost,
    addOns,
    frequencyDiscount,
    promoDiscount,
    vat,
    total: taxable + vat,
    minutes: hours * 60 + draft.addOns.length * pricing.addOnMinutes,
  };
}

export const emptyDraft = (serviceSlug: string): BookingDraft => ({
  serviceSlug,
  details: {
    cleaners: 1,
    hours: pricing.popularHours,
    frequency: 'once',
    materials: false,
  },
  addOns: [],
});
