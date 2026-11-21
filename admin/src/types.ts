export type PageId =
  | 'overview'
  | 'bookings'
  | 'payments'
  | 'cash'
  | 'customers'
  | 'cleaners'
  | 'services'
  | 'promos'
  | 'reports'
  | 'settings';

export type BookingStatus = 'Pending' | 'Confirmed' | 'In progress' | 'Completed' | 'Cancelled';

export type PaymentState = 'Paid' | 'Deposit paid' | 'Balance due' | 'Refunded' | 'Failed';

export type BookingScopeFact = {
  label: string;
  value: string;
};

export type BookingMedia = {
  id: string;
  kind: 'image' | 'video';
  url?: string;
  label?: string;
  durationSec?: number;
};

export type Booking = {
  id: string;
  customerId: string;
  customer: string;
  phone: string;
  service: string;
  area: string;
  dateISO: string;
  time: string;
  hours: number;
  cleanerId?: string;
  status: BookingStatus;
  payment: PaymentState;
  total: number;
  paid: number;
  scope?: {
    summary: string;
    facts?: BookingScopeFact[];
  };
  media?: BookingMedia[];
};

export type Cleaner = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  area: string;
  rating: number;
  jobs: number;
  verified: boolean;
  available: boolean;
  languages: string;
  tone: string;
  cashDue: number;
  cashConfirmedOn?: string;
  cashRemitted: boolean;
  cashDispute?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  segment: 'Residential' | 'Office';
  bookings: number;
  spend: number;
  lastBooking: string;
  status: 'Active' | 'New' | 'At risk';
};

export type Payment = {
  id: string;
  bookingId: string;
  customer: string;
  kind: 'Deposit' | 'Balance' | 'Refund' | 'Failed payment';
  method: 'MTN MoMo' | 'Airtel Money' | 'Visa card' | 'Cash';
  amount: number;
  status: 'Received' | 'Pending' | 'Refunded' | 'Failed' | 'Reconciled';
  dateISO: string;
};

export type CashCollection = {
  id: string;
  cleanerId: string;
  cleaner: string;
  period: string;
  confirmedOn: string;
  amountDue: number;
  remitted: boolean;
  dispute?: string;
};

export type Promo = {
  id: string;
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  uses: number;
  limit: number;
  expires: string;
  active: boolean;
};

export type RateTier = { minHours: number; rate: number };

export type RateCard = {
  hourlyRates: RateTier[];
  materialsPerHour: number;
  vatRate: number;
  minimumHours: number;
  maximumHours: number;
  addOnMinutes: number;
  frequencyDiscounts: Record<string, number>;
  addOns: Record<string, number>;
};

export type OperationsSettings = {
  supportPhone: string;
  supportWhatsapp: string;
  supportEmail: string;
  supportHours: string;
  cashReminderHours: number;
  autoAssign: boolean;
  notifyUnassigned: boolean;
  notifyFailedPayment: boolean;
};
