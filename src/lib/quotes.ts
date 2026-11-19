import type { BookingFrequency } from '@/lib/pricing';
import type { QuotePropertyType, QuoteSize, QuoteStatus } from '@/store/quotes';

const FREQUENCY_LABELS: Record<BookingFrequency, string> = {
  once: 'One time',
  weekly: 'Every week',
  severalPerWeek: 'Twice a week',
  monthly: 'Every month',
};

export const QUOTE_PROPERTY_OPTIONS: { value: QuotePropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'office', label: 'Office' },
  { value: 'shop', label: 'Shop' },
  { value: 'institution', label: 'School / clinic' },
];

export const QUOTE_SIZE_OPTIONS: {
  value: QuoteSize;
  label: string;
  subtitle: string;
}[] = [
  { value: 'small', label: 'Small', subtitle: 'Up to 50 m²' },
  { value: 'medium', label: 'Medium', subtitle: '50–150 m²' },
  { value: 'large', label: 'Large', subtitle: '150 m² or more' },
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: 'Awaiting quote',
  quoted: 'Quote ready',
  accepted: 'Accepted',
  declined: 'Closed',
};

export const quotePropertyLabel = (value: QuotePropertyType): string =>
  QUOTE_PROPERTY_OPTIONS.find((option) => option.value === value)?.label ?? value;

export const quoteSizeLabel = (value: QuoteSize): string =>
  QUOTE_SIZE_OPTIONS.find((option) => option.value === value)?.label ?? value;

export const quoteFrequencyLabel = (value: BookingFrequency): string =>
  FREQUENCY_LABELS[value];
