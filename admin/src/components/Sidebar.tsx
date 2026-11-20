import { cx } from '../lib/format';
import type { PageId } from '../types';
import { Icon, type IconName } from './Icon';

type NavItem = { id: PageId; label: string; icon: IconName };

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: 'overview' },
      { id: 'bookings', label: 'Bookings', icon: 'bookings' },
      { id: 'payments', label: 'Payments', icon: 'payments' },
      { id: 'cash', label: 'Cash collections', icon: 'cash' },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'customers', label: 'Customers', icon: 'customers' },
      { id: 'cleaners', label: 'Cleaners', icon: 'cleaners' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { id: 'services', label: 'Services & pricing', icon: 'services' },
      { id: 'promos', label: 'Promos', icon: 'promos' },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'reports', label: 'Reports', icon: 'reports' },
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export function Sidebar({
  active,
  mobileOpen,
  onNavigate,
  onCloseMobile,
}: {
  active: PageId;
  mobileOpen: boolean;
  onNavigate: (page: PageId) => void;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={onCloseMobile}
        />
      ) : null}
      <aside className={cx('sidebar', mobileOpen && 'sidebar-open')} aria-label="Operations navigation">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            G
          </span>
          <span className="brand-copy">
            <strong>Gabfix</strong>
            <span>Operations</span>
          </span>
          <button
            type="button"
            className="sidebar-close"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="nav">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={cx('nav-item', active === item.id && 'active')}
                  aria-current={active === item.id ? 'page' : undefined}
                  title={item.label}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                  {item.id === 'cash' ? <em className="nav-badge">3</em> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="status-dot" />
          <span className="sidebar-foot-copy">
            <strong>All systems operational</strong>
            <span>Last checked 2 min ago</span>
          </span>
        </div>
      </aside>
    </>
  );
}
