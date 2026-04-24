// Memory Node — core data structure
export type NodeCategory =
  | 'systems'
  | 'family'
  | 'bjj'
  | 'business'
  | 'reflection'
  | 'builds'
  | 'fitness'
  | 'writing';

export interface MemoryNode {
  id: string;
  title: string;
  excerpt: string;
  category: NodeCategory;
  timestamp: string; // ISO date
  location?: string;
  people?: string[];
  project?: string;
  emotionalTag?: string;
  media?: {
    type: 'image' | 'video';
    src: string;
    alt?: string;
  };
  relatedIds?: string[]; // manually curated connections
  // Auto-derived connections (computed at runtime)
  position?: [number, number, number]; // 3D position on sphere
}

// Category color map
export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  systems:    '#c9a96e', // gold
  family:     '#7eb8c9', // steel blue
  bjj:        '#c97e7e', // deep red
  business:   '#9ec97e', // sage green
  reflection: '#b87ec9', // violet
  builds:     '#7ec9b8', // teal
  fitness:    '#c9a07e', // copper
  writing:    '#9ea8c9', // slate blue
};

// Relationship engine — auto-connect nodes by shared attributes
export function deriveConnections(nodes: MemoryNode[]): Map<string, string[]> {
  const connections = new Map<string, string[]>();

  nodes.forEach(node => {
    const related = new Set<string>(node.relatedIds ?? []);

    nodes.forEach(other => {
      if (other.id === node.id) return;

      // Shared category
      if (other.category === node.category) related.add(other.id);

      // Shared time proximity (within 90 days)
      const nodeDate = new Date(node.timestamp).getTime();
      const otherDate = new Date(other.timestamp).getTime();
      if (Math.abs(nodeDate - otherDate) < 90 * 24 * 60 * 60 * 1000) {
        related.add(other.id);
      }

      // Shared location
      if (node.location && other.location === node.location) related.add(other.id);

      // Shared people
      if (node.people && other.people) {
        const overlap = node.people.filter(p => other.people!.includes(p));
        if (overlap.length > 0) related.add(other.id);
      }

      // Shared project
      if (node.project && other.project === node.project) related.add(other.id);

      // Shared emotional tag
      if (node.emotionalTag && other.emotionalTag === node.emotionalTag) {
        related.add(other.id);
      }
    });

    connections.set(node.id, Array.from(related));
  });

  return connections;
}

// Distribute nodes on a sphere surface (Fibonacci sphere)
export function distributeOnSphere(count: number, radius: number = 4): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < count; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / count);
    const phi = (2 * Math.PI * i) / goldenRatio;
    positions.push([
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.cos(theta),
      radius * Math.sin(theta) * Math.sin(phi),
    ]);
  }

  return positions;
}
