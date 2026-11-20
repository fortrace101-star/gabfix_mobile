import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import {
  Button,
  Field,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusChip,
} from '../components/ui';
import { rateCardSource } from '../data';
import { compactUgx, ugx } from '../lib/format';
import type { RateCard } from '../types';
import { services as serviceCatalogue } from '../../../src/config/services';

const frequencyLabels: Record<string, string> = {
  once: 'One-off',
  weekly: 'Weekly',
  severalPerWeek: 'Several per week',
  monthly: 'Monthly',
};

const addOnLabels: Record<string, string> = {
  inside_fridge: 'Inside fridge',
  inside_oven: 'Inside oven',
  laundry: 'Laundry',
  balcony: 'Balcony',
};

export function ServicesPage({
  rateCard,
  onSave,
}: {
  rateCard: RateCard;
  onSave: (next: RateCard) => void;
}) {
  const [draft, setDraft] = useState<RateCard>(() => structuredClone(rateCard));
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(rateCard);
  const invalid =
    draft.minimumHours >= draft.maximumHours ||
    draft.vatRate < 0 ||
    draft.vatRate > 100 ||
    draft.hourlyRates.some((tier) => tier.rate <= 0 || tier.minHours <= 0) ||
    Object.values(draft.frequencyDiscounts).some((value) => value < 0 || value > 100);

  const lowestRate = useMemo(
    () => Math.min(...draft.hourlyRates.map((tier) => tier.rate)),
    [draft.hourlyRates],
  );
  const addOnCount = Object.keys(draft.addOns).length;

  const updateTier = (index: number, key: 'minHours' | 'rate', value: number) => {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      hourlyRates: current.hourlyRates.map((tier, position) =>
        position === index ? { ...tier, [key]: value } : tier,
      ),
    }));
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Catalogue"
        title="Services & pricing"
        subtitle="The rate card the mobile app prices every booking from."
        actions={
          <>
            <Button
              icon="refresh"
              disabled={!dirty}
              onClick={() => {
                setDraft(structuredClone(rateCard));
                setSaved(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              icon="check"
              disabled={!dirty || invalid}
              onClick={() => {
                onSave(draft);
                setSaved(true);
              }}
            >
              Save changes
            </Button>
          </>
        }
      />

      <div className="kpis">
        <KpiCard
          label="Lowest hourly rate"
          value={ugx(lowestRate)}
          detail="Per cleaner · before discounts"
          icon="services"
        />
        <KpiCard
          label="VAT"
          value={`${Math.round(draft.vatRate * 100)}%`}
          detail="Applied after discounts"
          icon="payments"
          tone="blue"
        />
        <KpiCard
          label="Add-ons"
          value={String(addOnCount)}
          detail={`${draft.addOnMinutes} min added each`}
          icon="plus"
          tone="yellow"
        />
        <KpiCard
          label="Services live"
          value={String(serviceCatalogue.length)}
          detail="Bundled mobile catalogue"
          icon="services"
          tone="rose"
        />
      </div>

      <div className="pricing-layout">
        <div className="pricing-main">
          <SectionCard
            title="Hourly rate card"
            meta="Per cleaner, per hour · longer bookings cost less"
          >
            <div className="rate-table" role="table" aria-label="Hourly rates">
              <div className="rate-row rate-head" role="row">
                <span>Booking length</span>
                <span>Minimum hours</span>
                <span>Rate per hour</span>
                <span>4-hour example</span>
              </div>
              {draft.hourlyRates.map((tier, index) => (
                <div className="rate-row" role="row" key={`${tier.minHours}-${index}`}>
                  <strong>{tier.minHours}+ hours</strong>
                  <label className="money-input compact">
                    <input
                      type="number"
                      min="1"
                      value={tier.minHours}
                      onChange={(event) => updateTier(index, 'minHours', Number(event.target.value))}
                      aria-label={`Tier ${index + 1} minimum hours`}
                    />
                  </label>
                  <label className="money-input">
                    <span>UGX</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={tier.rate}
                      onChange={(event) => updateTier(index, 'rate', Number(event.target.value))}
                      aria-label={`Tier ${index + 1} hourly rate`}
                    />
                  </label>
                  <span className="rate-example">{ugx(tier.rate * 4)}</span>
                </div>
              ))}
            </div>
            <p className="field-note">
              <Icon name="alert" size={14} />
              The mobile app matches the first tier whose minimum is met. Keep tiers ordered from
              longest to shortest.
            </p>
          </SectionCard>

          <SectionCard title="Booking rules" meta="Guardrails applied before a price is shown">
            <div className="form-grid">
              <Field label="Materials per hour" hint="Charged per cleaner when materials are selected">
                <span className="money-input">
                  <span>UGX</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={draft.materialsPerHour}
                    onChange={(event) => {
                      setSaved(false);
                      setDraft({ ...draft, materialsPerHour: Number(event.target.value) });
                    }}
                    aria-label="Materials per hour"
                  />
                </span>
              </Field>
              <Field label="Minimum hours" hint="Shortest bookable job">
                <input
                  className="text-input"
                  type="number"
                  min="1"
                  value={draft.minimumHours}
                  onChange={(event) => {
                    setSaved(false);
                    setDraft({ ...draft, minimumHours: Number(event.target.value) });
                  }}
                />
              </Field>
              <Field label="Maximum hours" hint="The app asks for a second cleaner above this">
                <input
                  className="text-input"
                  type="number"
                  min="2"
                  value={draft.maximumHours}
                  onChange={(event) => {
                    setSaved(false);
                    setDraft({ ...draft, maximumHours: Number(event.target.value) });
                  }}
                />
              </Field>
              <Field label="Minutes per add-on" hint="Added to the scheduled duration">
                <input
                  className="text-input"
                  type="number"
                  min="0"
                  step="15"
                  value={draft.addOnMinutes}
                  onChange={(event) => {
                    setSaved(false);
                    setDraft({ ...draft, addOnMinutes: Number(event.target.value) });
                  }}
                />
              </Field>
              <Field label="VAT rate (%)" hint="Charged on the discounted subtotal">
                <input
                  className="text-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={Math.round(draft.vatRate * 1000) / 10}
                  onChange={(event) => {
                    setSaved(false);
                    setDraft({ ...draft, vatRate: Number(event.target.value) / 100 });
                  }}
                />
              </Field>
            </div>
            {invalid ? (
              <p className="form-error">
                <Icon name="alert" size={14} />
                Check the rate values: hours must be positive, minimum must be below maximum and
                percentages must stay between 0 and 100.
              </p>
            ) : null}
          </SectionCard>

          <div className="pricing-two-col">
            <SectionCard title="Frequency discounts" meta="Applied to labour and materials">
              <div className="stack-list">
                {Object.entries(draft.frequencyDiscounts).map(([key, value]) => (
                  <label className="inline-field" key={key}>
                    <span>{frequencyLabels[key] ?? key}</span>
                    <span className="percent-input">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={Math.round(value * 1000) / 10}
                        onChange={(event) => {
                          setSaved(false);
                          setDraft({
                            ...draft,
                            frequencyDiscounts: {
                              ...draft.frequencyDiscounts,
                              [key]: Number(event.target.value) / 100,
                            },
                          });
                        }}
                        aria-label={`${frequencyLabels[key] ?? key} discount percent`}
                      />
                      <span>%</span>
                    </span>
                  </label>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Add-on prices" meta="Charged once per booking">
              <div className="stack-list">
                {Object.entries(draft.addOns).map(([id, value]) => (
                  <label className="inline-field" key={id}>
                    <span>{addOnLabels[id] ?? id}</span>
                    <span className="money-input compact">
                      <span>UGX</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={value}
                        onChange={(event) => {
                          setSaved(false);
                          setDraft({
                            ...draft,
                            addOns: { ...draft.addOns, [id]: Number(event.target.value) },
                          });
                        }}
                        aria-label={`${addOnLabels[id] ?? id} price`}
                      />
                    </span>
                  </label>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        <aside className="pricing-side">
          <SectionCard title="Live catalogue" meta="From the mobile services config">
            <div className="service-list">
              {serviceCatalogue.map((service) => (
                <div className="service-row" key={service.slug}>
                  <span>
                    <strong>{service.name}</strong>
                    <small>{service.tagline}</small>
                  </span>
                  <span className="service-meta">
                    <StatusChip label="Live" tone="success" />
                    <small>{compactUgx(lowestRate)}/hr</small>
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="source-card">
            <span className="source-icon"><Icon name="external" size={18} /></span>
            <div>
              <strong>Bound to {rateCardSource}</strong>
              <p>
                This editor starts from the same rate card as the mobile app. Saving updates the
                session only until the pricing API is connected.
              </p>
            </div>
          </div>

          {saved && !dirty ? (
            <div className="save-state" role="status">
              <Icon name="check" size={16} /> Rate card saved for this session.
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
