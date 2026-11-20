import { useState } from 'react';
import type { Booking, Cleaner } from '../types';
import { Icon } from './Icon';
import { Avatar, Button, Modal, StatusChip } from './ui';

export function AssignCleanerDialog({
  booking,
  cleaners,
  onClose,
  onAssign,
}: {
  booking: Booking;
  cleaners: Cleaner[];
  onClose: () => void;
  onAssign: (bookingId: string, cleanerId: string) => void;
}) {
  const [selected, setSelected] = useState(booking.cleanerId ?? '');

  return (
    <Modal
      open
      title="Assign a cleaner"
      description={`${booking.id} · ${booking.service} · ${booking.area} · ${booking.time}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            icon="check"
            disabled={!selected}
            onClick={() => {
              onAssign(booking.id, selected);
              onClose();
            }}
          >
            Assign cleaner
          </Button>
        </>
      }
    >
      {booking.scope || booking.media?.length ? (
        <div className="booking-scope-block" style={{ marginBottom: 16, display: 'grid', gap: 8 }}>
          {booking.scope ? (
            <div className="scope-facts" style={{ display: 'grid', gap: 4 }}>
              <strong style={{ fontSize: 13 }}>Job scope</strong>
              <span style={{ fontSize: 13 }}>{booking.scope.summary}</span>
              {booking.scope.facts?.length ? (
                <div style={{ display: 'grid', gap: 2, marginTop: 4 }}>
                  {booking.scope.facts.map((fact) => (
                    <span key={fact.label} style={{ fontSize: 12, color: 'var(--text-muted, #667085)' }}>
                      <strong style={{ color: 'inherit' }}>{fact.label}:</strong> {fact.value}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {booking.media?.length ? (
            <div className="scope-media" style={{ display: 'grid', gap: 6 }}>
              <strong style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="camera" size={14} /> Media ({booking.media.length})
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {booking.media.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      background: 'var(--surface-muted, #F2F4F1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 2,
                      fontSize: 10,
                      color: 'var(--text-muted, #667085)',
                      textAlign: 'center',
                      padding: 4,
                    }}
                    title={item.label ?? item.kind}>
                    <Icon name={item.kind === 'video' ? 'camera' : 'image'} size={16} />
                    <span>{item.kind === 'video' && item.durationSec ? `${item.durationSec}s` : item.kind}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="cleaner-picker" role="radiogroup" aria-label="Available cleaners">
        {cleaners.map((cleaner) => (
          <button
            type="button"
            role="radio"
            aria-checked={selected === cleaner.id}
            key={cleaner.id}
            className={`cleaner-option${selected === cleaner.id ? ' selected' : ''}`}
            onClick={() => setSelected(cleaner.id)}
            disabled={!cleaner.available && booking.cleanerId !== cleaner.id}
          >
            <Avatar name={cleaner.name} tone={cleaner.tone} />
            <span className="cleaner-option-main">
              <strong>{cleaner.name}</strong>
              <span>
                {cleaner.area} · {cleaner.rating.toFixed(1)} rating
              </span>
            </span>
            <StatusChip label={cleaner.available ? 'Available' : 'Unavailable'} />
          </button>
        ))}
      </div>
    </Modal>
  );
}
