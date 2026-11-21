import { useMemo, useState } from 'react';
import { AssignCleanerDialog } from '../components/AssignCleanerDialog';
import { Icon } from '../components/Icon';
import {
  Avatar,
  Button,
  EmptyState,
  PageHeader,
  SectionCard,
  StatusChip,
} from '../components/ui';
import { downloadCsv, formatShortDate, ugx } from '../lib/format';
import type { Booking, BookingStatus, Cleaner } from '../types';

const statuses: (BookingStatus | 'All statuses')[] = [
  'All statuses',
  'Pending',
  'Confirmed',
  'In progress',
  'Completed',
  'Cancelled',
];

export function BookingsPage({
  bookings,
  cleaners,
  onAssign,
}: {
  bookings: Booking[];
  cleaners: Cleaner[];
  onAssign: (bookingId: string, cleanerId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof statuses)[number]>('All statuses');
  const [dateFilter, setDateFilter] = useState('All dates');
  const [assigning, setAssigning] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesQuery =
        !term ||
        [booking.id, booking.customer, booking.service, booking.area, booking.phone]
          .join(' ')
          .toLowerCase()
          .includes(term);
      const matchesStatus = status === 'All statuses' || booking.status === status;
      const matchesDate =
        dateFilter === 'All dates' ||
        (dateFilter === 'Today' && booking.dateISO === '2026-11-20') ||
        (dateFilter === 'Tomorrow' && booking.dateISO === '2026-11-21') ||
        (dateFilter === 'This week' &&
          booking.dateISO >= '2026-11-16' &&
          booking.dateISO <= '2026-11-22');
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [bookings, dateFilter, query, status]);

  const totalValue = filtered.reduce((sum, booking) => sum + booking.total, 0);
  const needsCleaner = filtered.filter((booking) => !booking.cleanerId).length;

  const exportRows = () => {
    downloadCsv('gabfix-bookings-2026-11-20.csv', [
      ['Booking', 'Customer', 'Phone', 'Service', 'Location', 'Date', 'Time', 'Hours', 'Cleaner', 'Status', 'Payment', 'Total UGX', 'Paid UGX'],
      ...filtered.map((booking) => [
        booking.id,
        booking.customer,
        booking.phone,
        booking.service,
        booking.area,
        booking.dateISO,
        booking.time,
        booking.hours,
        cleaners.find((cleaner) => cleaner.id === booking.cleanerId)?.name ?? 'Unassigned',
        booking.status,
        booking.payment,
        booking.total,
        booking.paid,
      ]),
    ]);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Schedule"
        title="Bookings"
        subtitle="Confirm jobs, match cleaners and keep the day moving."
        actions={
          <>
            <Button icon="download" onClick={exportRows}>
              Export CSV
            </Button>
            <Button variant="primary" icon="filter" onClick={() => setStatus('Pending')}>
              Review pending
            </Button>
          </>
        }
      />

      <div className="stat-strip" aria-label="Booking summary">
        <div>
          <span>Matching bookings</span>
          <strong>{filtered.length}</strong>
        </div>
        <div>
          <span>Value in view</span>
          <strong>{ugx(totalValue)}</strong>
        </div>
        <div>
          <span>Needs a cleaner</span>
          <strong className={needsCleaner ? 'money-danger' : undefined}>{needsCleaner}</strong>
        </div>
        <div>
          <span>Completed today</span>
          <strong>{bookings.filter((booking) => booking.dateISO === '2026-11-20' && booking.status === 'Completed').length}</strong>
        </div>
      </div>

      <SectionCard>
        <div className="filter-bar">
          <label className="search-field">
            <Icon name="search" size={16} />
            <span className="sr-only">Search bookings</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ID, customer, phone or location"
            />
          </label>
          <label className="select-field">
            <span className="sr-only">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              {statuses.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="select-field">
            <span className="sr-only">Date</span>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
              <option>All dates</option>
              <option>Today</option>
              <option>Tomorrow</option>
              <option>This week</option>
            </select>
          </label>
          {(query || status !== 'All statuses' || dateFilter !== 'All dates') ? (
            <button
              type="button"
              className="text-btn clear-filters"
              onClick={() => {
                setQuery('');
                setStatus('All statuses');
                setDateFilter('All dates');
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {filtered.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Service</th>
                  <th>Date & time</th>
                  <th>Cleaner</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="align-right">Total</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => {
                  const cleaner = cleaners.find((item) => item.id === booking.cleanerId);
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
                        {booking.media?.length ? (
                          <small className="cell-sub media-indicator" title={`${booking.media.length} media item${booking.media.length === 1 ? '' : 's'}`}>
                            <Icon name="camera" size={12} /> {booking.media.length}
                          </small>
                        ) : null}
                      </td>
                      <td>
                        <span className="cell-main">{formatShortDate(booking.dateISO)}</span>
                        <small className="cell-sub">{booking.time}</small>
                      </td>
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
                      <td>
                        <StatusChip label={booking.payment} />
                        {booking.payment === 'Balance due' ? (
                          <small className="cell-sub">{ugx(booking.total - booking.paid)} due</small>
                        ) : null}
                      </td>
                      <td className="align-right nowrap">{ugx(booking.total)}</td>
                      <td className="align-right">
                        <Button
                          className="btn-small"
                          icon={cleaner ? 'refresh' : 'cleaners'}
                          onClick={() => setAssigning(booking)}
                        >
                          {cleaner ? 'Reassign' : 'Assign'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No bookings match these filters"
            detail="Try a different status or date range."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setQuery('');
                  setStatus('All statuses');
                  setDateFilter('All dates');
                }}
              >
                Reset filters
              </Button>
            }
          />
        )}
      </SectionCard>

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
