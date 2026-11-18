import { minimumDeposit, isValidDeposit, balanceAfterService } from '@/config/payments';
import { price, type BookingDraft, type PriceableDraft } from '@/lib/pricing';

const draft = (overrides: Partial<PriceableDraft> = {}): PriceableDraft => ({
  details: { cleaners: 1, hours: 4, frequency: 'once', materials: false },
  addOns: [],
  ...overrides,
});

const withDetails = (
  details: Partial<BookingDraft['details']>,
  overrides: Partial<PriceableDraft> = {},
): PriceableDraft => ({
  ...draft(overrides),
  details: { ...draft().details, ...details },
});

describe('price', () => {
  it('charges the hourly rate plus 18% VAT', () => {
    const result = price(draft());
    expect(result.base).toBe(40_000);
    expect(result.materials).toBe(0);
    expect(result.frequencyDiscount).toBe(0);
    expect(result.vat).toBe(7_200);
    expect(result.total).toBe(47_200);
    expect(result.minutes).toBe(240);
  });

  it('uses the cheaper tier for longer bookings and the premium tier for 2 hours', () => {
    expect(price(withDetails({ hours: 2 })).base).toBe(24_000);
    expect(price(withDetails({ hours: 3 })).base).toBe(33_000);
    expect(price(withDetails({ hours: 8 })).base).toBe(80_000);
  });

  it('multiplies by cleaners, adds materials per cleaner per hour and discounts labour plus materials', () => {
    const result = price(
      withDetails({ hours: 2, cleaners: 2, frequency: 'weekly', materials: true }, { addOns: ['laundry'] }),
    );
    expect(result.base).toBe(48_000);
    expect(result.materials).toBe(12_000);
    expect(result.addOns).toBe(10_000);
    expect(result.frequencyDiscount).toBe(6_000);
    expect(result.vat).toBe(11_520);
    expect(result.total).toBe(75_520);
  });

  it('prices known add-ons and adds 30 minutes for each one', () => {
    const result = price(draft({ addOns: ['inside_fridge', 'inside_oven'] }));
    expect(result.addOns).toBe(13_000);
    expect(result.minutes).toBe(240 + 2 * 30);
  });

  it('ignores unknown add-on ids instead of guessing a price', () => {
    expect(price(draft({ addOns: ['not_a_real_add_on'] })).addOns).toBe(0);
  });

  it('discounts the promo before charging VAT and ignores unknown codes', () => {
    const withPromo = price(withDetails({ hours: 8 }, { promoCode: 'welcome20' }));
    expect(withPromo.promoDiscount).toBe(16_000);
    expect(withPromo.vat).toBe(11_520);
    expect(withPromo.total).toBe(75_520);

    const unknown = price(withDetails({ hours: 8 }, { promoCode: 'FREESTUFF' }));
    expect(unknown.promoDiscount).toBe(0);
  });

  it('never returns fractional shillings', () => {
    const result = price(withDetails({ hours: 3, cleaners: 3, frequency: 'monthly', materials: true }, { promoCode: 'CLEAN10' }));
    for (const amount of [result.base, result.vat, result.total, result.frequencyDiscount, result.promoDiscount]) {
      expect(Number.isInteger(amount)).toBe(true);
    }
  });
});

describe('deposit rules', () => {
  it('takes 30% of the total when that is above the floor', () => {
    expect(minimumDeposit(100_000)).toBe(30_000);
  });

  it('never asks for less than UGX 20,000', () => {
    expect(minimumDeposit(40_000)).toBe(20_000);
    expect(minimumDeposit(0)).toBe(20_000);
  });

  it('accepts a deposit between the minimum and the amount leaving UGX 1,000 due', () => {
    expect(isValidDeposit(100_000, 29_999)).toBe(false);
    expect(isValidDeposit(100_000, 30_000)).toBe(true);
    expect(isValidDeposit(100_000, 99_000)).toBe(true);
    expect(isValidDeposit(100_000, 99_001)).toBe(false);
  });

  it('rejects a non-numeric deposit', () => {
    expect(isValidDeposit(100_000, Number.NaN)).toBe(false);
  });

  it('leaves the rest of the total for after the service', () => {
    expect(balanceAfterService(100_000, 30_000)).toBe(70_000);
    expect(balanceAfterService(100_000, 120_000)).toBe(0);
  });

  it('matches the price function output', () => {
    const total = price({ details: { cleaners: 2, hours: 3, frequency: 'once', materials: true }, addOns: ['balcony'] }).total;
    expect(minimumDeposit(total)).toBe(Math.ceil(Math.max(0.3 * total, 20_000)));
  });
});
