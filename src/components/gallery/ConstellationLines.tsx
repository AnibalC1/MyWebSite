'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { ClusterAnchor } from '@/lib/gallery';

type LinePoint = { anchor: ClusterAnchor; position: [number, number, number] };

type Props = {
  lines: LinePoint[];
  activeCluster: string | null;
};

/**
 * Renders one faint gold thread from each photo to its cluster anchor,
 * plus a thread linking every cluster anchor to the origin.
 */
export default function ConstellationLines({ lines, activeCluster }: Props) {
  const { spokeGeometries, anchorGeometry } = useMemo(() => {
    const spokeGeometries: { geo: THREE.BufferGeometry; cluster: string }[] = [];
    for (const { anchor, position } of lines) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...anchor.position),
        new THREE.Vector3(...position),
      ]);
      spokeGeometries.push({ geo, cluster: anchor.id });
    }
    // Lines between anchors (faint backbone)
    const anchorIds = Array.from(new Set(lines.map(l => l.anchor.id)));
    const anchorPts: THREE.Vector3[] = [];
    const anchors = anchorIds.map(id => lines.find(l => l.anchor.id === id)!.anchor);
    for (let i = 0; i < anchors.length; i++) {
      for (let j = i + 1; j < anchors.length; j++) {
        anchorPts.push(new THREE.Vector3(...anchors[i].position));
        anchorPts.push(new THREE.Vector3(...anchors[j].position));
      }
    }
    const anchorGeometry = new THREE.BufferGeometry().setFromPoints(anchorPts);
    return { spokeGeometries, anchorGeometry };
  }, [lines]);

  return (
    <>
      {spokeGeometries.map(({ geo, cluster }, i) => {
        const dimmed = activeCluster && activeCluster !== cluster;
        return (
          <line key={i}>
            <primitive object={geo} attach="geometry" />
            <lineBasicMaterial
              color="#c9a96e"
              transparent
              opacity={dimmed ? 0.04 : 0.14}
              toneMapped={false}
            />
          </line>
        );
      })}
      <lineSegments>
        <primitive object={anchorGeometry} attach="geometry" />
        <lineBasicMaterial
          color="#c9a96e"
          transparent
          opacity={activeCluster ? 0.04 : 0.08}
          toneMapped={false}
        />
      </lineSegments>
    </>
  );
}
