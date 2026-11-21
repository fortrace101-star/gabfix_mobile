import { dateLong, hoursLabel, maskPhone, phoneUG, time12, titleCase, ugx } from '@/utils/format';

describe('format utilities', () => {
  it('formats shillings without decimals and with thousands separators', () => {
    expect(ugx(45000)).toBe('UGX 45,000');
    expect(ugx(0)).toBe('UGX 0');
    expect(ugx(1234.56)).toBe('UGX 1,235');
    expect(ugx(-2500)).toBe('UGX -2,500');
  });

  it('normalises Ugandan numbers to +256', () => {
    expect(phoneUG('0772777773')).toBe('+256 772 777 773');
    expect(phoneUG('256772777773')).toBe('+256 772 777 773');
    expect(phoneUG('772 777 773')).toBe('+256 772 777 773');
  });

  it('masks the middle of a phone number for OTP copy', () => {
    expect(maskPhone('0772777773')).toBe('+256 772 ••• 773');
    // Too short to mask: falls back to the plain formatted number.
    expect(maskPhone('0772')).toBe('+256 772');
  });

  it('formats dates and times in Africa/Kampala', () => {
    const date = new Date('2026-11-21T12:00:00Z');
    expect(dateLong(date)).toBe('Sat, 21 Nov 2026');
    expect(time12(date)).toBe('3:00 pm');
  });

  it('labels hours with at most one decimal', () => {
    expect(hoursLabel(2)).toBe('2 h');
    expect(hoursLabel(2.5)).toBe('2.5 h');
    expect(hoursLabel(2.25)).toBe('2.3 h');
  });

  it('capitalises the first letter only', () => {
    expect(titleCase('android')).toBe('Android');
    expect(titleCase('iOS')).toBe('IOS');
    expect(titleCase('')).toBe('');
  });
});
