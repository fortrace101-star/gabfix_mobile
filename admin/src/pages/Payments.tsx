import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import {
  Button,
  EmptyState,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusChip,
} from '../components/ui';
import { downloadCsv, formatDate, ugx } from '../lib/format';
import type { Booking, Payment } from '../types';

type PaymentTab = 'All' | 'Deposits' | 'Balances' | 'Refunds' | 'Failed';

const tabs: PaymentTab[] = ['All', 'Deposits', 'Balances', 'Refunds', 'Failed'];

export function PaymentsPage({
  payments,
  bookings,
  onRetry,
  onReconcile,
  notify,
}: {
  payments: Payment[];
  bookings: Booking[];
  onRetry: (id: string) => void;
  onReconcile: (id: string) => void;
  notify: (message: string) => void;
}) {
  const [tab, setTab] = useState<PaymentTab>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesTab =
        tab === 'All' ||
        (tab === 'Deposits' && payment.kind === 'Deposit') ||
        (tab === 'Balances' && payment.kind === 'Balance') ||
        (tab === 'Refunds' && payment.kind === 'Refund') ||
        (tab === 'Failed' && payment.kind === 'Failed payment');
      const matchesQuery =
        !term ||
        [payment.id, payment.bookingId, payment.customer, payment.method]
          .join(' ')
          .toLowerCase()
          .includes(term);
      return matchesTab && matchesQuery;
    });
  }, [payments, query, tab]);

  const balances = bookings.filter((booking) => booking.total > booking.paid);
  const failedCount = payments.filter(
    (payment) => payment.kind === 'Failed payment' && payment.status === 'Failed',
  ).length;

  const exportRows = () => {
    downloadCsv('gabfix-payments-2026-11-20.csv', [
      ['Payment', 'Booking', 'Customer', 'Type', 'Method', 'Amount UGX', 'Status', 'Date'],
      ...payments.map((payment) => [
        payment.id,
        payment.bookingId,
        payment.customer,
        payment.kind,
        payment.method,
        payment.amount,
        payment.status,
        payment.dateISO,
      ]),
    ]);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Money in"
        title="Payments"
        subtitle="Deposits, balances and the exceptions that stop a job from being settled."
        actions={
          <>
            <Button icon="download" onClick={exportRows}>
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon="refresh"
              onClick={() => {
                setTab('Failed');
                if (!failedCount) notify('No failed payments need attention.');
              }}
            >
              Review failed ({failedCount})
            </Button>
          </>
        }
      />

      <div className="kpis">
        <KpiCard
          label="Deposits received"
          value="UGX 8.42m"
          detail="Last 7 days · 68 transactions"
          trend="up"
          trendLabel="9.2%"
          icon="payments"
        />
        <KpiCard
          label="Balances outstanding"
          value="UGX 3.15m"
          detail={`${balances.length} open bookings`}
          trend="down"
          trendLabel="4.1%"
          icon="clock"
          tone="yellow"
        />
        <KpiCard
          label="Refunds"
          value="UGX 420k"
          detail="6 refunds · all settled"
          trend="down"
          trendLabel="2.0%"
          icon="refresh"
          tone="blue"
        />
        <KpiCard
          label="Failed payments"
          value={String(failedCount)}
          detail="Needs retry or reconciliation"
          icon="alert"
          tone="rose"
        />
      </div>

      <SectionCard>
        <div className="tab-row" role="tablist" aria-label="Payment views">
          {tabs.map((option) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === option}
              key={option}
              className={`tab${tab === option ? ' active' : ''}`}
              onClick={() => setTab(option)}
            >
              {option}
              {option === 'Failed' && failedCount ? <span>{failedCount}</span> : null}
            </button>
          ))}
          <label className="search-field tab-search">
            <Icon name="search" size={16} />
            <span className="sr-only">Search payments</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search payment or booking"
            />
          </label>
        </div>

        {tab === 'Balances' ? (
          balances.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Due date</th>
                    <th>Payment</th>
                    <th className="align-right">Balance</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {balances.map((booking) => (
                    <tr key={booking.id}>
                      <td className="nowrap"><strong>{booking.id}</strong></td>
                      <td>{booking.customer}</td>
                      <td>{booking.service}<small className="cell-sub">{booking.area}</small></td>
                      <td>{formatDate(booking.dateISO)}</td>
                      <td><StatusChip label={booking.payment} /></td>
                      <td className="align-right nowrap">{ugx(booking.total - booking.paid)}</td>
                      <td className="align-right">
                        <Button
                          className="btn-small"
                          icon="bell"
                          onClick={() => notify(`Payment link sent to ${booking.customer}.`)}
                        >
                          Send link
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No balances outstanding" detail="Every booking is fully settled." />
          )
        ) : filtered.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th className="align-right">Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => (
                  <tr key={payment.id}>
                    <td className="nowrap"><strong>{payment.id}</strong></td>
                    <td className="nowrap">{payment.bookingId}</td>
                    <td>{payment.customer}</td>
                    <td>{payment.kind}</td>
                    <td>{payment.method}</td>
                    <td className="align-right nowrap">{ugx(payment.amount)}</td>
                    <td>
                      <StatusChip
                        label={payment.status}
                        tone={payment.kind === 'Failed payment' ? 'danger' : undefined}
                      />
                    </td>
                    <td className="nowrap">{formatDate(payment.dateISO)}</td>
                    <td className="align-right">
                      {payment.kind === 'Failed payment' && payment.status === 'Failed' ? (
                        <div className="row-actions">
                          <Button className="btn-small" icon="refresh" onClick={() => onRetry(payment.id)}>
                            Retry
                          </Button>
                          <Button
                            className="btn-small"
                            variant="ghost"
                            icon="check"
                            onClick={() => onReconcile(payment.id)}
                          >
                            Reconcile
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="icon-btn small"
                          aria-label={`View ${payment.id}`}
                          onClick={() => notify(`${payment.id} · ${payment.method} · ${ugx(payment.amount)}`)}
                        >
                          <Icon name="external" size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No payments in this view"
            detail="Try another tab or clear the search."
            action={<Button onClick={() => { setTab('All'); setQuery(''); }}>Show all payments</Button>}
          />
        )}
      </SectionCard>

      <div className="info-panel">
        <span className="info-icon"><Icon name="alert" size={18} /></span>
        <div>
          <strong>Failed payments are retried at the provider, never charged twice.</strong>
          <p>
            Retry asks the aggregator to re-authorise the original transaction. Reconcile is for
            money confirmed in the provider portal but not reflected here. Both actions are
            simulated in this local operations build.
          </p>
        </div>
      </div>
    </div>
  );
}
