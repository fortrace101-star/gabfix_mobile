// Pure TypeScript: no React Native imports, so the admin app can use it too.
declare const __DEV__: boolean | undefined;

const UG_MOBILE = /^(?:\+?256|0)?(7\d{8})$/;

/** '0752777774' | '+256 752 777 774' | '256752777774' -> '+256752777774'; otherwise null. */
export const toUgE164 = (raw: string): string | null => {
  const digits = raw.replace(/[\s()-]/g, '');
  const match = UG_MOBILE.exec(digits);
  return match ? `+256${match[1]}` : null;
};

/** '+256752777774' -> '+256 752 777 774' */
export const formatUgDisplay = (e164: string): string =>
  `${e164.slice(0, 4)} ${e164.slice(4, 7)} ${e164.slice(7, 10)} ${e164.slice(10)}`;

export type SupportInput = {
  callNumber: string;
  whatsappNumber: string;
  email: string;
  hours: string;
};

export type Support = {
  /** null when the supplied call number is not a valid Ugandan mobile number. */
  phone: { e164: string; display: string; href: string } | null;
  whatsapp: { e164: string; display: string; url: (message?: string) => string } | null;
  email: string;
  mailto: (subject?: string, body?: string) => string;
  hours: string;
};

export function buildSupport(input: SupportInput): Support {
  const call = toUgE164(input.callNumber);
  const wa = toUgE164(input.whatsappNumber);

  if (typeof __DEV__ !== 'undefined' && __DEV__ && (!call || !wa)) {
    // Fail loudly in development, fail closed (hide the channel) in production.
    console.warn(
      `[support] Invalid number(s): call=${input.callNumber} (${call ? 'ok' : 'INVALID'}), ` +
        `whatsapp=${input.whatsappNumber} (${wa ? 'ok' : 'INVALID'})`,
    );
  }

  return {
    phone: call ? { e164: call, display: formatUgDisplay(call), href: `tel:${call}` } : null,
    whatsapp: wa
      ? {
          e164: wa,
          display: formatUgDisplay(wa),
          url: (message) =>
            `https://wa.me/${wa.slice(1)}${message ? `?text=${encodeURIComponent(message)}` : ''}`,
        }
      : null,
    email: input.email,
    mailto: (subject, body) => {
      const query = [
        subject ? `subject=${encodeURIComponent(subject)}` : '',
        body ? `body=${encodeURIComponent(body)}` : '',
      ]
        .filter(Boolean)
        .join('&');
      return `mailto:${input.email}${query ? `?${query}` : ''}`;
    },
    hours: input.hours,
  };
}
