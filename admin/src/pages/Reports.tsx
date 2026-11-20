import { useMemo, useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { Button, KpiCard, PageHeader, SectionCard, StatusChip } from '../components/ui';
import { bookingsByArea, revenueSeries } from '../data';
import { compactUgx, downloadCsv, ugx } from '../lib/format';
import type {
  Booking,
  CashCollection,
  Cleaner,
  Customer,
  Payment,
} from '../types';

type ReportKey = 'revenue' | 'bookings' | 'payments' | 'cash' | 'customers' | 'cleaners';

const reportMeta: { key: ReportKey; title: string; detail: string; icon: IconName }[] = [
  {
    key: 'revenue',
    title: 'Revenue by day',
    detail: 'Daily gross revenue, bookings and average order value.',
    icon: 'reports',
  },
  {
    key: 'bookings',
    title: 'Bookings register',
    detail: 'Every booking with cleaner, status, payment state and totals.',
    icon: 'bookings',
  },
  {
    key: 'payments',
    title: 'Payments ledger',
    detail: 'Deposits, balances, refunds and failed transactions.',
    icon: 'payments',
  },
  {
    key: 'cash',
    title: 'Cash collections',
    detail: 'Per-cleaner cash confirmations and remittance status.',
    icon: 'cash',
  },
  {
    key: 'customers',
    title: 'Customer accounts',
    detail: 'Contact details, segment, lifetime spend and activity.',
    icon: 'customers',
  },
  {
    key: 'cleaners',
    title: 'Cleaner roster',
    detail: 'Verification, availability, ratings and cash due.',
    icon: 'cleaners',
  },
];

export function ReportsPage({
  bookings,
  payments,
  cash,
  customers,
  cleaners,
  notify,
}: {
  bookings: Booking[];
  payments: Payment[];
  cash: CashCollection[];
  customers: Customer[];
  cleaners: Cleaner[];
  notify: (message: string) => void;
}) {
  const [range, setRange] = useState('Last 7 days');
  const revenue = revenueSeries.reduce((sum, point) => sum + point.value, 0);
  const completed = bookings.filter((booking) => booking.status === 'Completed').length;
  const completionRate = Math.round((completed / bookings.length) * 100);
  const averageOrder = bookings.length
    ? Math.round(bookings.reduce((sum, booking) => sum + booking.total, 0) / bookings.length)
    : 0;

  const rowsFor = (key: ReportKey): (string | number)[][] => {
    switch (key) {
      case 'revenue':
        return [
          ['Date', 'Revenue UGX', 'Bookings', 'Average order UGX'],
          ...revenueSeries.map((point) => [
            point.label,
            point.value,
            Math.round(point.value / averageOrder),
            averageOrder,
          ]),
        ];
      case 'bookings':
        return [
          ['Booking', 'Customer', 'Service', 'Area', 'Date', 'Status', 'Payment', 'Total UGX', 'Paid UGX'],
          ...bookings.map((booking) => [
            booking.id,
            booking.customer,
            booking.service,
            booking.area,
            booking.dateISO,
            booking.status,
            booking.payment,
            booking.total,
            booking.paid,
          ]),
        ];
      case 'payments':
        return [
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
        ];
      case 'cash':
        return [
          ['Reference', 'Cleaner', 'Period', 'Confirmed', 'Amount due UGX', 'Remitted'],
          ...cash.map((entry) => [
            entry.id,
            entry.cleaner,
            entry.period,
            entry.confirmedOn,
            entry.amountDue,
            entry.remitted ? 'Yes' : 'No',
          ]),
        ];
      case 'customers':
        return [
          ['Customer', 'Phone', 'Email', 'Area', 'Segment', 'Bookings', 'Spend UGX', 'Status'],
          ...customers.map((customer) => [
            customer.name,
            customer.phone,
            customer.email,
            customer.area,
            customer.segment,
            customer.bookings,
            customer.spend,
            customer.status,
          ]),
        ];
      case 'cleaners':
        return [
          ['Cleaner', 'Phone', 'Area', 'Rating', 'Jobs', 'Verified', 'Available', 'Cash due UGX'],
          ...cleaners.map((cleaner) => [
            cleaner.name,
            cleaner.phone,
            cleaner.area,
            cleaner.rating,
            cleaner.jobs,
            cleaner.verified ? 'Yes' : 'No',
            cleaner.available ? 'Yes' : 'No',
            cleaner.cashDue,
          ]),
        ];
    }
  };

  const exportReport = (key: ReportKey) => {
    const meta = reportMeta.find((report) => report.key === key);
    const rows = rowsFor(key);
    downloadCsv(`gabfix-${key}-2026-11-20.csv`, rows);
    notify(`${meta?.title ?? 'Report'} exported · ${rows.length - 1} rows.`);
  };

  const areaMax = useMemo(() => Math.max(...bookingsByArea.map((item) => item.count)), []);
  const statusGroups = useMemo(() => {
    const order = ['Pending', 'Confirmed', 'In progress', 'Completed', 'Cancelled'] as const;
    return order.map((status) => ({
      status,
      count: bookings.filter((booking) => booking.status === status).length,
    }));
  }, [bookings]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Reporting"
        title="Reports"
        subtitle="A clean CSV for finance, operations or the Monday review. No spreadsheet archaeology."
        actions={
          <>
            <label className="select-field">
              <span className="sr-only">Report range</span>
              <select value={range} onChange={(event) => setRange(event.target.value)}>
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </label>
            <Button
              variant="primary"
              icon="download"
              onClick={() => {
                (['revenue', 'bookings', 'payments', 'cash', 'customers', 'cleaners'] as ReportKey[])
                  .forEach((key, index) => {
                    window.setTimeout(() => exportReport(key), index * 250);
                  });
              }}
            >
              Export all six
            </Button>
          </>
        }
      />

      <div className="kpis">
        <KpiCard
          label="Gross revenue"
          value={compactUgx(revenue)}
          detail="Including VAT · selected range"
          trend="up"
          trendLabel="12.4%"
          icon="reports"
        />
        <KpiCard
          label="Bookings in range"
          value={String(bookings.length)}
          detail={`${completed} completed`}
          icon="bookings"
          tone="blue"
        />
        <KpiCard
          label="Completion rate"
          value={`${completionRate}%`}
          detail="Excludes cancelled jobs"
          trend="up"
          trendLabel="1.8%"
          icon="check"
          tone="yellow"
        />
        <KpiCard
          label="Average order"
          value={ugx(averageOrder)}
          detail="Across all sample bookings"
          icon="payments"
          tone="rose"
        />
      </div>

      <SectionCard
        title="Report catalogue"
        meta={`${range} · CSV downloads include a header row`}
      >
        <div className="report-grid">
          {reportMeta.map((report) => (
            <article className="report-card" key={report.key}>
              <span className="report-icon"><Icon name={report.icon} size={20} /></span>
              <div>
                <h3>{report.title}</h3>
                <p>{report.detail}</p>
                <small>{rowsFor(report.key).length - 1} rows</small>
              </div>
              <Button className="btn-small" icon="download" onClick={() => exportReport(report.key)}>
                CSV
              </Button>
            </article>
          ))}
        </div>
      </SectionCard>

      <div className="reports-bottom">
        <SectionCard title="Bookings by status" meta="Current local register">
          <div className="status-breakdown">
            {statusGroups.map((group) => (
              <div className="status-row" key={group.status}>
                <StatusChip label={group.status} />
                <div className="status-track" aria-hidden="true">
                  <span style={{ width: `${(group.count / bookings.length) * 100}%` }} />
                </div>
                <strong>{group.count}</strong>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Demand by area" meta="This week’s bookings">
          <div className="area-bars compact-bars">
            {bookingsByArea.map((item) => (
              <div className="area-row" key={item.area}>
                <span className="area-name">{item.area}</span>
                <div className="area-track" aria-hidden="true">
                  <span style={{ width: `${(item.count / areaMax) * 100}%` }} />
                </div>
                <span className="area-count">{item.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="info-panel">
        <span className="info-icon"><Icon name="external" size={18} /></span>
        <div>
          <strong>These exports describe the local operations sample.</strong>
          <p>
            The files are built in the browser from the same rows shown in the dashboard. Connect
            the bookings, payments and cash APIs before using them for statutory reporting.
          </p>
        </div>
      </div>
    </div>
  );
}
