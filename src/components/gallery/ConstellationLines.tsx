'use client';

import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { ClusterAnchor } from '@/lib/gallery';

type LinePoint = { anchor: ClusterAnchor; position: [number, number, number] };

type Props = {
  lines: LinePoint[];
  activeCluster: string | null;
};

/**
 * Renders the gold "thread" connections inside the constellation.
 *
 * We construct real THREE.Line / THREE.LineSegments objects in JS and render
 * them via <primitive object={...}>. This avoids the @react-three/fiber 9
 * naming dance around the SVG `<line>` collision.
 */
export default function ConstellationLines({ lines, activeCluster }: Props) {
  const { spokes, backbone } = useMemo(() => {
    // Per-spoke line objects so we can dim them per-cluster
    const spokes: { line: THREE.Line; material: THREE.LineBasicMaterial; cluster: string }[] =
      lines.map(({ anchor, position }) => {
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...anchor.position),
          new THREE.Vector3(...position),
        ]);
        const material = new THREE.LineBasicMaterial({
          color: '#c9a96e',
          transparent: true,
          opacity: 0.14,
          toneMapped: false,
        });
        const line = new THREE.Line(geo, material);
        line.frustumCulled = false;
        return { line, material, cluster: anchor.id };
      });

    // Single LineSegments for the anchor-to-anchor backbone
    const anchorIds = Array.from(new Set(lines.map(l => l.anchor.id)));
    const anchors = anchorIds
      .map(id => lines.find(l => l.anchor.id === id)?.anchor)
      .filter((a): a is ClusterAnchor => !!a);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < anchors.length; i++) {
      for (let j = i + 1; j < anchors.length; j++) {
        pts.push(new THREE.Vector3(...anchors[i].position));
        pts.push(new THREE.Vector3(...anchors[j].position));
      }
    }
    const bGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const bMat = new THREE.LineBasicMaterial({
      color: '#c9a96e',
      transparent: true,
      opacity: 0.08,
      toneMapped: false,
    });
    const backbone = { line: new THREE.LineSegments(bGeo, bMat), material: bMat };
    backbone.line.frustumCulled = false;

    return { spokes, backbone };
  }, [lines]);

  // Update opacity based on activeCluster without rebuilding geometry.
  // three.js material properties are inherently mutable; React's reconciler
  // doesn't manage them, so the immutability lint here is a false positive.
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    for (const s of spokes) {
      const dimmed = activeCluster && activeCluster !== s.cluster;
      s.material.opacity = dimmed ? 0.04 : 0.14;
    }
    backbone.material.opacity = activeCluster ? 0.04 : 0.08;
  }, [activeCluster, spokes, backbone]);
  /* eslint-enable react-hooks/immutability */

  // Cleanup geometries/materials when the lines list changes
  useEffect(() => {
    return () => {
      for (const s of spokes) {
        s.line.geometry.dispose();
        s.material.dispose();
      }
      backbone.line.geometry.dispose();
      backbone.material.dispose();
    };
  }, [spokes, backbone]);

  return (
    <>
      {spokes.map((s, i) => (
        <primitive key={i} object={s.line} />
      ))}
      <primitive object={backbone.line} />
    </>
  );
}
