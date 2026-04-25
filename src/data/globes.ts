export interface GlobeDef {
  id: string;
  label: string;
  color: string;
  // position[0], position[2] → XZ determines orbital radius + starting phase
  // position[1] → Y vertical offset
  position: [number, number, number];
  radius: number;      // visual sphere radius
  orbitSpeed: number;  // radians per second (orbit around world center)
}

export const GLOBE_DEFS: GlobeDef[] = [
  // ── Outer ring — slow, large ──────────────────────────────────────────────
  { id: 'family',     label: 'Family',     color: '#c9a84c', position: [-2.5,  0.4,  0.3],  radius: 1.35, orbitSpeed: 0.07 },
  { id: 'wedding',    label: 'Wedding',    color: '#e8c4b8', position: [ 0.5,  0.6,  3.2],  radius: 1.10, orbitSpeed: 0.06 },
  { id: 'discipline', label: 'Discipline', color: '#c97e7e', position: [ 2.7, -0.4, -0.5],  radius: 1.05, orbitSpeed: 0.10 },
  { id: 'christmas',  label: 'Christmas',  color: '#8cc98c', position: [ 1.0,  1.0, -3.2],  radius: 0.95, orbitSpeed: 0.08 },

  // ── Middle ring ────────────────────────────────────────────────────────────
  { id: 'birthday',   label: 'Birthday',   color: '#c9884c', position: [-2.1, -0.7,  1.3],  radius: 0.92, orbitSpeed: 0.11 },
  { id: 'systems',    label: 'Systems',    color: '#7eb8c9', position: [ 0.2, -1.6, -2.1],  radius: 0.90, orbitSpeed: 0.09 },
  { id: 'reflection', label: 'Reflection', color: '#b87ec9', position: [-0.7,  1.8, -1.6],  radius: 0.88, orbitSpeed: 0.14 },
  { id: 'growth',     label: 'Growth',     color: '#9ec97e', position: [ 1.6,  1.4, -0.4],  radius: 0.82, orbitSpeed: 0.12 },

  // ── Inner ring — fast, small ──────────────────────────────────────────────
  { id: '2024',       label: '2024',       color: '#c9c48c', position: [-0.3,  0.3, -1.3],  radius: 0.75, orbitSpeed: 0.20 },
  { id: '2023',       label: '2023',       color: '#a8c98c', position: [ 0.8,  0.9,  1.0],  radius: 0.72, orbitSpeed: 0.18 },
  { id: '2022',       label: '2022',       color: '#8cb0c9', position: [-1.1, -1.0,  0.5],  radius: 0.72, orbitSpeed: 0.22 },
];

export const GLOBE_CONNECTIONS: [string, string][] = [];
