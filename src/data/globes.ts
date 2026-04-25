export interface GlobeDef {
  id: string;
  label: string;
  color: string;
  position: [number, number, number];
  radius: number;
}

export const GLOBE_DEFS: GlobeDef[] = [
  { id: 'family',     label: 'Family',     color: '#c9a84c', position: [-2.4,  0.5,  0.2],  radius: 1.35 },
  { id: 'discipline', label: 'Discipline', color: '#c97e7e', position: [ 2.6, -0.5, -0.5],  radius: 1.05 },
  { id: 'systems',    label: 'Systems',    color: '#7eb8c9', position: [ 0.2, -1.8, -2.0],  radius: 1.0  },
  { id: 'reflection', label: 'Reflection', color: '#b87ec9', position: [-0.7,  1.9, -1.5],  radius: 0.88 },
  { id: 'growth',     label: 'Growth',     color: '#9ec97e', position: [ 1.5,  1.5, -0.5],  radius: 0.82 },
];

export const GLOBE_CONNECTIONS: [string, string][] = [
  ['family',     'reflection'],
  ['family',     'growth'],
  ['discipline', 'growth'],
  ['systems',    'growth'],
  ['systems',    'discipline'],
  ['reflection', 'systems'],
];
