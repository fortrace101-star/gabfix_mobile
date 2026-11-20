import { paymentMethodLabel } from '@/lib/booking-policy';
import { price } from '@/lib/pricing';
import type { SavedBooking } from '@/store/bookings';
import { ugx } from '@/utils/format';

const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** "6 Oct 2026" for a booking date, or a placeholder while the date is unconfirmed. */
export const receiptDateLabel = (iso?: string): string =>
  iso
    ? parseISODate(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Date to confirm';

export const receiptIssuedLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const paymentKind = (plan?: string): string => {
  if (plan === 'full_now') return 'Full payment';
  if (plan === 'deposit') return 'Deposit';
  if (plan === 'after_service') return 'Payment after service';
  return 'Payment';
};

export type ReceiptLine = { label: string; value: string };

export type ReceiptModel = {
  id: string;
  status: BookingStatusLabel;
  issued: string;
  serviceDate: string;
  address: string;
  lines: ReceiptLine[];
  total: number;
  paid: number;
  balance: number;
  method: string;
  paymentKind: string;
  lateFee?: number;
  refundAmount?: number;
  tip?: number;
};

export type BookingStatusLabel = 'Confirmed' | 'Completed' | 'Cancelled';

export const receiptStatusLabel = (booking: SavedBooking): BookingStatusLabel => {
  if (booking.status === 'cancelled') return 'Cancelled';
  if (booking.status === 'completed') return 'Completed';
  return 'Confirmed';
};

/**
 * The single receipt model behind both the P19 screen and its PDF, so the printed
 * document always matches the itemised charges on screen.
 */
export function receiptModel(booking: SavedBooking): ReceiptModel {
  const source = booking.rebook;
  const quote = source ? price(source) : null;
  const total = quote?.total ?? booking.total;

  const lines: ReceiptLine[] = quote
    ? [
        {
          label: `${booking.serviceName} (${booking.hours} h × ${booking.cleaners} cleaner${
            booking.cleaners === 1 ? '' : 's'
          })`,
          value: ugx(quote.base),
        },
        ...(quote.materials > 0 ? [{ label: 'Materials', value: ugx(quote.materials) }] : []),
        ...(quote.addOns > 0 ? [{ label: 'Extras', value: ugx(quote.addOns) }] : []),
        ...(quote.frequencyDiscount > 0
          ? [{ label: 'Frequency discount', value: `−${ugx(quote.frequencyDiscount)}` }]
          : []),
        ...(quote.promoDiscount > 0
          ? [
              {
                label: `Promo${source?.promoCode ? ` (${source.promoCode})` : ''}`,
                value: `−${ugx(quote.promoDiscount)}`,
              },
            ]
          : []),
        { label: 'VAT (18%)', value: ugx(quote.vat) },
      ]
    : [{ label: booking.serviceName, value: ugx(booking.total) }];

  return {
    id: booking.id,
    status: receiptStatusLabel(booking),
    issued: receiptIssuedLabel(booking.createdAtISO),
    serviceDate: receiptDateLabel(booking.dateISO),
    address: [booking.area, booking.street].filter(Boolean).join(', ') || 'To confirm',
    lines,
    total,
    paid: booking.paid,
    balance: booking.balance,
    method: paymentMethodLabel(booking.paymentMethod),
    paymentKind: paymentKind(booking.paymentPlan),
    lateFee: booking.lateFee,
    refundAmount: booking.refundAmount,
    tip: booking.tip?.amount,
  };
}

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Self-contained printable receipt. Inline CSS keeps it intact in a PDF renderer. */
export function receiptHtml(booking: SavedBooking): string {
  const receipt = receiptModel(booking);
  const rows = receipt.lines
    .map(
      (line) =>
        `<tr><td>${escapeHtml(line.label)}</td><td class="amount">${escapeHtml(line.value)}</td></tr>`,
    )
    .join('');

  const payments =
    receipt.paid > 0
      ? `<div class="payment">
           <div>
             <strong>${escapeHtml(receipt.paymentKind)}</strong>
             <span>${escapeHtml(receipt.method)} · ${escapeHtml(receipt.issued)}</span>
             <span>Reference ${escapeHtml(receipt.id)}</span>
           </div>
           <strong>${escapeHtml(ugx(receipt.paid))}</strong>
         </div>`
      : '<p class="muted">No payment has been collected for this booking yet.</p>';

  const adjustments = [
    receipt.lateFee ? `<tr><td>Late cancellation fee</td><td class="amount">${escapeHtml(ugx(receipt.lateFee))}</td></tr>` : '',
    receipt.refundAmount
      ? `<tr><td>Refunded</td><td class="amount credit">−${escapeHtml(ugx(receipt.refundAmount))}</td></tr>`
      : '',
  ].join('');

  const tip = receipt.tip
    ? `<tr><td>Digital tip</td><td class="amount">${escapeHtml(ugx(receipt.tip))}</td></tr>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Gabfix receipt ${escapeHtml(receipt.id)}</title>
<style>
  @page { margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #16221A; background: #ffffff; }
  .brand { display: flex; align-items: center; gap: 12px; padding-bottom: 18px; border-bottom: 2px solid #118E45; }
  .mark { width: 44px; height: 44px; border-radius: 14px; background: #118E45; color: #ffffff; font-weight: 700; font-size: 22px; display: flex; align-items: center; justify-content: center; }
  .brand h1 { margin: 0; font-size: 20px; letter-spacing: -0.01em; }
  .brand p { margin: 2px 0 0; font-size: 12px; color: #5F6F65; }
  .status { margin-left: auto; font-size: 11px; font-weight: 700; padding: 6px 10px; border-radius: 999px; background: #E8F6EE; color: #1A5E2F; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #5F6F65; margin: 24px 0 8px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
  .meta span { display: block; font-size: 11px; color: #5F6F65; margin-bottom: 2px; }
  .meta strong { font-size: 13px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 0; font-size: 13px; vertical-align: top; border-bottom: 1px solid #DDE5DF; }
  td.amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .credit { color: #1A5E2F; }
  .total { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; padding-top: 10px; }
  .payment { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid #DDE5DF; font-size: 13px; }
  .payment span { display: block; font-size: 11px; color: #5F6F65; margin-top: 3px; }
  .summary div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .summary .grand { font-size: 15px; font-weight: 700; border-top: 1px solid #DDE5DF; margin-top: 4px; padding-top: 10px; }
  .muted { font-size: 13px; color: #5F6F65; }
  footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #DDE5DF; font-size: 11px; line-height: 1.6; color: #5F6F65; }
</style>
</head>
<body>
  <header class="brand">
    <div class="mark">G</div>
    <div>
      <h1>Gabfix Home Solutions</h1>
      <p>Receipt for home cleaning</p>
    </div>
    <div class="status">${escapeHtml(receipt.status)}</div>
  </header>

  <h2>Receipt</h2>
  <div class="meta">
    <div><span>Receipt</span><strong>${escapeHtml(receipt.id)}</strong></div>
    <div><span>Issued</span><strong>${escapeHtml(receipt.issued)}</strong></div>
    <div><span>Service date</span><strong>${escapeHtml(receipt.serviceDate)}</strong></div>
    <div><span>Address</span><strong>${escapeHtml(receipt.address)}</strong></div>
  </div>

  <h2>Charges</h2>
  <table>${rows}</table>
  <div class="total"><span>Total</span><span>${escapeHtml(ugx(receipt.total))}</span></div>

  <h2>Payments</h2>
  ${payments}
  ${adjustments ? `<table>${adjustments}</table>` : ''}
  ${tip ? `<table>${tip}</table>` : ''}

  <div class="summary">
    <div><span>Total paid</span><strong>${escapeHtml(ugx(receipt.paid))}</strong></div>
    <div class="grand"><span>${receipt.balance > 0 ? 'Outstanding' : 'Outstanding balance'}</span><span>${escapeHtml(ugx(receipt.balance))}</span></div>
  </div>

  <footer>
    This receipt reflects booking ${escapeHtml(receipt.id)} as recorded on the customer's account.
    Questions? Contact Gabfix support from the app or reply to your booking confirmation.
  </footer>
</body>
</html>`;
}
