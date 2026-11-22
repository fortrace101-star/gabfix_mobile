import { services, type Service } from './services';

/**
 * Editorial copy for the P7 service landing page. Dummy content until the catalogue
 * service returns it (`GET /services/{slug}`, Open item 18).
 */
export type FaqItem = { question: string; answer: string };

export type ServiceContent = {
  slug: string;
  /** Service photography URL from `GET /services/{slug}`; falls back to the bundled photo. */
  heroImage?: string;
  /** Remote catalogue/card image from `GET /services/{slug}`. */
  cardImage?: string;
  /** Area-specific image override from an area-scoped content request. */
  intro: string;
  includes: string[];
  excludes: string[];
  faqs: FaqItem[];
  rating: number;
  reviewCount: number;
};

const sharedFaqs: FaqItem[] = [
  {
    question: 'Do I need to buy cleaning products?',
    answer:
      'No. Choose materials at checkout and your cleaner brings mops, cloths and products for every cleaner, every hour.',
  },
  {
    question: 'Can I change or cancel my booking?',
    answer: 'Yes, free of charge up to 24 hours before the start time. Later changes may carry a fee.',
  },
];

export const serviceContent: Record<string, ServiceContent> = {
  'home-clean': {
    slug: 'home-clean',
    intro:
      'A regular clean for the rooms you use every day: floors, surfaces, bathrooms, kitchens and the areas guests see first.',
    includes: [
      'Floors swept and mopped',
      'Surfaces dusted and wiped',
      'Bathrooms scrubbed and disinfected',
      'Kitchen counters and sink',
      'Beds made and bins emptied',
      'Mirrors and glass touched up',
    ],
    excludes: ['Inside cupboards and drawers', 'Inside the fridge or oven', 'Laundry and ironing'],
    faqs: [
      {
        question: 'What should I do before the cleaner arrives?',
        answer:
          'Put away valuables and personal items, and make sure the cleaner can reach the rooms you booked.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 312,
  },
  'deep-clean': {
    slug: 'deep-clean',
    intro:
      'A top-to-bottom reset for a home that needs more than a surface clean, including the corners a weekly clean skips.',
    includes: [
      'Everything in a regular clean',
      'Skirting boards and door frames',
      'Inside the fridge and oven',
      'Grout and tile scrubbing',
      'Behind and under furniture',
      'Window sills and vents',
    ],
    excludes: ['High-rise exterior windows', 'Mould remediation', 'Pest control'],
    faqs: [
      {
        question: 'How long does a deep clean take?',
        answer:
          'Most homes need four to eight hours with one or two cleaners. Pick the hours at checkout and add cleaners if needed.',
      },
      ...sharedFaqs,
    ],
    rating: 4.9,
    reviewCount: 184,
  },
  'office-clean': {
    slug: 'office-clean',
    intro:
      'Desks, meeting rooms and shared kitchens cleaned outside working hours, with a team that knows an office should look ready by 9.',
    includes: [
      'Desks and shared surfaces',
      'Meeting rooms and reception',
      'Kitchen and coffee stations',
      'Bathrooms restocked and cleaned',
      'Floors vacuumed and mopped',
      'Bins emptied and liners replaced',
    ],
    excludes: ['IT equipment and cabling', 'Exterior windows', 'Waste disposal off site'],
    faqs: [
      {
        question: 'Can you clean after office hours?',
        answer:
          'Yes. Choose a start time after your team leaves and give the security desk the cleaner’s name.',
      },
      ...sharedFaqs,
    ],
    rating: 4.7,
    reviewCount: 96,
  },
  'move-out-clean': {
    slug: 'move-out-clean',
    intro:
      'Handover-ready cleaning for the day you return the keys, so the landlord sees the property at its best.',
    includes: [
      'Everything in a deep clean',
      'Inside all cupboards and wardrobes',
      'Appliance interiors',
      'Balcony and compound sweep',
      'Limescale removal',
      'Final walkthrough checklist',
    ],
    excludes: ['Painting and repairs', 'Furniture removal', 'Garden work'],
    faqs: [
      {
        question: 'Will this pass my landlord’s inspection?',
        answer:
          'It covers the usual handover checklist. Share any specific requirements in the booking notes and we will confirm before the visit.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 141,
  },
  'post-construction-clean': {
    slug: 'post-construction-clean',
    intro:
      'The clean after the builders leave: cement film, paint spots and fine dust lifted from every room before you move in.',
    includes: [
      'Construction dust from walls, ceilings and vents',
      'Cement and grout haze off tiles and glass',
      'Paint spots and adhesive removed',
      'Windows, frames and tracks',
      'Debris and packaging gathered',
      'Final wipe-down of all surfaces',
    ],
    excludes: ['Rubbish removal off site', 'Repairs to damaged surfaces', 'Exterior scaffolding'],
    faqs: [
      {
        question: 'Can you clean before the final inspection?',
        answer:
          'Yes. Book for the day the trades finish so there is time to walk the site with you and touch up anything the inspector flags.',
      },
      ...sharedFaqs,
    ],
    rating: 4.7,
    reviewCount: 58,
  },
  'carpet-clean': {
    slug: 'carpet-clean',
    intro:
      'Hot-water extraction that pulls out traffic marks, pet accidents and the dust a vacuum leaves behind, with a fast-drying finish.',
    includes: [
      'Pre-vacuum and spot treatment',
      'Hot-water extraction',
      'Pet and odour treatment',
      'Edge and stair detailing',
      'Speed-dry pass',
    ],
    excludes: ['Carpet repair or restretching', 'Furniture moving between floors', 'Mould remediation'],
    faqs: [
      {
        question: 'How long until the carpet is dry?',
        answer:
          'Most rooms are walkable in two to four hours and fully dry overnight. Keep windows open and fans running where you can.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 132,
  },
  'sofa-clean': {
    slug: 'sofa-clean',
    intro:
      'Fabric or leather sofas refreshed in place, with the cushions, seams and armrests that collect the most wear and grime.',
    includes: [
      'Fabric-safe pre-treatment',
      'Cushion and seam cleaning',
      'Stain and odour treatment',
      'Leather cleaned and conditioned',
      'Gentle dry pass',
    ],
    excludes: ['Upholstery repairs or re-covering', 'Removing covers for machine washing', 'Bed bug treatment'],
    faqs: [
      {
        question: 'Fabric or leather — do you handle both?',
        answer:
          'Yes. Tell us the material and size when booking so the team brings the right products and enough drying time.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 208,
  },
  'chair-clean': {
    slug: 'chair-clean',
    intro:
      'Dining, office and accent chairs cleaned one by one, so a set looks even again instead of showing the seats everyone uses.',
    includes: [
      'Seat and backrest cleaning',
      'Armrest and frame wipe-down',
      'Stain and spot treatment',
      'Odour neutralising',
      'Quick-dry finish',
    ],
    excludes: ['Wood polishing or refinishing', 'Re-upholstery', 'Chair repairs'],
    faqs: [
      {
        question: 'Can you clean a full dining set?',
        answer:
          'Yes. Add the number of chairs when booking; six to eight chairs usually take about two hours.',
      },
      ...sharedFaqs,
    ],
    rating: 4.7,
    reviewCount: 74,
  },
  'pavers-clean': {
    slug: 'pavers-clean',
    intro:
      'Pressure washing for driveways, walkways and compounds, lifting the red dust, moss and tyre marks that rain will not shift.',
    includes: [
      'Pressure washing of the paved area',
      'Weed and moss removal from joints',
      'Oil and tyre mark treatment',
      'Edge and wall spray-down',
      'Rinse and tidy-up',
    ],
    excludes: ['Re-sanding of joints', 'Sealing or coating', 'Repairing broken pavers'],
    faqs: [
      {
        question: 'How is a paving clean priced?',
        answer:
          'A specialist measures the area first, then sends a fixed quote. Share photos in your request to speed this up.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 64,
  },
  'roof-clean': {
    slug: 'roof-clean',
    intro:
      'Safe roof and gutter cleaning that clears leaves, moss and silt before the next rainy season backs water into your ceiling.',
    includes: [
      'Roof surface and gutter clearing',
      'Downpipe check and flush',
      'Moss and algae treatment',
      'Debris bagged and removed',
      'Photo report of the finished work',
    ],
    excludes: ['Roof repairs or waterproofing', 'Solar panel servicing', 'Tree cutting'],
    faqs: [
      {
        question: 'Do you need access from inside the house?',
        answer:
          'Usually not. The team works from ladders and the roof edge; we will confirm access and safety before the visit.',
      },
      ...sharedFaqs,
    ],
    rating: 4.7,
    reviewCount: 39,
  },
  'terrazzo-polish': {
    slug: 'terrazzo-polish',
    intro:
      'Grinding and polishing that brings dull terrazzo and concrete floors back to their original sheen without replacing them.',
    includes: [
      'Floor assessment and test patch',
      'Diamond grinding of the surface',
      'Chip and crack filling',
      'Multi-stage polishing',
      'Sealer application',
    ],
    excludes: ['Full floor replacement', 'Under-floor plumbing work', 'Furniture storage during curing'],
    faqs: [
      {
        question: 'How long before we can walk on it?',
        answer:
          'Light foot traffic after 24 hours and furniture after three days. The quote confirms curing time for your sealer.',
      },
      ...sharedFaqs,
    ],
    rating: 4.9,
    reviewCount: 27,
  },
  fumigation: {
    slug: 'fumigation',
    intro:
      'Inspection-led pest treatment for cockroaches, rodents, bed bugs and termites, with a follow-up visit to confirm the job is done.',
    includes: [
      'On-site inspection and report',
      'Targeted treatment of affected areas',
      'Safe application around children and pets',
      'Follow-up inspection visit',
      'Aftercare instructions',
    ],
    excludes: ['Structural repairs to damaged wood', 'Wildlife removal', 'Neighbouring units'],
    faqs: [
      {
        question: 'How long do we need to leave the house?',
        answer:
          'For most treatments four to six hours. The technician confirms the exact window and what to cover before starting.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 112,
  },
  'electrical-works': {
    slug: 'electrical-works',
    intro:
      'Certified electricians for sockets, lighting, tripping breakers and small installations, with faults found rather than guessed at.',
    includes: [
      'Fault finding and testing',
      'Socket, switch and light fitting work',
      'Breaker and distribution board checks',
      'Materials list before work starts',
      'Safety certificate where required',
    ],
    excludes: ['Major rewiring quotes (priced separately)', 'Utility company connections', 'Appliance repairs'],
    faqs: [
      {
        question: 'Do you supply the fittings?',
        answer:
          'The electrician can buy them and add the receipt to the job, or fit ones you already have. Tell us which at booking.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 156,
  },
  'plumbing-works': {
    slug: 'plumbing-works',
    intro:
      'Leaks, blocked drains, taps and toilets fixed by a plumber who explains the cause and shows you the finished repair.',
    includes: [
      'Leak detection and repair',
      'Drain and sink unblocking',
      'Tap, shower and toilet repairs',
      'Pipe and joint replacement',
      'Clean-up after the work',
    ],
    excludes: ['Borehole or tank installation', 'Wall and floor re-tiling', 'Municipal supply faults'],
    faqs: [
      {
        question: 'What if the problem needs parts?',
        answer:
          'The plumber confirms the part and price with you before buying it, and only charges for the visit if you decide to stop.',
      },
      ...sharedFaqs,
    ],
    rating: 4.7,
    reviewCount: 143,
  },
  'handyman-works': {
    slug: 'handyman-works',
    intro:
      'The small jobs that keep getting postponed: shelves, curtain rails, door handles, furniture assembly and minor fixes.',
    includes: [
      'Shelves, mirrors and curtain rails fitted',
      'Furniture assembly',
      'Door, lock and handle adjustments',
      'Minor wall and surface repairs',
      'Tools and fixings brought along',
    ],
    excludes: ['Certified electrical or plumbing work', 'Large carpentry builds', 'Painting whole rooms'],
    faqs: [
      {
        question: 'How much can one handyman do in a visit?',
        answer:
          'A three-hour visit usually covers four to six small jobs. List them in the notes and we will confirm the time needed.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 189,
  },
  tiling: {
    slug: 'tiling',
    intro:
      'Floor and wall tiling with straight lines, level surfaces and grout that is finished properly the first time.',
    includes: [
      'Surface preparation and levelling',
      'Tile layout and cutting',
      'Floor and wall tiling',
      'Grouting and sealing',
      'Old tile removal where quoted',
    ],
    excludes: ['Tiles and materials (bought at cost)', 'Structural wall changes', 'Under-tile waterproofing membranes'],
    faqs: [
      {
        question: 'Can I supply my own tiles?',
        answer:
          'Yes. Order 10% extra for cuts and breakages; the tiler will confirm the quantity before starting.',
      },
      ...sharedFaqs,
    ],
    rating: 4.7,
    reviewCount: 81,
  },
  painting: {
    slug: 'painting',
    intro:
      'Neat interior and exterior painting, from one accent wall to a full repaint, with proper prep and furniture protection.',
    includes: [
      'Surface prep, filling and sanding',
      'Furniture and floor protection',
      'Two coats of your chosen colour',
      'Trim, door and frame painting',
      'Daily tidy-up',
    ],
    excludes: ['Paint and materials (quoted separately)', 'Wallpaper removal', 'Structural repairs'],
    faqs: [
      {
        question: 'Do I need to move out while you paint?',
        answer:
          'Usually not for interior rooms. The team works room by room and keeps the rest of the house usable.',
      },
      ...sharedFaqs,
    ],
    rating: 4.9,
    reviewCount: 167,
  },
  renovation: {
    slug: 'renovation',
    intro:
      'Larger upgrades planned and managed end to end — kitchens, bathrooms and full units — with one point of contact.',
    includes: [
      'Site visit and measured scope',
      'Itemised quote and timeline',
      'Coordinated trades on site',
      'Progress updates and photos',
      'Snag list and handover walkthrough',
    ],
    excludes: ['Architectural drawings', 'Council approvals', 'Structural engineering'],
    faqs: [
      {
        question: 'How long does a renovation quote take?',
        answer:
          'Allow three to five working days after the site visit for a measured, itemised quote you can compare line by line.',
      },
      ...sharedFaqs,
    ],
    rating: 4.6,
    reviewCount: 34,
  },
  'pavers-laying': {
    slug: 'pavers-laying',
    intro:
      'New paving laid on a properly prepared base, with straight lines, correct falls and joints that will not sink.',
    includes: [
      'Ground clearing and levelling',
      'Compacted hardcore base',
      'Pavers laid to your pattern',
      'Cutting around edges and drains',
      'Joint sanding and final clean',
    ],
    excludes: ['Pavers and materials (bought at cost)', 'Drainage system installation', 'Retaining walls'],
    faqs: [
      {
        question: 'How do you price a paving job?',
        answer:
          'By measured square metres after a site visit, with materials listed separately so you can see exactly what you are paying for.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 46,
  },
  landscaping: {
    slug: 'landscaping',
    intro:
      'Lawns, hedges and garden beds brought back into shape, from a one-off tidy-up to regular maintenance.',
    includes: [
      'Grass cutting and edging',
      'Hedge and shrub trimming',
      'Weeding and bed clearing',
      'Green waste removed',
      'Sweep and tidy of paths',
    ],
    excludes: ['Tree felling', 'Irrigation system installation', 'Hard landscaping and paving'],
    faqs: [
      {
        question: 'Can you come on a regular schedule?',
        answer:
          'Yes. Fortnightly and monthly visits cost less per visit, and you can pause or reschedule in the app.',
      },
      ...sharedFaqs,
    ],
    rating: 4.7,
    reviewCount: 93,
  },
};

export const relatedServices = (slug: string): readonly Service[] =>
  services.filter((service) => service.slug !== slug).slice(0, 3);

/**
 * Copy for a catalogue service that has no editorial entry yet, built from its catalogue
 * name and tagline so a newly added service still gets a complete landing page. Cached by
 * slug so the hook's identity check does not refetch on every render.
 */
const fallbackCache = new Map<string, ServiceContent>();

const fallbackContent = (service: Service): ServiceContent => ({
  slug: service.slug,
  intro: `${service.tagline.replace(/\.$/, '')}. Every booking is confirmed with a vetted specialist, a clear scope and a price agreed before work starts.`,
  includes: [
    'A vetted Gabfix specialist',
    'Scope confirmed before the visit',
    'Materials listed at checkout',
    'Photo check-in when the work starts',
    'Clean-up of the work area',
  ],
  excludes: ['Large materials (quoted at cost)', 'Work outside the agreed scope', 'Repairs found after the visit'],
  faqs: [
    {
      question: `How is ${service.name.toLowerCase()} priced?`,
      answer:
        service.pricingMode === 'quote'
          ? 'A specialist reviews your request and sends a fixed quote before any work is booked.'
          : 'The app shows the price for the hours and add-ons you choose before you confirm.',
    },
    ...sharedFaqs,
  ],
  rating: 0,
  reviewCount: 0,
});

export const serviceContentBySlug = (slug?: string): ServiceContent | undefined => {
  if (!slug) return undefined;
  const entry = serviceContent[slug];
  if (entry) return entry;
  const service = services.find((item) => item.slug === slug);
  if (!service) return undefined;
  const cached = fallbackCache.get(slug);
  if (cached) return cached;
  const generated = fallbackContent(service);
  fallbackCache.set(slug, generated);
  return generated;
};
