import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { cx, initials } from '../lib/format';
import { Icon, type IconName } from './Icon';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const chipTone: Record<string, Tone> = {
  Paid: 'success',
  Received: 'success',
  Reconciled: 'success',
  Completed: 'success',
  Active: 'success',
  Remitted: 'success',
  Verified: 'success',
  'Deposit paid': 'info',
  Confirmed: 'info',
  'In progress': 'info',
  New: 'info',
  Pending: 'warning',
  'Balance due': 'warning',
  Available: 'success',
  Unavailable: 'neutral',
  'At risk': 'warning',
  Refunded: 'neutral',
  Cancelled: 'neutral',
  Failed: 'danger',
  Disputed: 'danger',
  'Unconfirmed >24h': 'danger',
};

export function StatusChip({
  label,
  tone,
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: IconName;
}) {
  const resolved = tone ?? chipTone[label] ?? 'neutral';
  return (
    <span className={cx('chip', `chip-${resolved}`)}>
      {icon ? <Icon name={icon} size={12} /> : null}
      {label}
    </span>
  );
}

export function Avatar({
  name,
  tone,
  size = 'md',
}: {
  name: string;
  tone?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <span
      className={cx('avatar', `avatar-${size}`)}
      style={tone ? { background: tone } : undefined}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Button({
  variant = 'secondary',
  icon,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
}) {
  return (
    <button className={cx('btn', `btn-${variant}`, className)} {...props}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
}

export function KpiCard({
  label,
  value,
  detail,
  trend,
  trendLabel,
  icon,
  tone = 'green',
}: {
  label: string;
  value: string;
  detail?: string;
  trend?: 'up' | 'down';
  trendLabel?: string;
  icon: IconName;
  tone?: 'green' | 'yellow' | 'blue' | 'rose';
}) {
  return (
    <article className="card kpi">
      <div className="kpi-top">
        <span className={cx('kpi-icon', `kpi-icon-${tone}`)}>
          <Icon name={icon} size={19} />
        </span>
        {trend && trendLabel ? (
          <span className={cx('trend', trend)}>
            <Icon name={trend === 'up' ? 'arrowUp' : 'arrowDown'} size={12} />
            {trendLabel}
          </span>
        ) : null}
      </div>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {detail ? <p className="kpi-detail">{detail}</p> : null}
    </article>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function SectionCard({
  title,
  meta,
  action,
  className,
  children,
}: {
  title?: string;
  meta?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx('card section-card', className)}>
      {title ? (
        <div className="section-head">
          <div>
            <h2>{title}</h2>
            {meta ? <p>{meta}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={cx('modal', wide && 'modal-wide')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = 'search',
  title,
  detail,
  action,
}: {
  icon?: IconName;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon">
        <Icon name="check" size={15} />
      </span>
      {message}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx('toggle', checked && 'toggle-on')}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}
