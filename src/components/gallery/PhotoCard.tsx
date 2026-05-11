'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { GalleryPhoto } from '@/lib/gallery';

type Props = {
  photo: GalleryPhoto;
  position: [number, number, number];
  bobSeed: number;
  faded: boolean;
  highlighted: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
};

const BASE_HEIGHT = 0.72;

export default function PhotoCard({
  photo, position, bobSeed, faded, highlighted, onClick, onHover,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const borderRef = useRef<THREE.LineBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const tex = useTexture(photo.src);

  // Aspect-correct planes (constant height, width follows image aspect)
  const dims = useMemo<[number, number]>(() => {
    const img = tex.image as HTMLImageElement | undefined;
    const aspect = img && img.width && img.height ? img.width / img.height : 4 / 3;
    return [BASE_HEIGHT * aspect, BASE_HEIGHT];
  }, [tex]);

  // Configure the texture once; three.js properties are inherently mutable
  // and managed outside React's reconciler.
  /* eslint-disable react-hooks/immutability */
  useMemo(() => {
    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
    }
  }, [tex]);
  /* eslint-enable react-hooks/immutability */

  const fadeInRef = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Fade in once the texture is loaded (Suspense already resolved, so we're here)
    fadeInRef.current = Math.min(1, fadeInRef.current + 0.018);

    if (groupRef.current) {
      // Always face the camera (billboard)
      groupRef.current.quaternion.copy(state.camera.quaternion);
      // Subtle bob
      groupRef.current.position.y = position[1] + Math.sin(t * 0.6 + bobSeed) * 0.04;
      // Scale on hover/highlight
      const target = (hovered || highlighted ? 1.35 : 1.0) * (0.6 + 0.4 * fadeInRef.current);
      const cur = groupRef.current.scale.x;
      const next = cur + (target - cur) * 0.12;
      groupRef.current.scale.setScalar(next);
    }
    if (matRef.current) {
      const targetOpacity = (faded ? 0.18 : 1.0) * fadeInRef.current;
      const cur = matRef.current.opacity;
      matRef.current.opacity = cur + (targetOpacity - cur) * 0.1;
    }
    if (borderRef.current) {
      const target = (hovered ? 1.0 : faded ? 0.08 : 0.42) * fadeInRef.current;
      const cur = borderRef.current.opacity;
      borderRef.current.opacity = cur + (target - cur) * 0.1;
    }
  });

  const borderPoints = useMemo(() => {
    const [w, h] = dims;
    const hw = w / 2, hh = h / 2;
    const pad = 0.03;
    return [
      new THREE.Vector3(-hw - pad, -hh - pad, 0.01),
      new THREE.Vector3( hw + pad, -hh - pad, 0.01),
      new THREE.Vector3( hw + pad,  hh + pad, 0.01),
      new THREE.Vector3(-hw - pad,  hh + pad, 0.01),
      new THREE.Vector3(-hw - pad, -hh - pad, 0.01),
    ];
  }, [dims]);

  const borderGeo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(borderPoints);
    return g;
  }, [borderPoints]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    onHover(true);
    document.body.style.cursor = 'pointer';
  };
  const handlePointerOut = () => {
    setHovered(false);
    onHover(false);
    document.body.style.cursor = '';
  };

  return (
    <group ref={groupRef} position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={dims} />
        <meshBasicMaterial
          ref={matRef}
          map={tex}
          transparent
          opacity={0}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineLoop>
        <primitive object={borderGeo} attach="geometry" />
        <lineBasicMaterial
          ref={borderRef}
          color="#c9a96e"
          transparent
          opacity={0}
          toneMapped={false}
        />
      </lineLoop>
    </group>
  );
}
