import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar, type DateRange } from './components/Topbar';
import { Toast } from './components/ui';
import {
  initialBookings,
  initialCash,
  initialCleaners,
  initialCustomers,
  initialPayments,
  initialPromos,
  initialRateCard,
  initialSettings,
  notificationsSeed,
} from './data';
import { BookingsPage } from './pages/Bookings';
import { CashPage } from './pages/Cash';
import { CleanersPage } from './pages/Cleaners';
import { CustomersPage } from './pages/Customers';
import { Overview } from './pages/Overview';
import { PaymentsPage } from './pages/Payments';
import { PromosPage } from './pages/Promos';
import { ReportsPage } from './pages/Reports';
import { ServicesPage } from './pages/Services';
import { SettingsPage } from './pages/Settings';
import type {
  Booking,
  CashCollection,
  Cleaner,
  Customer,
  OperationsSettings,
  PageId,
  Payment,
  Promo,
  RateCard,
} from './types';

const pages: PageId[] = [
  'overview',
  'bookings',
  'payments',
  'cash',
  'customers',
  'cleaners',
  'services',
  'promos',
  'reports',
  'settings',
];

const pageTitles: Record<PageId, string> = {
  overview: 'Operations overview',
  bookings: 'Bookings',
  payments: 'Payments',
  cash: 'Cash collections',
  customers: 'Customers',
  cleaners: 'Cleaners',
  services: 'Services & pricing',
  promos: 'Promos',
  reports: 'Reports',
  settings: 'Settings',
};

const pageFromHash = (): PageId => {
  const candidate = window.location.hash.replace(/^#\/?/, '') as PageId;
  return pages.includes(candidate) ? candidate : 'overview';
};

export default function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('Last 7 days');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [cleaners, setCleaners] = useState<Cleaner[]>(initialCleaners);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [cash, setCash] = useState<CashCollection[]>(initialCash);
  const [promos, setPromos] = useState<Promo[]>(initialPromos);
  const [rateCard, setRateCard] = useState<RateCard>(initialRateCard);
  const [settings, setSettings] = useState<OperationsSettings>(initialSettings);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);

  const notify = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 3600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = `${pageTitles[page]} · Gabfix Operations`;
  }, [page]);

  const navigate = useCallback((next: PageId) => {
    setPage(next);
    setMobileOpen(false);
    if (window.location.hash !== `#/${next}`) window.location.hash = `#/${next}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const assignBooking = (bookingId: string, cleanerId: string) => {
    const cleaner = cleaners.find((item) => item.id === cleanerId);
    setBookings((current) =>
      current.map((booking) => (booking.id === bookingId ? { ...booking, cleanerId } : booking)),
    );
    notify(cleaner ? `${cleaner.name} assigned to ${bookingId}.` : `${bookingId} updated.`);
  };

  const markRemitted = (id: string) => {
    const entry = cash.find((item) => item.id === id);
    setCash((current) =>
      current.map((item) => (item.id === id ? { ...item, remitted: true } : item)),
    );
    if (entry) {
      setCleaners((current) =>
        current.map((cleaner) =>
          cleaner.id === entry.cleanerId
            ? { ...cleaner, cashRemitted: true, cashDue: 0 }
            : cleaner,
        ),
      );
      notify(`${entry.cleaner} marked remitted · ${entry.amountDue.toLocaleString('en-UG')} UGX.`);
    }
  };

  const resolveDispute = (id: string) => {
    const entry = cash.find((item) => item.id === id);
    setCash((current) =>
      current.map((item) => (item.id === id ? { ...item, dispute: undefined } : item)),
    );
    if (entry) {
      setCleaners((current) =>
        current.map((cleaner) =>
          cleaner.id === entry.cleanerId ? { ...cleaner, cashDispute: undefined } : cleaner,
        ),
      );
      notify(`${entry.cleaner}'s cash dispute was resolved.`);
    }
  };

  const retryPayment = (id: string) => {
    const payment = payments.find((item) => item.id === id);
    setPayments((current) =>
      current.map((item) =>
        item.id === id ? { ...item, kind: 'Deposit', status: 'Received' } : item,
      ),
    );
    notify(payment ? `Retry approved for ${payment.bookingId}.` : 'Payment retried.');
  };

  const reconcilePayment = (id: string) => {
    const payment = payments.find((item) => item.id === id);
    setPayments((current) =>
      current.map((item) => (item.id === id ? { ...item, status: 'Reconciled' } : item)),
    );
    notify(payment ? `${payment.bookingId} reconciled with the provider.` : 'Payment reconciled.');
  };

  const toggleAvailability = (id: string) => {
    const cleaner = cleaners.find((item) => item.id === id);
    setCleaners((current) =>
      current.map((item) => (item.id === id ? { ...item, available: !item.available } : item)),
    );
    if (cleaner) {
      notify(`${cleaner.name} is now ${cleaner.available ? 'off duty' : 'available'}.`);
    }
  };

  const verifyCleaner = (id: string) => {
    const cleaner = cleaners.find((item) => item.id === id);
    setCleaners((current) =>
      current.map((item) => (item.id === id ? { ...item, verified: true } : item)),
    );
    notify(cleaner ? `${cleaner.name} verified.` : 'Cleaner verified.');
  };

  const togglePromo = (id: string) => {
    const promo = promos.find((item) => item.id === id);
    setPromos((current) =>
      current.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
    );
    if (promo) notify(`${promo.code} ${promo.active ? 'paused' : 'activated'}.`);
  };

  const createPromo = (promo: Promo) => {
    setPromos((current) => [promo, ...current]);
  };

  const saveRateCard = (next: RateCard) => {
    setRateCard(next);
    notify('Rate card updated for this session.');
  };

  const saveSettings = (next: OperationsSettings) => {
    setSettings(next);
    notify('Operations settings updated for this session.');
  };

  return (
    <div className="app">
      <Sidebar
        active={page}
        mobileOpen={mobileOpen}
        onNavigate={navigate}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="main">
        <Topbar
          page={page}
          bookings={bookings}
          customers={customers}
          cleaners={cleaners}
          dateRange={dateRange}
          onDateRange={setDateRange}
          onNavigate={navigate}
          onOpenMobile={() => setMobileOpen(true)}
          notifications={notificationsSeed}
          readNotifications={readNotifications}
          onReadNotification={(id) => {
            setReadNotifications((current) =>
              current.includes(id) ? current : [...current, id],
            );
          }}
          onReadAll={() => setReadNotifications(notificationsSeed.map((item) => item.id))}
        />
        <main className="page-wrap">
          {page === 'overview' ? (
            <Overview
              bookings={bookings}
              cleaners={cleaners}
              cash={cash}
              dateRange={dateRange}
              onNavigate={navigate}
              onAssign={assignBooking}
              notify={notify}
            />
          ) : null}
          {page === 'bookings' ? (
            <BookingsPage bookings={bookings} cleaners={cleaners} onAssign={assignBooking} />
          ) : null}
          {page === 'payments' ? (
            <PaymentsPage
              payments={payments}
              bookings={bookings}
              onRetry={retryPayment}
              onReconcile={reconcilePayment}
              notify={notify}
            />
          ) : null}
          {page === 'cash' ? (
            <CashPage
              cash={cash}
              cleaners={cleaners}
              reminderHours={settings.cashReminderHours}
              onMarkRemitted={markRemitted}
              onResolveDispute={resolveDispute}
              notify={notify}
            />
          ) : null}
          {page === 'customers' ? (
            <CustomersPage customers={customers} bookings={bookings} notify={notify} />
          ) : null}
          {page === 'cleaners' ? (
            <CleanersPage
              cleaners={cleaners}
              bookings={bookings}
              onToggleAvailability={toggleAvailability}
              onVerify={verifyCleaner}
              notify={notify}
            />
          ) : null}
          {page === 'services' ? (
            <ServicesPage rateCard={rateCard} onSave={saveRateCard} />
          ) : null}
          {page === 'promos' ? (
            <PromosPage
              promos={promos}
              onToggle={togglePromo}
              onCreate={createPromo}
              notify={notify}
            />
          ) : null}
          {page === 'reports' ? (
            <ReportsPage
              bookings={bookings}
              payments={payments}
              cash={cash}
              customers={customers}
              cleaners={cleaners}
              notify={notify}
            />
          ) : null}
          {page === 'settings' ? (
            <SettingsPage settings={settings} onSave={saveSettings} />
          ) : null}
        </main>
        <Toast message={toast} />
      </div>
    </div>
  );
}
