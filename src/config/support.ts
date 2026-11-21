import { buildSupport } from '@/lib/support';
import { supportContact } from './support-contact';

export { supportContact };

/**
 * The single source of truth for customer support contact details.
 * Edit values in support-contact.ts only.
 */
export const support = buildSupport(supportContact);
