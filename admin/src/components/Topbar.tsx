import { useEffect, useMemo, useRef, useState } from 'react';
import { cx } from '../lib/format';
import type { Booking, Cleaner, Customer, PageId } from '../types';
import { Avatar } from './ui';
import { Icon, type IconName } from './Icon';

type SearchResult = { page: PageId; label: string; meta: string; icon: IconName };

export type DateRange = 'Today' | 'Last 7 days' | 'Last 30 days';

export function Topbar({
  page,
  bookings,
  customers,
  cleaners,
  dateRange,
  onDateRange,
  onNavigate,
  onOpenMobile,
  notifications,
  readNotifications,
  onReadNotification,
  onReadAll,
}: {
  page: PageId;
  bookings: Booking[];
  customers: Customer[];
  cleaners: Cleaner[];
  dateRange: DateRange;
  onDateRange: (range: DateRange) => void;
  onNavigate: (page: PageId) => void;
  onOpenMobile: () => void;
  notifications: { id: string; title: string; detail: string; tone: 'warning' | 'danger' | 'success' }[];
  readNotifications: string[];
  onReadNotification: (id: string) => void;
  onReadAll: () => void;
}) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
      if (!notificationRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const bookingResults = bookings
      .filter((booking) =>
        [booking.id, booking.customer, booking.service, booking.area]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 3)
      .map((booking) => ({
        page: 'bookings' as const,
        label: `${booking.id} · ${booking.customer}`,
        meta: `${booking.service} · ${booking.area}`,
        icon: 'bookings' as const,
      }));
    const customerResults = customers
      .filter((customer) =>
        [customer.name, customer.phone, customer.email].join(' ').toLowerCase().includes(term),
      )
      .slice(0, 2)
      .map((customer) => ({
        page: 'customers' as const,
        label: customer.name,
        meta: `${customer.area} · ${customer.bookings} bookings`,
        icon: 'customers' as const,
      }));
    const cleanerResults = cleaners
      .filter((cleaner) => [cleaner.name, cleaner.area].join(' ').toLowerCase().includes(term))
      .slice(0, 2)
      .map((cleaner) => ({
        page: 'cleaners' as const,
        label: cleaner.name,
        meta: `${cleaner.area} · ${cleaner.rating.toFixed(1)} rating`,
        icon: 'cleaners' as const,
      }));
    return [...bookingResults, ...customerResults, ...cleanerResults];
  }, [bookings, cleaners, customers, query]);

  const unread = notifications.length - readNotifications.length;
  const pageLabel: Record<PageId, string> = {
    overview: 'Overview',
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

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn mobile-menu"
          aria-label="Open navigation"
          onClick={onOpenMobile}
        >
          <Icon name="menu" />
        </button>
        <span className="crumb">
          Operations <Icon name="chevronRight" size={13} /> <strong>{pageLabel[page]}</strong>
        </span>
        <div className="global-search" ref={searchRef}>
          <Icon name="search" size={17} />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSearchOpen(false);
              if (event.key === 'Enter' && results[0]) {
                onNavigate(results[0].page);
                setQuery('');
                setSearchOpen(false);
              }
            }}
            placeholder="Search bookings, cleaners, customers"
            aria-label="Search operations"
          />
          <kbd>⌘ K</kbd>
          {searchOpen && query.trim() ? (
            <div className="search-popover" role="listbox" aria-label="Search results">
              {results.length ? (
                <>
                  <p className="popover-label">{results.length} results</p>
                  {results.map((result, index) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === 0}
                      key={`${result.page}-${result.label}`}
                      className="search-result"
                      onClick={() => {
                        onNavigate(result.page);
                        setQuery('');
                        setSearchOpen(false);
                      }}
                    >
                      <span className="search-result-icon">
                        <Icon name={result.icon} size={16} />
                      </span>
                      <span>
                        <strong>{result.label}</strong>
                        <small>{result.meta}</small>
                      </span>
                      <Icon name="chevronRight" size={14} />
                    </button>
                  ))}
                </>
              ) : (
                <div className="search-empty">
                  No matches for “{query.trim()}”. Try a booking ID, name or area.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="topbar-right">
        <label className="date-range">
          <Icon name="clock" size={15} />
          <span className="sr-only">Date range</span>
          <select
            value={dateRange}
            onChange={(event) => onDateRange(event.target.value as DateRange)}
            aria-label="Date range"
          >
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </label>

        <div className="notification-wrap" ref={notificationRef}>
          <button
            type="button"
            className={cx('icon-btn', notificationsOpen && 'is-active')}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Icon name="bell" size={19} />
            {unread ? <span className="notification-dot">{unread}</span> : null}
          </button>
          {notificationsOpen ? (
            <div className="notification-popover">
              <div className="popover-head">
                <strong>Notifications</strong>
                <button type="button" className="text-btn" onClick={onReadAll}>
                  Mark all read
                </button>
              </div>
              {notifications.map((notification) => {
                const isRead = readNotifications.includes(notification.id);
                return (
                  <button
                    type="button"
                    key={notification.id}
                    className={cx('notification-item', isRead && 'read')}
                    onClick={() => onReadNotification(notification.id)}
                  >
                    <span className={cx('notification-mark', notification.tone)} />
                    <span>
                      <strong>{notification.title}</strong>
                      <small>{notification.detail}</small>
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                className="notification-footer"
                onClick={() => {
                  onNavigate('settings');
                  setNotificationsOpen(false);
                }}
              >
                Notification settings <Icon name="chevronRight" size={14} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="admin-identity">
          <Avatar name="Moses K" tone="#F5EE5E" size="sm" />
          <span>
            <strong>Moses K.</strong>
            <small>Operations lead</small>
          </span>
        </div>
      </div>
    </header>
  );
}
