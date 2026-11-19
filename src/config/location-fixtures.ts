import type { BookingLocation } from '@/lib/pricing';

/**
 * Bundled places for the P11 address picker. `Location_Fixtures.md` describes a
 * Google Places integration; until a key and a billing account exist this table
 * provides Kampala coverage offline, including the Maganjo examples from the spec.
 * Area names match `src/config/areas.ts` so a pick can switch the served area.
 */
export type FixturePlace = {
  id: string;
  name: string;
  /** Street or building line written into the address field. */
  street: string;
  /** Secondary line shown in the suggestion row. */
  address: string;
  area: string;
  lat: number;
  lng: number;
  aliases?: string[];
  propertyType?: BookingLocation['propertyType'];
  landmark?: string;
};

export type SavedAddress = {
  id: string;
  label: string;
  street: string;
  landmark: string;
  propertyType: BookingLocation['propertyType'];
};

/** Dummy saved addresses until P24 stores real ones. */
export const savedAddresses: SavedAddress[] = [
  {
    id: 'home',
    label: 'Home',
    street: 'Plot 14, Ntinda Road',
    landmark: 'Near Shell petrol station, blue gate',
    propertyType: 'house',
  },
  {
    id: 'work',
    label: 'Work',
    street: '3rd floor, Acacia Mall, Kololo',
    landmark: 'Ask for reception on the third floor',
    propertyType: 'office',
  },
];

export const locationFixtures: FixturePlace[] = [
  {
    id: 'maganjo',
    name: 'Maganjo',
    street: 'Maganjo, Kampala–Masindi Highway',
    address: 'Maganjo, Kawempe, Kampala',
    area: 'Kawempe',
    lat: 0.3792,
    lng: 32.5568,
  },
  {
    id: 'maganjo-grain-millers',
    name: 'Maganjo Grain Millers Ltd',
    street: 'Maganjo Grain Millers, Kampala–Masindi Highway',
    address: 'Maganjo, Kawempe, Kampala',
    area: 'Kawempe',
    lat: 0.3764,
    lng: 32.5601,
    aliases: ['grain millers', 'maganjo millers'],
    propertyType: 'office',
  },
  {
    id: 'maganjo-taxi-stage',
    name: 'Maganjo Taxi Stage',
    street: 'Maganjo Taxi Stage, Kampala–Masindi Highway',
    address: 'Maganjo, Kawempe, Kampala',
    area: 'Kawempe',
    lat: 0.3779,
    lng: 32.5584,
    aliases: ['maganjo stage'],
  },
  {
    id: 'ntinda',
    name: 'Ntinda',
    street: 'Ntinda, Kampala',
    address: 'Ntinda, Nakawa, Kampala',
    area: 'Ntinda',
    lat: 0.3612,
    lng: 32.6118,
    aliases: ['ntinda trading centre', 'ntinda shopping centre'],
    landmark: 'Near Ntinda Shopping Centre',
  },
  {
    id: 'acacia-mall',
    name: 'Acacia Mall',
    street: '3rd floor, Acacia Mall, Kololo',
    address: '14-16 Cooper Road, Kololo, Kampala',
    area: 'Kololo',
    lat: 0.3346,
    lng: 32.5946,
    aliases: ['acacia', 'acacia mall kololo'],
    propertyType: 'office',
  },
  {
    id: 'kololo',
    name: 'Kololo',
    street: 'Kololo, Kampala',
    address: 'Kololo, Kampala Central, Kampala',
    area: 'Kololo',
    lat: 0.3374,
    lng: 32.5908,
  },
  {
    id: 'nakasero-market',
    name: 'Nakasero Market',
    street: 'Nakasero Market, Entebbe Road',
    address: 'Nakasero, Kampala Central, Kampala',
    area: 'Nakasero',
    lat: 0.3136,
    lng: 32.5803,
    aliases: ['nakasero'],
  },
  {
    id: 'old-kampala',
    name: 'Old Kampala',
    street: 'Old Kampala, Kampala',
    address: 'Old Kampala, Kampala Central, Kampala',
    area: 'Old Kampala',
    lat: 0.3153,
    lng: 32.5639,
    aliases: ['old taxi park'],
  },
  {
    id: 'bugolobi-market',
    name: 'Bugolobi Market',
    street: 'Bugolobi Market, Luthuli Avenue',
    address: 'Bugolobi, Nakawa, Kampala',
    area: 'Bugolobi',
    lat: 0.3259,
    lng: 32.6185,
    aliases: ['bugolobi'],
  },
  {
    id: 'village-mall',
    name: 'Village Mall Bugolobi',
    street: 'Village Mall, Luthuli Avenue, Bugolobi',
    address: 'Bugolobi, Nakawa, Kampala',
    area: 'Bugolobi',
    lat: 0.3268,
    lng: 32.6202,
    aliases: ['village mall'],
    propertyType: 'office',
  },
  {
    id: 'bukoto',
    name: 'Bukoto',
    street: 'Bukoto, Kampala',
    address: 'Bukoto, Nakawa, Kampala',
    area: 'Bukoto',
    lat: 0.3449,
    lng: 32.6028,
  },
  {
    id: 'naguru',
    name: 'Naguru',
    street: 'Naguru, Kampala',
    address: 'Naguru, Nakawa, Kampala',
    area: 'Naguru',
    lat: 0.3446,
    lng: 32.6201,
    aliases: ['naguru hospital'],
  },
  {
    id: 'muyenga',
    name: 'Muyenga',
    street: 'Muyenga, Kampala',
    address: 'Muyenga, Makindye, Kampala',
    area: 'Muyenga',
    lat: 0.2988,
    lng: 32.6097,
    aliases: ['tank hill'],
  },
  {
    id: 'kabalagala',
    name: 'Kabalagala',
    street: 'Kabalagala, Kampala',
    address: 'Kabalagala, Makindye, Kampala',
    area: 'Kabalagala',
    lat: 0.2974,
    lng: 32.5945,
  },
  {
    id: 'kansanga',
    name: 'Kansanga',
    street: 'Kansanga, Kampala',
    address: 'Kansanga, Makindye, Kampala',
    area: 'Kansanga',
    lat: 0.2926,
    lng: 32.6034,
    aliases: ['kansanga market'],
  },
  {
    id: 'naalya',
    name: 'Naalya Estate',
    street: 'Naalya Estate, Kampala',
    address: 'Naalya, Wakiso, Kampala',
    area: 'Naalya',
    lat: 0.3712,
    lng: 32.6329,
    aliases: ['naalya'],
  },
  {
    id: 'metroplex-mall',
    name: 'Metroplex Mall Naalya',
    street: 'Metroplex Mall, Naalya',
    address: 'Naalya, Wakiso, Kampala',
    area: 'Naalya',
    lat: 0.3731,
    lng: 32.6351,
    aliases: ['metroplex', 'naalya mall'],
    propertyType: 'office',
  },
  {
    id: 'mengo',
    name: 'Mengo',
    street: 'Mengo, Kampala',
    address: 'Mengo, Rubaga, Kampala',
    area: 'Mengo',
    lat: 0.3018,
    lng: 32.5579,
    aliases: ['kabaka’s palace', 'kabakas palace'],
  },
  {
    id: 'nateete',
    name: 'Nateete',
    street: 'Nateete, Kampala',
    address: 'Nateete, Rubaga, Kampala',
    area: 'Nateete',
    lat: 0.2925,
    lng: 32.5321,
  },
  {
    id: 'bwaise',
    name: 'Bwaise',
    street: 'Bwaise, Kampala',
    address: 'Bwaise, Kawempe, Kampala',
    area: 'Bwaise',
    lat: 0.3561,
    lng: 32.5572,
  },
  {
    id: 'entebbe-town',
    name: 'Entebbe Town',
    street: 'Entebbe Town',
    address: 'Entebbe, Wakiso',
    area: 'Entebbe Town',
    lat: 0.0512,
    lng: 32.4637,
    aliases: ['entebbe'],
  },
];

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Token-prefix search over the fixture name, address, area and aliases. Every
 * query token must prefix a word in the haystack, so “maganj” matches Maganjo,
 * the grain millers and the taxi stage while “ntinda rd” does not match Ntinda.
 */
export function searchLocationFixtures(query: string, limit = 6): FixturePlace[] {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];

  return locationFixtures
    .map((place) => {
      const name = normalize(place.name);
      const haystack = normalize(
        [place.name, place.address, place.street, place.area, ...(place.aliases ?? [])].join(' '),
      );
      const words = haystack.split(' ');
      if (!tokens.every((token) => words.some((word) => word.startsWith(token)))) return null;

      const score =
        (name.startsWith(tokens[0]) ? 3 : 0) +
        (tokens.every((token) => name.split(' ').some((word) => word.startsWith(token))) ? 2 : 0) +
        (normalize(place.area).startsWith(tokens[0]) ? 1 : 0);
      return { place, score };
    })
    .filter((match): match is { place: FixturePlace; score: number } => match !== null)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map((match) => match.place);
}
