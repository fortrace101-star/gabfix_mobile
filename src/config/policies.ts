/**
 * P23 policy copy. Product and legal still owe the final Terms, Privacy and
 * Payment/refund text (Gabfix_UI_Progress.md, Open item 10); these summaries follow the
 * behaviour implemented in the app so the screens are usable and reviewable.
 */
export type PolicySection = {
  heading: string;
  body: string[];
};

export type PolicyDoc = {
  slug: PolicySlug;
  title: string;
  updated: string;
  summary: string[];
  sections: PolicySection[];
};

export type PolicySlug = 'terms' | 'privacy' | 'payments-refunds';

export const policies: Record<PolicySlug, PolicyDoc> = {
  terms: {
    slug: 'terms',
    title: 'Terms and conditions',
    updated: '1 November 2026',
    summary: [
      'Gabfix connects you with vetted cleaners in the areas we serve.',
      'Prices are shown before you confirm, including VAT and any extras.',
      'You can change or cancel free of charge up to 24 hours before the visit.',
      'Cash is paid to your cleaner after the service, never at booking.',
      'Treat your cleaner with respect and give safe access to the property.',
    ],
    sections: [
      {
        heading: 'Using Gabfix',
        body: [
          'You need an account with a valid phone number to book. The details you give us must be accurate so your cleaner can find you and we can reach you about the visit.',
          'You are responsible for the property you ask us to clean and for making sure the person who lets the cleaner in has authority to do so.',
        ],
      },
      {
        heading: 'Bookings and pricing',
        body: [
          'The price shown on the review screen is the price for the choices you made: service, cleaners, hours, materials, extras, frequency discount and any promo code, plus 18% VAT.',
          'If the property is larger or dirtier than described, or you ask for work outside the booking, the cleaner may need more time. We will contact you before any additional charge is made.',
        ],
      },
      {
        heading: 'Changes and cancellations',
        body: [
          'You can reschedule or cancel from the booking details screen. More than 24 hours before the visit, any payment is refunded in full to the original method.',
          'Within 24 hours, the cancellation fee is the deposit amount. If nothing was paid, the fee is added to your account and must be settled before your next booking.',
        ],
      },
      {
        heading: 'Your cleaner',
        body: [
          'We aim to keep the same cleaner on recurring plans. If that cleaner is unavailable, we will arrange the best available match and tell you before the visit.',
          'Please provide a safe working environment, including access to water and electricity where the service needs it.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          'Questions about these terms can be sent through the support options on your booking. We may update these terms and will show the new version in the app.',
        ],
      },
    ],
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy policy',
    updated: '1 November 2026',
    summary: [
      'We collect the details needed to create your account and deliver the service.',
      'Your address and contact details are shared with your cleaner only after you book.',
      'Location is used to fill your address when you ask us to use it.',
      'We keep payment details with the payment provider; we do not store full card numbers.',
      'You can ask us for a copy of your data or ask us to delete your account.',
    ],
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Account details such as your name, phone number and email address. Booking details such as the service, date and time, address, access notes and the contact person.',
          'Payment information needed to take a deposit or balance. Card numbers are handled by our payment provider; Gabfix keeps only the method and a reference.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To create and manage your account, confirm bookings, assign a cleaner, take payments, process refunds and provide support.',
          'To improve the service, for example by understanding which services and areas are busiest. We do not sell your personal data.',
        ],
      },
      {
        heading: 'Sharing',
        body: [
          'Your cleaner receives the address, access notes and contact number for the visit. Payment and messaging providers receive only what they need to perform their service.',
          'We may disclose information where the law requires it or to protect the safety of customers and cleaners.',
        ],
      },
      {
        heading: 'Retention and your rights',
        body: [
          'We keep booking and payment records for as long as needed for accounting, dispute resolution and legal obligations.',
          'You can ask to see, correct or delete your personal data. Some records may need to be kept for legal reasons even after your account is closed.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          'Privacy questions can be sent through the support options on your booking. We will respond within a reasonable period.',
        ],
      },
    ],
  },
  'payments-refunds': {
    slug: 'payments-refunds',
    title: 'Payment and refund policy',
    updated: '1 November 2026',
    summary: [
      'Pay in full, pay a deposit, or pay after the service.',
      'The minimum deposit is 30% of the total or UGX 20,000, whichever is greater.',
      'MTN Mobile Money, Airtel Money and Visa can be used at booking.',
      'Cash is collected by your cleaner after the service.',
      'Refunds go back to the original method within 3 to 5 working days.',
    ],
    sections: [
      {
        heading: 'Payment plans',
        body: [
          'Pay in full: the whole total is collected when you confirm. Deposit: you pay at least 30% (or UGX 20,000, whichever is greater) now and the balance after the service. Pay after service: nothing is collected at booking; you pay the full total afterwards.',
          'VAT at 18% is included in the total shown before you confirm.',
        ],
      },
      {
        heading: 'Methods',
        body: [
          'MTN Mobile Money and Airtel Money use the number you provide and may ask you to approve the charge on your phone. Visa payments are completed on the provider’s secure page.',
          'Cash cannot be used for a payment due at booking. It can be used for the balance after the service and is confirmed by the cleaner.',
        ],
      },
      {
        heading: 'Refunds and cancellation fees',
        body: [
          'Cancel more than 24 hours before the visit and any amount paid is refunded in full to the original method, normally within 3 to 5 working days.',
          'Cancel within 24 hours and the deposit amount is kept as the late fee. Any remaining payment is refunded. If you had not paid anything, the fee is added to your account and must be cleared before your next booking.',
        ],
      },
      {
        heading: 'Failed or disputed payments',
        body: [
          'If a charge fails, the booking is not confirmed until payment succeeds. If you believe a charge is wrong, contact support with the booking ID and payment reference before raising a dispute with your provider.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          'For a receipt, refund status or payment question, open the booking and use the receipt or support actions.',
        ],
      },
    ],
  },
};

export const policyBySlug = (slug?: string): PolicyDoc =>
  slug === 'privacy' || slug === 'payments-refunds' ? policies[slug] : policies.terms;
