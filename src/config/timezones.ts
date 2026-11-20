export const timezones = [
  { id: 'Africa/Kampala', city: 'Kampala', country: 'Uganda' },
  { id: 'Africa/Nairobi', city: 'Nairobi', country: 'Kenya' },
  { id: 'Africa/Kigali', city: 'Kigali', country: 'Rwanda' },
  { id: 'Africa/Dar_es_Salaam', city: 'Dar es Salaam', country: 'Tanzania' },
  { id: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria' },
  { id: 'Europe/London', city: 'London', country: 'United Kingdom' },
] as const;

export type TimezoneId = (typeof timezones)[number]['id'];

export const timezoneById = (id: string) => timezones.find((zone) => zone.id === id);

export const deviceTimezone = (): string | null => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
};

export const timezoneLabel = (id: string): string => {
  const zone = timezoneById(id);
  if (zone) return `${zone.city}, ${zone.country}`;
  return id || 'Africa/Kampala';
};
