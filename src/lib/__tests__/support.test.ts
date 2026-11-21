import { buildSupport, formatUgDisplay, toUgE164 } from '@/lib/support';

describe('toUgE164', () => {
  it('normalises common Ugandan mobile formats', () => {
    expect(toUgE164('0752777774')).toBe('+256752777774');
    expect(toUgE164('+256 752 777 774')).toBe('+256752777774');
    expect(toUgE164('256752777774')).toBe('+256752777774');
    expect(toUgE164('0703195401')).toBe('+256703195401');
  });

  it('rejects invalid numbers', () => {
    expect(toUgE164('0793 19401')).toBeNull();
    expect(toUgE164('07527777749')).toBeNull();
    expect(toUgE164('0414123456')).toBeNull();
    expect(toUgE164('')).toBeNull();
  });
});

describe('formatUgDisplay', () => {
  it('formats an E.164 number for display', () => {
    expect(formatUgDisplay('+256752777774')).toBe('+256 752 777 774');
  });
});

describe('buildSupport', () => {
  it('builds links and hides invalid channels', () => {
    const support = buildSupport({
      callNumber: '0703195401',
      whatsappNumber: '0752777774',
      email: 'gabfixuganda@gmail.com',
      hours: 'Open 7 days · 7:00 am – 9:00 pm',
    });

    expect(support.phone?.href).toBe('tel:+256703195401');
    expect(support.whatsapp?.url()).toBe('https://wa.me/256752777774');
    expect(support.whatsapp?.url('Hello there')).toBe(
      'https://wa.me/256752777774?text=Hello%20there',
    );
    expect(support.mailto('Help')).toBe('mailto:gabfixuganda@gmail.com?subject=Help');
  });

  it('returns null for invalid phone channels', () => {
    const support = buildSupport({
      callNumber: '0793 19401',
      whatsappNumber: 'bad',
      email: 'gabfixuganda@gmail.com',
      hours: 'Always',
    });

    expect(support.phone).toBeNull();
    expect(support.whatsapp).toBeNull();
    expect(support.email).toBe('gabfixuganda@gmail.com');
  });
});
