import { receiptFileName } from '@/lib/receipt-export';

describe('receiptFileName', () => {
  it('names the PDF after the booking', () => {
    expect(receiptFileName('GBX-12345')).toBe('Gabfix-Receipt-GBX-12345.pdf');
  });

  it('replaces characters a file system would reject', () => {
    expect(receiptFileName('GBX/123 45')).toBe('Gabfix-Receipt-GBX-123-45.pdf');
  });
});
