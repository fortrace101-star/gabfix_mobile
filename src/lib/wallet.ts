import type { SavedBooking } from '@/store/bookings';

export type TransactionKind = 'deposit' | 'balance' | 'cash' | 'refund';

export type WalletTransaction = {
  id: string;
  bookingId: string;
  kind: TransactionKind;
  title: string;
  atISO: string;
  /** Payment method used, when known. */
  method?: string;
  amount: number;
  direction: 'in' | 'out';
  cashConfirmed?: boolean;
};

/** Bookings that still owe a balance after the deposit or full payment. */
export function balanceDueBookings(bookings: SavedBooking[]): SavedBooking[] {
  return bookings
    .filter((booking) => booking.status !== 'cancelled' && booking.balance > 0)
    .sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO));
}

export function totalBalanceDue(bookings: SavedBooking[]): number {
  return balanceDueBookings(bookings).reduce((sum, booking) => sum + booking.balance, 0);
}

/**
 * Late fees charged to the account: cancelled cash bookings where nothing was
 * paid in-app, so there was no refund to deduct the fee from.
 */
export function accountBalanceBookings(bookings: SavedBooking[]): SavedBooking[] {
  return bookings.filter(
    (booking) =>
      booking.status === 'cancelled' &&
      booking.paid <= 0 &&
      (booking.lateFee ?? 0) > 0 &&
      !booking.lateFeeSettledAtISO,
  );
}

export function totalAccountBalance(bookings: SavedBooking[]): number {
  return accountBalanceBookings(bookings).reduce(
    (sum, booking) => sum + (booking.lateFee ?? 0),
    0,
  );
}

const kindForPlan = (plan?: string): TransactionKind =>
  plan === 'deposit' ? 'deposit' : 'balance';

const titleForPlan = (booking: SavedBooking, kind: TransactionKind): string =>
  kind === 'deposit'
    ? `Deposit · ${booking.serviceName}`
    : kind === 'cash'
      ? `Cash · ${booking.serviceName}`
      : booking.paymentPlan === 'full_now'
        ? `Payment · ${booking.serviceName}`
        : `Balance · ${booking.serviceName}`;

/**
 * Builds the wallet ledger from the local booking records. There is no payments
 * API, so every row is a projection of a booking's paid, refund and late-fee
 * fields rather than a separate transaction store.
 */
export function walletTransactions(bookings: SavedBooking[]): WalletTransaction[] {
  const transactions: WalletTransaction[] = [];

  bookings.forEach((booking) => {
    const initial = Math.max((booking.paid ?? 0) - (booking.balancePayment?.amount ?? 0), 0);
    if (initial > 0) {
      const kind = booking.paymentMethod === 'cash' ? 'cash' : kindForPlan(booking.paymentPlan);
      transactions.push({
        id: `${booking.id}-initial`,
        bookingId: booking.id,
        kind,
        title: titleForPlan(booking, kind),
        atISO: booking.createdAtISO,
        method: booking.paymentMethod,
        amount: initial,
        direction: 'out',
        cashConfirmed: kind === 'cash',
      });
    }

    if (booking.balancePayment && booking.balancePayment.amount > 0) {
      transactions.push({
        id: `${booking.id}-balance`,
        bookingId: booking.id,
        kind: 'balance',
        title: `Balance · ${booking.serviceName}`,
        atISO: booking.balancePayment.atISO,
        method: booking.balancePayment.method,
        amount: booking.balancePayment.amount,
        direction: 'out',
      });
    }

    if ((booking.refundAmount ?? 0) > 0) {
      transactions.push({
        id: `${booking.id}-refund`,
        bookingId: booking.id,
        kind: 'refund',
        title: `Refund · ${booking.serviceName}`,
        atISO: booking.cancelledAtISO ?? booking.createdAtISO,
        method: booking.paymentMethod,
        amount: booking.refundAmount ?? 0,
        direction: 'in',
      });
    }

    if (booking.lateFeeSettledAtISO && (booking.lateFee ?? 0) > 0) {
      transactions.push({
        id: `${booking.id}-late-fee`,
        bookingId: booking.id,
        kind: 'balance',
        title: `Late fee · ${booking.serviceName}`,
        atISO: booking.lateFeeSettledAtISO,
        method: booking.lateFeePaidMethod,
        amount: booking.lateFee ?? 0,
        direction: 'out',
      });
    }
  });

  return transactions.sort((a, b) => b.atISO.localeCompare(a.atISO));
}

export type TransactionFilter = 'all' | 'deposits' | 'balances' | 'cash' | 'refunds';

export const transactionFilters: { id: TransactionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'deposits', label: 'Deposits' },
  { id: 'balances', label: 'Balances' },
  { id: 'cash', label: 'Cash' },
  { id: 'refunds', label: 'Refunds' },
];

export const filterTransactions = (
  transactions: WalletTransaction[],
  filter: TransactionFilter,
): WalletTransaction[] => {
  if (filter === 'all') return transactions;
  if (filter === 'deposits') return transactions.filter((item) => item.kind === 'deposit');
  if (filter === 'balances') return transactions.filter((item) => item.kind === 'balance');
  if (filter === 'cash') return transactions.filter((item) => item.kind === 'cash');
  return transactions.filter((item) => item.kind === 'refund');
};
