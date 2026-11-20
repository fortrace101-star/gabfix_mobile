import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import {
  Button,
  EmptyState,
  Field,
  KpiCard,
  Modal,
  PageHeader,
  SectionCard,
  StatusChip,
  Toggle,
} from '../components/ui';
import { downloadCsv, formatDate, ugx } from '../lib/format';
import type { Promo } from '../types';

type NewPromo = {
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  limit: number;
  expires: string;
};

const emptyPromo: NewPromo = {
  code: '',
  kind: 'percent',
  value: 10,
  limit: 100,
  expires: '2026-12-31',
};

export function PromosPage({
  promos,
  onToggle,
  onCreate,
  notify,
}: {
  promos: Promo[];
  onToggle: (id: string) => void;
  onCreate: (promo: Promo) => void;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewPromo>(emptyPromo);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return promos.filter((promo) => !term || promo.code.toLowerCase().includes(term));
  }, [promos, query]);

  const active = promos.filter((promo) => promo.active).length;
  const redemptions = promos.reduce((sum, promo) => sum + promo.uses, 0);
  const discountGiven = promos.reduce(
    (sum, promo) => sum + (promo.kind === 'fixed' ? promo.value * promo.uses : 0),
    0,
  );
  const expiring = promos.filter(
    (promo) => promo.active && promo.expires <= '2026-12-04' && promo.expires >= '2026-11-20',
  ).length;

  const exportRows = () => {
    downloadCsv('gabfix-promos-2026-11-20.csv', [
      ['Code', 'Type', 'Value', 'Uses', 'Limit', 'Expires', 'Active'],
      ...promos.map((promo) => [
        promo.code,
        promo.kind,
        promo.value,
        promo.uses,
        promo.limit,
        promo.expires,
        promo.active ? 'Yes' : 'No',
      ]),
    ]);
  };

  const submit = () => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      setError('Enter a promo code.');
      return;
    }
    if (promos.some((promo) => promo.code === code)) {
      setError('That code already exists.');
      return;
    }
    if (!form.value || form.value <= 0 || (form.kind === 'percent' && form.value > 100)) {
      setError('Enter a value between 1 and 100 for a percentage discount.');
      return;
    }
    if (!form.expires) {
      setError('Choose an expiry date.');
      return;
    }
    onCreate({
      id: `pro-${Date.now()}`,
      code,
      kind: form.kind,
      value: form.value,
      uses: 0,
      limit: form.limit || 1,
      expires: form.expires,
      active: true,
    });
    setOpen(false);
    setForm(emptyPromo);
    setError('');
    notify(`${code} is now live.`);
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      notify(`${code} copied.`);
    } catch {
      notify(`Could not copy ${code}. Select the code manually.`);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Growth"
        title="Promos"
        subtitle="Codes, caps and expiry windows. Keep an eye on what is actually being used."
        actions={
          <>
            <Button icon="download" onClick={exportRows}>
              Export CSV
            </Button>
            <Button variant="primary" icon="plus" onClick={() => setOpen(true)}>
              New promo
            </Button>
          </>
        }
      />

      <div className="kpis">
        <KpiCard
          label="Active codes"
          value={String(active)}
          detail={`${promos.length} total campaigns`}
          icon="promos"
        />
        <KpiCard
          label="Redemptions"
          value={String(redemptions)}
          detail="Across all local campaigns"
          trend="up"
          trendLabel="18.2%"
          icon="check"
          tone="blue"
        />
        <KpiCard
          label="Fixed discounts given"
          value={ugx(discountGiven)}
          detail="Fixed-value campaigns only"
          icon="payments"
          tone="yellow"
        />
        <KpiCard
          label="Expiring in 14 days"
          value={String(expiring)}
          detail="Active codes nearing expiry"
          icon="clock"
          tone="rose"
        />
      </div>

      <SectionCard>
        <div className="filter-bar">
          <label className="search-field">
            <Icon name="search" size={16} />
            <span className="sr-only">Search promo codes</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search promo code"
            />
          </label>
          <span className="filter-note">
            <Icon name="alert" size={14} /> Promo validation remains on the device until the promo
            API is connected.
          </span>
        </div>

        {filtered.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Redemptions</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Live</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((promo) => {
                  const usage = Math.min((promo.uses / promo.limit) * 100, 100);
                  const expiringSoon = promo.expires <= '2026-12-04' && promo.active;
                  return (
                    <tr key={promo.id}>
                      <td>
                        <button
                          type="button"
                          className="code-chip"
                          onClick={() => copy(promo.code)}
                          title="Copy promo code"
                        >
                          {promo.code}
                          <Icon name="external" size={12} />
                        </button>
                      </td>
                      <td className="nowrap">
                        {promo.kind === 'percent' ? `${promo.value}%` : ugx(promo.value)}
                      </td>
                      <td>
                        <div className="usage-cell">
                          <span>{promo.uses} / {promo.limit}</span>
                          <div className="usage-track" aria-hidden="true">
                            <span style={{ width: `${usage}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={expiringSoon ? 'expiry-soon' : undefined}>
                          {formatDate(promo.expires)}
                        </span>
                      </td>
                      <td>
                        <StatusChip
                          label={promo.active ? 'Active' : 'Paused'}
                          tone={promo.active ? 'success' : 'neutral'}
                        />
                      </td>
                      <td>
                        <Toggle
                          checked={promo.active}
                          onChange={() => onToggle(promo.id)}
                          label={`${promo.active ? 'Pause' : 'Activate'} ${promo.code}`}
                        />
                      </td>
                      <td className="align-right">
                        <Button className="btn-small" icon="external" onClick={() => copy(promo.code)}>
                          Copy
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
            icon="promos"
            title="No promo codes found"
            detail="Try another code, or start a new campaign."
            action={<Button variant="primary" icon="plus" onClick={() => setOpen(true)}>New promo</Button>}
          />
        )}
      </SectionCard>

      <Modal
        open={open}
        title="New promo code"
        description="New codes are active immediately in this local build."
        onClose={() => {
          setOpen(false);
          setError('');
        }}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" icon="plus" onClick={submit}>
              Create promo
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Promo code" hint="Letters and numbers; spaces are removed">
            <input
              className="text-input"
              value={form.code}
              placeholder="e.g. DECEMBER15"
              onChange={(event) => {
                setForm({ ...form, code: event.target.value.toUpperCase().replace(/\s/g, '') });
                setError('');
              }}
            />
          </Field>
          <Field label="Discount type">
            <select
              className="text-input"
              value={form.kind}
              onChange={(event) => setForm({ ...form, kind: event.target.value as 'percent' | 'fixed' })}
            >
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed UGX amount</option>
            </select>
          </Field>
          <Field label={form.kind === 'percent' ? 'Discount (%)' : 'Discount (UGX)'}>
            <input
              className="text-input"
              type="number"
              min="1"
              max={form.kind === 'percent' ? 100 : undefined}
              value={form.value}
              onChange={(event) => setForm({ ...form, value: Number(event.target.value) })}
            />
          </Field>
          <Field label="Redemption limit" hint="Maximum number of bookings">
            <input
              className="text-input"
              type="number"
              min="1"
              value={form.limit}
              onChange={(event) => setForm({ ...form, limit: Number(event.target.value) })}
            />
          </Field>
          <Field label="Expiry date">
            <input
              className="text-input"
              type="date"
              value={form.expires}
              onChange={(event) => setForm({ ...form, expires: event.target.value })}
            />
          </Field>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </Modal>
    </div>
  );
}
