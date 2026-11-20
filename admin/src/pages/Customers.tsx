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
} from '../components/ui';
import { downloadCsv, formatDate, formatShortDate, ugx } from '../lib/format';
import type { Booking, Customer } from '../types';

export function CustomersPage({
  customers,
  bookings,
  notify,
}: {
  customers: Customer[];
  bookings: Booking[];
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('All segments');
  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesQuery =
        !term ||
        [customer.name, customer.phone, customer.email, customer.area]
          .join(' ')
          .toLowerCase()
          .includes(term);
      const matchesSegment = segment === 'All segments' || customer.segment === segment;
      const matchesStatus = status === 'All statuses' || customer.status === status;
      return matchesQuery && matchesSegment && matchesStatus;
    });
  }, [customers, query, segment, status]);

  const totalSpend = customers.reduce((sum, customer) => sum + customer.spend, 0);
  const repeatCustomers = customers.filter((customer) => customer.bookings > 1).length;
  const atRisk = customers.filter((customer) => customer.status === 'At risk').length;

  const exportRows = () => {
    downloadCsv('gabfix-customers-2026-11-20.csv', [
      ['Customer', 'Phone', 'Email', 'Area', 'Segment', 'Bookings', 'Spend UGX', 'Last booking', 'Status'],
      ...customers.map((customer) => [
        customer.name,
        customer.phone,
        customer.email,
        customer.area,
        customer.segment,
        customer.bookings,
        customer.spend,
        customer.lastBooking,
        customer.status,
      ]),
    ]);
  };

  const customerBookings = selected
    ? bookings.filter((booking) => booking.customerId === selected.id)
    : [];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Relationships"
        title="Customers"
        subtitle="Know who books often, who has gone quiet and who needs a hand."
        actions={
          <>
            <Button icon="download" onClick={exportRows}>
              Export CSV
            </Button>
            <Button variant="primary" icon="promos" onClick={() => notify('Offer campaign builder is not connected yet.')}>
              New offer
            </Button>
          </>
        }
      />

      <div className="kpis">
        <KpiCard
          label="Customers"
          value={String(customers.length)}
          detail="Active accounts in the local sample"
          icon="customers"
        />
        <KpiCard
          label="Repeat rate"
          value={`${Math.round((repeatCustomers / customers.length) * 100)}%`}
          detail={`${repeatCustomers} booked more than once`}
          trend="up"
          trendLabel="4.0%"
          icon="refresh"
          tone="blue"
        />
        <KpiCard
          label="Lifetime spend"
          value={ugx(totalSpend)}
          detail="Across the sample accounts"
          icon="payments"
          tone="yellow"
        />
        <KpiCard
          label="At risk"
          value={String(atRisk)}
          detail="No booking in the last 21 days"
          icon="alert"
          tone="rose"
        />
      </div>

      <SectionCard>
        <div className="filter-bar">
          <label className="search-field">
            <Icon name="search" size={16} />
            <span className="sr-only">Search customers</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, phone, email or area"
            />
          </label>
          <label className="select-field">
            <span className="sr-only">Segment</span>
            <select value={segment} onChange={(event) => setSegment(event.target.value)}>
              <option>All segments</option>
              <option>Residential</option>
              <option>Office</option>
            </select>
          </label>
          <label className="select-field">
            <span className="sr-only">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All statuses</option>
              <option>Active</option>
              <option>New</option>
              <option>At risk</option>
            </select>
          </label>
        </div>

        {filtered.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Area</th>
                  <th>Segment</th>
                  <th className="align-right">Bookings</th>
                  <th className="align-right">Lifetime spend</th>
                  <th>Last booking</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="cell-person">
                        <Avatar name={customer.name} tone="#E8F6EE" size="sm" />
                        <span>
                          <strong>{customer.name}</strong>
                          <small>{customer.phone} · {customer.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>{customer.area}</td>
                    <td>{customer.segment}</td>
                    <td className="align-right">{customer.bookings}</td>
                    <td className="align-right nowrap">{ugx(customer.spend)}</td>
                    <td className="nowrap">{formatShortDate(customer.lastBooking)}</td>
                    <td><StatusChip label={customer.status} /></td>
                    <td className="align-right">
                      <button
                        type="button"
                        className="icon-btn small"
                        aria-label={`View ${customer.name}`}
                        onClick={() => setSelected(customer)}
                      >
                        <Icon name="chevronRight" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="customers"
            title="No customers found"
            detail="Try another name, area or segment."
            action={
              <Button
                onClick={() => {
                  setQuery('');
                  setSegment('All segments');
                  setStatus('All statuses');
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
        title={selected?.name ?? 'Customer'}
        description={selected ? `${selected.id} · ${selected.area} · ${selected.segment}` : undefined}
        onClose={() => setSelected(null)}
        wide
        footer={
          <>
            <Button onClick={() => setSelected(null)}>Close</Button>
            <Button
              variant="primary"
              icon="bell"
              onClick={() => {
                if (selected) notify(`Follow-up message queued for ${selected.name}.`);
                setSelected(null);
              }}
            >
              Send follow-up
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="customer-detail">
            <div className="customer-summary">
              <div>
                <span>Phone</span>
                <strong>{selected.phone}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selected.email}</strong>
              </div>
              <div>
                <span>Lifetime spend</span>
                <strong>{ugx(selected.spend)}</strong>
              </div>
              <div>
                <span>Bookings</span>
                <strong>{selected.bookings}</strong>
              </div>
              <div>
                <span>Last booking</span>
                <strong>{formatDate(selected.lastBooking)}</strong>
              </div>
              <div>
                <span>Status</span>
                <StatusChip label={selected.status} />
              </div>
            </div>
            <h3 className="subhead">Recent bookings</h3>
            {customerBookings.length ? (
              <div className="table-scroll">
                <table className="table compact-table">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="align-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.id}</td>
                        <td>{booking.service}</td>
                        <td>{formatShortDate(booking.dateISO)}</td>
                        <td><StatusChip label={booking.status} /></td>
                        <td className="align-right">{ugx(booking.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted-small">No bookings recorded in the local data.</p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
