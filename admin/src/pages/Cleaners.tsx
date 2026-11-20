import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import {
  Avatar,
  Button,
  EmptyState,
  KpiCard,
  Modal,
  PageHeader,
  SectionCard,
  StatusChip,
  Toggle,
} from '../components/ui';
import { downloadCsv, formatDate, ugx } from '../lib/format';
import type { Booking, Cleaner } from '../types';

export function CleanersPage({
  cleaners,
  bookings,
  onToggleAvailability,
  onVerify,
  notify,
}: {
  cleaners: Cleaner[];
  bookings: Booking[];
  onToggleAvailability: (id: string) => void;
  onVerify: (id: string) => void;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState('All availability');
  const [verification, setVerification] = useState('All verification');
  const [selected, setSelected] = useState<Cleaner | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return cleaners.filter((cleaner) => {
      const matchesQuery =
        !term ||
        [cleaner.name, cleaner.area, cleaner.phone, cleaner.languages]
          .join(' ')
          .toLowerCase()
          .includes(term);
      const matchesAvailability =
        availability === 'All availability' ||
        (availability === 'Available' && cleaner.available) ||
        (availability === 'Unavailable' && !cleaner.available);
      const matchesVerification =
        verification === 'All verification' ||
        (verification === 'Verified' && cleaner.verified) ||
        (verification === 'Pending' && !cleaner.verified);
      return matchesQuery && matchesAvailability && matchesVerification;
    });
  }, [availability, cleaners, query, verification]);

  const active = cleaners.filter((cleaner) => cleaner.available).length;
  const verified = cleaners.filter((cleaner) => cleaner.verified).length;
  const averageRating =
    cleaners.reduce((sum, cleaner) => sum + cleaner.rating, 0) / cleaners.length;
  const selectedBookings = selected
    ? bookings.filter((booking) => booking.cleanerId === selected.id)
    : [];

  const exportRows = () => {
    downloadCsv('gabfix-cleaners-2026-11-20.csv', [
      ['Cleaner', 'Phone', 'Area', 'Rating', 'Jobs', 'Verified', 'Available', 'Languages', 'Cash due UGX'],
      ...cleaners.map((cleaner) => [
        cleaner.name,
        cleaner.phone,
        cleaner.area,
        cleaner.rating,
        cleaner.jobs,
        cleaner.verified ? 'Yes' : 'No',
        cleaner.available ? 'Yes' : 'No',
        cleaner.languages,
        cleaner.cashDue,
      ]),
    ]);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Field team"
        title="Cleaners"
        subtitle="Verification, availability and the people carrying the Gabfix standard."
        actions={
          <>
            <Button icon="download" onClick={exportRows}>
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon="customers"
              onClick={() => notify('Cleaner onboarding is handled outside this local admin build.')}
            >
              Invite cleaner
            </Button>
          </>
        }
      />

      <div className="kpis">
        <KpiCard
          label="Cleaners"
          value={String(cleaners.length)}
          detail={`${verified} verified`}
          icon="cleaners"
        />
        <KpiCard
          label="Available now"
          value={String(active)}
          detail={`${cleaners.length - active} off duty`}
          icon="check"
          tone="blue"
        />
        <KpiCard
          label="Average rating"
          value={averageRating.toFixed(1)}
          detail="Across the local roster"
          icon="spark"
          tone="yellow"
        />
        <KpiCard
          label="Pending verification"
          value={String(cleaners.length - verified)}
          detail="ID or background check outstanding"
          icon="alert"
          tone="rose"
        />
      </div>

      <SectionCard>
        <div className="filter-bar">
          <label className="search-field">
            <Icon name="search" size={16} />
            <span className="sr-only">Search cleaners</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, area or language"
            />
          </label>
          <label className="select-field">
            <span className="sr-only">Availability</span>
            <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
              <option>All availability</option>
              <option>Available</option>
              <option>Unavailable</option>
            </select>
          </label>
          <label className="select-field">
            <span className="sr-only">Verification</span>
            <select value={verification} onChange={(event) => setVerification(event.target.value)}>
              <option>All verification</option>
              <option>Verified</option>
              <option>Pending</option>
            </select>
          </label>
        </div>

        {filtered.length ? (
          <div className="cleaner-grid">
            {filtered.map((cleaner) => (
              <article className="cleaner-card" key={cleaner.id}>
                <div className="cleaner-card-head">
                  <Avatar name={cleaner.name} tone={cleaner.tone} size="lg" />
                  <div className="cleaner-card-name">
                    <h3>{cleaner.name}</h3>
                    <p>{cleaner.area}</p>
                    <div className="cleaner-badges">
                      {cleaner.verified ? (
                        <StatusChip label="Verified" icon="check" />
                      ) : (
                        <StatusChip label="Pending" icon="clock" />
                      )}
                      <span className="rating-inline">
                        <Icon name="spark" size={13} /> {cleaner.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <Toggle
                    checked={cleaner.available}
                    onChange={() => onToggleAvailability(cleaner.id)}
                    label={`Set ${cleaner.name} ${cleaner.available ? 'unavailable' : 'available'}`}
                  />
                </div>
                <div className="cleaner-stats">
                  <div>
                    <span>Jobs</span>
                    <strong>{cleaner.jobs}</strong>
                  </div>
                  <div>
                    <span>Languages</span>
                    <strong>{cleaner.languages}</strong>
                  </div>
                  <div>
                    <span>Cash due</span>
                    <strong>{ugx(cleaner.cashDue)}</strong>
                  </div>
                </div>
                <div className="cleaner-card-foot">
                  <span className={cleaner.available ? 'availability on' : 'availability'}>
                    <i /> {cleaner.available ? 'Available' : 'Off duty'}
                  </span>
                  <Button className="btn-small" icon="user" onClick={() => setSelected(cleaner)}>
                    View profile
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="cleaners"
            title="No cleaners found"
            detail="Try another name, area or filter."
            action={
              <Button
                onClick={() => {
                  setQuery('');
                  setAvailability('All availability');
                  setVerification('All verification');
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
      </SectionCard>

      <Modal
        open={Boolean(selected)}
        title={selected?.name ?? 'Cleaner'}
        description={selected ? `${selected.area} · ${selected.phone}` : undefined}
        onClose={() => setSelected(null)}
        wide
        footer={
          <>
            <Button onClick={() => setSelected(null)}>Close</Button>
            {selected && !selected.verified ? (
              <Button
                variant="primary"
                icon="check"
                onClick={() => {
                  onVerify(selected.id);
                  setSelected(null);
                }}
              >
                Verify identity
              </Button>
            ) : (
              <Button
                variant="primary"
                icon="bell"
                onClick={() => {
                  if (selected) notify(`Check-in message sent to ${selected.name}.`);
                  setSelected(null);
                }}
              >
                Send check-in
              </Button>
            )}
          </>
        }
      >
        {selected ? (
          <div className="cleaner-detail">
            <div className="customer-summary">
              <div><span>Rating</span><strong>{selected.rating.toFixed(1)} / 5</strong></div>
              <div><span>Completed jobs</span><strong>{selected.jobs}</strong></div>
              <div><span>Languages</span><strong>{selected.languages}</strong></div>
              <div><span>Availability</span><StatusChip label={selected.available ? 'Available' : 'Unavailable'} /></div>
              <div><span>Verification</span><StatusChip label={selected.verified ? 'Verified' : 'Pending'} /></div>
              <div><span>Cash due</span><strong>{ugx(selected.cashDue)}</strong></div>
            </div>
            <h3 className="subhead">Recent jobs</h3>
            {selectedBookings.length ? (
              <div className="table-scroll">
                <table className="table compact-table">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="align-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.id}</td>
                        <td>{booking.customer}</td>
                        <td>{formatDate(booking.dateISO)}</td>
                        <td><StatusChip label={booking.status} /></td>
                        <td className="align-right">{ugx(booking.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted-small">No jobs assigned in the current sample.</p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
