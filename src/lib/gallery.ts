import RAW from '@/data/gallery_data.json';

export type GalleryPhoto = {
  file: string;
  src: string;
  lat: number;
  lng: number;
  ts: number;
  date: string;
  cluster: string;
  label: string;
  people: string[];
};

export type ClusterId =
  | 'worcester' | 'nyc_nj' | 'manchester' | 'cancun' | 'houston' | 'other';

export type ClusterAnchor = {
  id: ClusterId;
  label: string;
  /** 3D position of the cluster center */
  position: [number, number, number];
  /** Approximate scatter radius around center */
  radius: number;
};

/**
 * Cluster anchors arranged in a wide arc around the camera (which sits at z≈10
 * looking at origin). Worcester sits front-center because it's the dominant set;
 * the rest fan out to feel like distinct constellations.
 */
export const CLUSTER_ANCHORS: ClusterAnchor[] = [
  { id: 'worcester',  label: 'Worcester, MA',  position: [ 0.0,  0.4,  0.0],  radius: 2.6 },
  { id: 'nyc_nj',     label: 'New York / NJ',   position: [ 4.6,  1.6, -2.0], radius: 2.0 },
  { id: 'manchester', label: 'Manchester, UK',  position: [-4.4,  1.4, -1.8], radius: 1.8 },
  { id: 'cancun',     label: 'Cancún, MX',      position: [ 3.6, -2.0,  0.8], radius: 1.4 },
  { id: 'houston',    label: 'Houston, TX',     position: [-3.4, -2.2,  0.6], radius: 1.3 },
  { id: 'other',      label: 'Elsewhere',       position: [ 0.0,  3.2, -3.4], radius: 1.2 },
];

export const CLUSTER_BY_ID: Record<string, ClusterAnchor> =
  Object.fromEntries(CLUSTER_ANCHORS.map(c => [c.id, c]));

const ALL_PHOTOS = RAW as GalleryPhoto[];

/**
 * Deterministic sample: take up to `perCluster` photos per cluster, spaced
 * evenly through the sorted-by-timestamp list so we get visual variety.
 */
export function sampleConstellation(perCluster = 14): GalleryPhoto[] {
  const byCluster = new Map<string, GalleryPhoto[]>();
  for (const p of ALL_PHOTOS) {
    if (!byCluster.has(p.cluster)) byCluster.set(p.cluster, []);
    byCluster.get(p.cluster)!.push(p);
  }
  const out: GalleryPhoto[] = [];
  for (const anchor of CLUSTER_ANCHORS) {
    const list = (byCluster.get(anchor.id) ?? []).slice().sort((a, b) => a.ts - b.ts);
    if (list.length === 0) continue;
    const step = Math.max(1, Math.floor(list.length / perCluster));
    for (let i = 0; i < list.length && out.length / CLUSTER_ANCHORS.length < perCluster * 2; i += step) {
      out.push(list[i]);
      if (out.filter(x => x.cluster === anchor.id).length >= perCluster) break;
    }
  }
  return out;
}

/**
 * Deterministic 3D position for a photo within its cluster's scatter sphere.
 * Uses Fibonacci-sphere distribution seeded by the photo's index-in-cluster.
 */
export function photoPosition(
  cluster: ClusterAnchor,
  indexInCluster: number,
  totalInCluster: number,
): [number, number, number] {
  const golden = (1 + Math.sqrt(5)) / 2;
  const t = (indexInCluster + 0.5) / Math.max(totalInCluster, 1);
  const theta = Math.acos(1 - 2 * t);
  const phi = 2 * Math.PI * indexInCluster / golden;

  // Add a stable jitter so identical t doesn't collide
  const jitter = ((indexInCluster * 9301 + 49297) % 233280) / 233280;
  const r = cluster.radius * (0.55 + 0.45 * jitter);

  return [
    cluster.position[0] + r * Math.sin(theta) * Math.cos(phi),
    cluster.position[1] + r * Math.sin(theta) * Math.sin(phi) * 0.7,
    cluster.position[2] + r * Math.cos(theta),
  ];
}
