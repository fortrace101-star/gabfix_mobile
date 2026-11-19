import {
  CalendarDays,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Tag,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';

export type HelpTopic = {
  slug: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
};

export type FaqItem = {
  id: string;
  topic: string;
  question: string;
  answer: string;
  top?: boolean;
};

/** Provisional support details until the contact centre numbers are confirmed. */
export const support = {
  phoneDisplay: '+256 700 000 000',
  phoneHref: 'tel:+256700000000',
  whatsappUrl: 'https://wa.me/256700000000',
  email: 'support@gabfix.com',
  emailHref: 'mailto:support@gabfix.com',
  hours: 'Open 7 days · 7:00 am – 9:00 pm',
} as const;

export const helpTopics: readonly HelpTopic[] = [
  {
    slug: 'booking',
    label: 'Booking',
    blurb: 'Times, preparation and changes',
    icon: CalendarDays,
  },
  {
    slug: 'pricing',
    label: 'Pricing',
    blurb: 'Rates, VAT and totals',
    icon: Tag,
  },
  {
    slug: 'add-ons',
    label: 'Add-ons',
    blurb: 'Extras and special requests',
    icon: Sparkles,
  },
  {
    slug: 'payments',
    label: 'Payments',
    blurb: 'Methods, deposits and receipts',
    icon: CreditCard,
  },
  {
    slug: 'cancellation',
    label: 'Cancellation',
    blurb: 'Changes, refunds and late fees',
    icon: XCircle,
  },
  {
    slug: 'safety',
    label: 'Safety',
    blurb: 'Vetting, products and access',
    icon: ShieldCheck,
  },
];

export const faqs: readonly FaqItem[] = [
  {
    id: 'booking-how',
    topic: 'booking',
    top: true,
    question: 'How do I book a clean?',
    answer:
      'Choose a service, add any extras, then pick a date, time and address. Review the total and payment option before you confirm. Your booking appears in the Bookings tab as soon as it is confirmed.',
  },
  {
    id: 'booking-prep',
    topic: 'booking',
    top: true,
    question: 'What should I do before the cleaner arrives?',
    answer:
      'Clear personal items from the areas being cleaned, secure pets, and make sure the cleaner can access the property. Add gate, parking or access notes when you enter your address so the team knows what to expect.',
  },
  {
    id: 'booking-lead',
    topic: 'booking',
    question: 'How far ahead can I book?',
    answer:
      'You can book any available slot in the next 30 days. Same-day slots start at least three hours from now, and fully booked times are shown as unavailable.',
  },
  {
    id: 'pricing-calculate',
    topic: 'pricing',
    top: true,
    question: 'How is my price calculated?',
    answer:
      'The total is based on the service rate, hours and number of cleaners, plus any extras and materials. Frequency and promo discounts are applied where eligible, and the final total includes VAT. You see the full breakdown before you pay.',
  },
  {
    id: 'pricing-vat',
    topic: 'pricing',
    question: 'Do the prices include VAT?',
    answer:
      'Yes. The review screen shows the service, extras, discounts and VAT as separate lines, and the total at the bottom is the amount you will be asked to pay.',
  },
  {
    id: 'addons-list',
    topic: 'add-ons',
    question: 'What extras can I add?',
    answer:
      'The Add-ons step lists the extras available for the service you chose, such as inside the oven, inside the fridge, laundry or balcony cleaning. Each extra shows the time it adds before you select it.',
  },
  {
    id: 'addons-change',
    topic: 'add-ons',
    question: 'Can I change add-ons after booking?',
    answer:
      'Contact support with your booking ID and the extras you need. In-app editing after confirmation is still being built, so the support team will update the booking and confirm any price change with you.',
  },
  {
    id: 'payments-methods',
    topic: 'payments',
    top: true,
    question: 'Which payment methods can I use?',
    answer:
      'You can pay with MTN MoMo, Airtel Money, a Visa card or cash. Choose to pay in full, pay a 30% deposit, or pay after the service. The balance and payment status are shown on the booking.',
  },
  {
    id: 'payments-when',
    topic: 'payments',
    question: 'When is my payment taken?',
    answer:
      'A pay-in-full or deposit payment is authorised when you confirm the booking. Any balance is due after the clean is completed. Cash is paid directly to the cleaner, who confirms receipt in their app.',
  },
  {
    id: 'cancellation-window',
    topic: 'cancellation',
    top: true,
    question: 'Can I reschedule or cancel my booking?',
    answer:
      'Yes. Open the booking and choose Reschedule or Cancel booking. Changes made at least 24 hours before the start time are free. Changes inside 24 hours may carry a late fee, which is shown before you confirm.',
  },
  {
    id: 'cancellation-refund',
    topic: 'cancellation',
    question: 'How long does a refund take?',
    answer:
      'Eligible refunds go back to the original payment method. The booking details show the refund amount once a cancellation is confirmed, and your provider’s normal processing time applies after that.',
  },
  {
    id: 'safety-vetted',
    topic: 'safety',
    question: 'Are Gabfix cleaners vetted?',
    answer:
      'Cleaners complete identity and background checks before they are assigned work. You will see the assigned cleaner’s details on the booking once assignment is available in the app.',
  },
  {
    id: 'safety-products',
    topic: 'safety',
    question: 'What if someone has allergies or pets?',
    answer:
      'Add the details to your booking notes or tell support before the visit. The cleaner will confirm which products they plan to use and can avoid strong fragrances where possible.',
  },
];

export const topFaqs = faqs.filter((faq) => faq.top).slice(0, 5);

export const helpTopicBySlug = (slug: string): HelpTopic | undefined =>
  helpTopics.find((topic) => topic.slug === slug);

export const faqsForTopic = (topic: string): readonly FaqItem[] =>
  faqs.filter((faq) => faq.topic === topic);

export const searchFaqs = (query: string): readonly FaqItem[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return faqs.filter((faq) => {
    const topic = helpTopicBySlug(faq.topic)?.label ?? '';
    return `${faq.question} ${faq.answer} ${topic}`.toLowerCase().includes(needle);
  });
};
