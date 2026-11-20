import { useState } from 'react';
import { AreaBars, RevenueChart } from '../components/charts';
import { AssignCleanerDialog } from '../components/AssignCleanerDialog';
import { Icon } from '../components/Icon';
import {
  Avatar,
  Button,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusChip,
} from '../components/ui';
import type { DateRange } from '../components/Topbar';
import {
  bookingsByArea,
  cashOlderThan,
  revenueSeries,
  TODAY,
} from '../data';
import { compactUgx, formatShortDate, ugx } from '../lib/format';
import type { Booking, CashCollection, Cleaner, PageId } from '../types';

export function Overview({
  bookings,
  cleaners,
  cash,
  dateRange,
  onNavigate,
  onAssign,
  notify,
}: {
  bookings: Booking[];
  cleaners: Cleaner[];
  cash: CashCollection[];
  dateRange: DateRange;
  onNavigate: (page: PageId) => void;
  onAssign: (bookingId: string, cleanerId: string) => void;
  notify: (message: string) => void;
}) {
  const [assigning, setAssigning] = useState<Booking | null>(null);
  const liveBookings = bookings.filter((booking) => booking.dateISO === TODAY);
  const unassigned = bookings.filter(
    (booking) =>
      !booking.cleanerId &&
      (booking.status === 'Pending' || booking.status === 'Confirmed') &&
      booking.dateISO >= TODAY,
  );
  const overdueBalances = bookings.filter(
    (booking) => booking.payment === 'Balance due' && booking.dateISO <= TODAY,
  );
  const unconfirmedCash = cash.filter(
    (entry) => !entry.remitted && cashOlderThan(entry.confirmedOn, 24),
  );
  const revenue = revenueSeries.reduce((sum, point) => sum + point.value, 0);
  const rangeLabel =
    dateRange === 'Today'
      ? '20 Nov 2026'
      : dateRange === 'Last 7 days'
        ? '14 – 20 Nov 2026'
        : '22 Oct – 20 Nov 2026';

  const cleanerFor = (booking: Booking) =>
    cleaners.find((cleaner) => cleaner.id === booking.cleanerId);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Friday, 20 November 2026"
        title="Operations overview"
        subtitle="The live picture across Kampala. Jobs, money and the queues that need a human."
        actions={
          <>
            <Button icon="reports" onClick={() => onNavigate('reports')}>
              Export report
            </Button>
            <Button variant="primary" icon="bookings" onClick={() => onNavigate('bookings')}>
              Open bookings
            </Button>
          </>
        }
      />

      <div className="overview-layout">
        <div className="overview-main">
          <div className="kpis">
            <KpiCard
              label="Revenue"
              value={compactUgx(revenue)}
              detail={`${rangeLabel} · incl. VAT`}
              trend="up"
              trendLabel="12.4%"
              icon="payments"
            />
            <KpiCard
              label="Bookings today"
              value="27"
              detail={`${liveBookings.length} in the live queue`}
              trend="up"
              trendLabel="8.0%"
              icon="bookings"
              tone="blue"
            />
            <KpiCard
              label="Active cleaners"
              value="34"
              detail="28 available · 6 on a job"
              trend="up"
              trendLabel="3"
              icon="cleaners"
              tone="yellow"
            />
            <KpiCard
              label="Average rating"
              value="4.8"
              detail="From 312 verified reviews"
              trend="up"
              trendLabel="0.1"
              icon="spark"
              tone="rose"
            />
          </div>

          <div className="chart-grid">
            <SectionCard
              title="Revenue"
              meta={`${rangeLabel} · UGX, VAT inclusive`}
              action={<span className="legend"><i /> Collected revenue</span>}
            >
              <RevenueChart data={revenueSeries} />
            </SectionCard>
            <SectionCard title="Bookings by area" meta="This week · 304 jobs">
              <AreaBars data={bookingsByArea} />
              <p className="insight">
                <Icon name="spark" size={14} />
                Kololo and Ntinda account for 53% of demand.
              </p>
            </SectionCard>
          </div>

          <SectionCard
            title="Live bookings"
            meta="Today’s schedule, newest first"
            action={
              <button type="button" className="text-btn" onClick={() => onNavigate('bookings')}>
                View all <Icon name="chevronRight" size={14} />
              </button>
            }
          >
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Service</th>
                    <th>Time</th>
                    <th>Cleaner</th>
                    <th>Status</th>
                    <th className="align-right">Total</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {liveBookings.map((booking) => {
                    const cleaner = cleanerFor(booking);
                    return (
                      <tr key={booking.id}>
                        <td>
                          <div className="cell-person">
                            <Avatar name={booking.customer} tone="#E8F6EE" size="sm" />
                            <span>
                              <strong>{booking.customer}</strong>
                              <small>{booking.id} · {booking.area}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="cell-main">{booking.service}</span>
                          <small className="cell-sub">{booking.hours} hours</small>
                        </td>
                        <td className="nowrap">{booking.time}</td>
                        <td>
                          {cleaner ? (
                            <span className="cleaner-inline">
                              <Avatar name={cleaner.name} tone={cleaner.tone} size="sm" />
                              {cleaner.name}
                            </span>
                          ) : (
                            <span className="unassigned">Needs cleaner</span>
                          )}
                        </td>
                        <td><StatusChip label={booking.status} /></td>
                        <td className="align-right nowrap">{ugx(booking.total)}</td>
                        <td className="align-right">
                          {!booking.cleanerId ? (
                            <button
                              type="button"
                              className="text-btn"
                              onClick={() => setAssigning(booking)}
                            >
                              Assign
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="icon-btn small"
                              aria-label={`Open ${booking.id}`}
                              onClick={() => onNavigate('bookings')}
                            >
                              <Icon name="chevronRight" size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <aside className="rail" aria-label="Action queue">
          <SectionCard
            title="Unassigned jobs"
            meta={`${unassigned.length} need a cleaner`}
            action={<span className="rail-count">{unassigned.length}</span>}
          >
            <div className="rail-list">
              {unassigned.map((booking) => (
                <div className="rail-item" key={booking.id}>
                  <div className="rail-item-top">
                    <span>
                      <strong>{booking.customer}</strong>
                      <small>{booking.id} · {booking.area}</small>
                    </span>
                    <StatusChip label={booking.status} />
                  </div>
                  <p>{booking.service} · {formatShortDate(booking.dateISO)}, {booking.time}</p>
                  <Button
                    className="btn-small"
                    icon="cleaners"
                    onClick={() => setAssigning(booking)}
                  >
                    Assign cleaner
                  </Button>
                </div>
              ))}
            </div>
            <button type="button" className="card-link" onClick={() => onNavigate('bookings')}>
              Manage all bookings <Icon name="chevronRight" size={14} />
            </button>
          </SectionCard>

          <SectionCard
            title="Balances overdue"
            meta={`${overdueBalances.length} customer${overdueBalances.length === 1 ? '' : 's'}`}
            action={<span className="rail-count danger">{overdueBalances.length}</span>}
          >
            {overdueBalances.map((booking) => (
              <div className="rail-item compact" key={booking.id}>
                <div className="rail-item-top">
                  <span>
                    <strong>{booking.customer}</strong>
                    <small>{booking.id} · due at service</small>
                  </span>
                  <strong className="money-danger">{ugx(booking.total - booking.paid)}</strong>
                </div>
                <Button
                  className="btn-small"
                  icon="bell"
                  onClick={() => notify(`Reminder queued for ${booking.customer}.`)}
                >
                  Send reminder
                </Button>
              </div>
            ))}
            {!overdueBalances.length ? <p className="rail-empty">No overdue balances.</p> : null}
          </SectionCard>

          <SectionCard
            title="Unconfirmed cash"
            meta="Older than 24 hours"
            action={<span className="rail-count danger">{unconfirmedCash.length}</span>}
          >
            {unconfirmedCash.map((entry) => (
              <div className="rail-item compact" key={entry.id}>
                <div className="rail-item-top">
                  <span>
                    <strong>{entry.cleaner}</strong>
                    <small>Confirmed {formatShortDate(entry.confirmedOn)}</small>
                  </span>
                  <strong>{ugx(entry.amountDue)}</strong>
                </div>
                <Button
                  className="btn-small"
                  icon="bell"
                  onClick={() => notify(`Cash reminder sent to ${entry.cleaner}.`)}
                >
                  Send reminder
                </Button>
              </div>
            ))}
            <button type="button" className="card-link" onClick={() => onNavigate('cash')}>
              Open cash collections <Icon name="chevronRight" size={14} />
            </button>
          </SectionCard>
        </aside>
      </div>

      {assigning ? (
        <AssignCleanerDialog
          key={assigning.id}
          booking={assigning}
          cleaners={cleaners}
          onClose={() => setAssigning(null)}
          onAssign={onAssign}
        />
      ) : null}
    </div>
  );
}
