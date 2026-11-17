/**
 * Served areas for the launch market (Part 2, P3).
 * `served: false` renders "Coming soon" and the notify-me flow.
 */
export type Area = {
  id: string;
  name: string;
  division: string;
  served: boolean;
};

export type AreaSection = {
  title: string;
  data: Area[];
};

const area = (division: string, name: string, served = true): Area => ({
  id: `${division.toLowerCase().replace(/[^a-z]+/g, '-')}-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
  name,
  division,
  served,
});

const kampalaCentral = [
  area('Kampala Central', 'Kololo'),
  area('Kampala Central', 'Nakasero'),
  area('Kampala Central', 'Kampala CBD'),
  area('Kampala Central', 'Old Kampala'),
  area('Kampala Central', 'Industrial Area'),
];

const nakawa = [
  area('Nakawa', 'Ntinda'),
  area('Nakawa', 'Naguru'),
  area('Nakawa', 'Bugolobi'),
  area('Nakawa', 'Bukoto'),
  area('Nakawa', 'Luzira'),
  area('Nakawa', 'Kireka', false),
];

const makindye = [
  area('Makindye', 'Kabalagala'),
  area('Makindye', 'Muyenga'),
  area('Makindye', 'Kansanga'),
  area('Makindye', 'Nsambya'),
  area('Makindye', 'Ggaba'),
  area('Makindye', 'Katwe'),
];

const kawempe = [
  area('Kawempe', 'Kawempe'),
  area('Kawempe', 'Bwaise'),
  area('Kawempe', 'Kanyanya'),
  area('Kawempe', 'Mpererwe', false),
];

const rubaga = [
  area('Rubaga', 'Mengo'),
  area('Rubaga', 'Rubaga'),
  area('Rubaga', 'Namirembe'),
  area('Rubaga', 'Nateete'),
  area('Rubaga', 'Lungujja'),
];

const wakiso = [
  area('Wakiso', 'Naalya'),
  area('Wakiso', 'Kira'),
  area('Wakiso', 'Wakiso Town'),
  area('Wakiso', 'Nansana', false),
  area('Wakiso', 'Kyengera', false),
];

const entebbe = [
  area('Entebbe', 'Entebbe Town'),
  area('Entebbe', 'Kitoro'),
  area('Entebbe', 'Lugonjo'),
  area('Entebbe', 'Nakiwogo', false),
];

export const areaSections: AreaSection[] = [
  { title: 'Kampala Central', data: kampalaCentral },
  { title: 'Nakawa', data: nakawa },
  { title: 'Makindye', data: makindye },
  { title: 'Kawempe', data: kawempe },
  { title: 'Rubaga', data: rubaga },
  { title: 'Wakiso', data: wakiso },
  { title: 'Entebbe', data: entebbe },
];

export const allAreas: Area[] = areaSections.flatMap((section) => section.data);

export const findAreaById = (id: string | undefined): Area | undefined =>
  allAreas.find((candidate) => candidate.id === id);

/** Kampala divisions in the order used by the Home location pill and P3. */
export const divisions = areaSections.map((section) => section.title);
