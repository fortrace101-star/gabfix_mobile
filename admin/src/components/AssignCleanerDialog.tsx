import { useState } from 'react';
import type { Booking, Cleaner } from '../types';
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
