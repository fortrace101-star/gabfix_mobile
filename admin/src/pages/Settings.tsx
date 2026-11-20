import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Field, PageHeader, SectionCard, Toggle } from '../components/ui';
import type { OperationsSettings } from '../types';

export function SettingsPage({
  settings,
  onSave,
}: {
  settings: OperationsSettings;
  onSave: (next: OperationsSettings) => void;
}) {
  const [draft, setDraft] = useState<OperationsSettings>(() => ({ ...settings }));
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const update = <K extends keyof OperationsSettings>(key: K, value: OperationsSettings[K]) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const areas = draft.serviceAreas
    .split(',')
    .map((area) => area.trim())
    .filter(Boolean);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        subtitle="Support details, cash controls and the alerts the operations team relies on."
        actions={
          <>
            <Button
              icon="refresh"
              disabled={!dirty}
              onClick={() => {
                setDraft({ ...settings });
                setSaved(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              icon="check"
              disabled={!dirty}
              onClick={() => {
                onSave(draft);
                setSaved(true);
              }}
            >
              Save settings
            </Button>
          </>
        }
      />

      <div className="settings-layout">
        <div className="settings-main">
          <SectionCard title="Support details" meta="Shown to customers in the help centre">
            <div className="form-grid">
              <Field label="Support phone">
                <input
                  className="text-input"
                  value={draft.supportPhone}
                  onChange={(event) => update('supportPhone', event.target.value)}
                />
              </Field>
              <Field label="Support email">
                <input
                  className="text-input"
                  type="email"
                  value={draft.supportEmail}
                  onChange={(event) => update('supportEmail', event.target.value)}
                />
              </Field>
              <Field label="Support hours" hint="Use the customer-facing wording">
                <input
                  className="text-input"
                  value={draft.supportHours}
                  onChange={(event) => update('supportHours', event.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Cash controls" meta="Protect the remittance trail">
            <div className="settings-row">
              <div>
                <strong>Cash reminder threshold</strong>
                <p>Flag cash that has not been remitted within this many hours.</p>
              </div>
              <label className="inline-number">
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={draft.cashReminderHours}
                  onChange={(event) => update('cashReminderHours', Number(event.target.value))}
                  aria-label="Cash reminder threshold in hours"
                />
                <span>hours</span>
              </label>
            </div>
            <div className="settings-row">
              <div>
                <strong>Auto-assign new bookings</strong>
                <p>Offer new jobs to the nearest available cleaner before they reach the queue.</p>
              </div>
              <Toggle
                checked={draft.autoAssign}
                onChange={(next) => update('autoAssign', next)}
                label="Auto-assign new bookings"
              />
            </div>
          </SectionCard>

          <SectionCard title="Notifications" meta="For the operations lead and finance">
            <div className="settings-row">
              <div>
                <strong>Unassigned job alerts</strong>
                <p>Notify when a job is still unassigned six hours before its start time.</p>
              </div>
              <Toggle
                checked={draft.notifyUnassigned}
                onChange={(next) => update('notifyUnassigned', next)}
                label="Unassigned job alerts"
              />
            </div>
            <div className="settings-row">
              <div>
                <strong>Failed payment alerts</strong>
                <p>Notify when a deposit or balance fails at the provider.</p>
              </div>
              <Toggle
                checked={draft.notifyFailedPayment}
                onChange={(next) => update('notifyFailedPayment', next)}
                label="Failed payment alerts"
              />
            </div>
          </SectionCard>

          <SectionCard title="Service areas" meta="Comma-separated · used by matching">
            <Field label="Live areas" hint="Changes apply to this local operations session">
              <textarea
                className="text-input textarea"
                rows={3}
                value={draft.serviceAreas}
                onChange={(event) => update('serviceAreas', event.target.value)}
              />
            </Field>
            <div className="area-tags">
              {areas.map((area) => <span className="area-tag" key={area}>{area}</span>)}
            </div>
          </SectionCard>
        </div>

        <aside className="settings-side">
          <SectionCard title="Signed-in admin" meta="Local operator profile">
            <div className="admin-card">
              <span className="admin-avatar">MK</span>
              <div>
                <strong>Moses K.</strong>
                <small>Operations lead</small>
                <small>moses@gabfix.ug</small>
              </div>
            </div>
            <div className="permission-list">
              <div><Icon name="check" size={14} /> Manage bookings and cleaners</div>
              <div><Icon name="check" size={14} /> View payments and cash</div>
              <div><Icon name="check" size={14} /> Export reports</div>
              <div><Icon name="close" size={14} /> Change admin roles</div>
            </div>
          </SectionCard>

          <div className="source-card">
            <span className="source-icon"><Icon name="alert" size={18} /></span>
            <div>
              <strong>Static operations build</strong>
              <p>
                Settings persist for this browser session only. The admin auth and operations API
                are still open items, so no production write is claimed.
              </p>
            </div>
          </div>

          {saved && !dirty ? (
            <div className="save-state" role="status">
              <Icon name="check" size={16} /> Settings saved for this session.
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
