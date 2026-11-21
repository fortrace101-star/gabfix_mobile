import { validateTicket } from '@/store/tickets';

/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const base = { category: 'general' as const, bookingId: undefined, screenshots: [] };

describe('validateTicket (S1 16.3)', () => {
  it('accepts a subject of exactly 4 characters and a message of 10', () => {
    expect(validateTicket({ ...base, subject: 'Door', message: 'Ten chars!' })).toEqual({});
  });

  it('rejects a subject shorter than 4 characters', () => {
    expect(validateTicket({ ...base, subject: 'Hi', message: 'A long enough message' })).toEqual({
      subject: 'Subject must be at least 4 characters.',
    });
  });

  it('rejects a subject longer than 80 characters', () => {
    expect(
      validateTicket({ ...base, subject: 'a'.repeat(81), message: 'A long enough message' }),
    ).toEqual({ subject: 'Subject must be 80 characters or fewer.' });
  });

  it('rejects a message shorter than 10 characters', () => {
    expect(validateTicket({ ...base, subject: 'Door lock', message: 'Too short' })).toEqual({
      message: 'Message must be at least 10 characters.',
    });
  });

  it('rejects a message longer than 1,000 characters', () => {
    expect(
      validateTicket({ ...base, subject: 'Door lock', message: 'a'.repeat(1_001) }),
    ).toEqual({ message: 'Message must be 1,000 characters or fewer.' });
  });

  it('ignores surrounding whitespace when measuring lengths', () => {
    expect(validateTicket({ ...base, subject: '  Door  ', message: '   short   ' })).toEqual({
      message: 'Message must be at least 10 characters.',
    });
  });

  it('returns both messages when both fields fail', () => {
    const errors = validateTicket({ ...base, subject: '', message: '' });
    expect(Object.keys(errors).sort()).toEqual(['message', 'subject']);
  });
});
