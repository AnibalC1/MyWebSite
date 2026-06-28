'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
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

  // Construct the border as a real THREE.LineLoop and render via <primitive>
  // (avoids JSX intrinsic naming issues with line elements in R3F 9).
  const border = useMemo(() => {
    const [w, h] = dims;
    const hw = w / 2, hh = h / 2;
    const pad = 0.03;
    const pts = [
      new THREE.Vector3(-hw - pad, -hh - pad, 0.01),
      new THREE.Vector3( hw + pad, -hh - pad, 0.01),
      new THREE.Vector3( hw + pad,  hh + pad, 0.01),
      new THREE.Vector3(-hw - pad,  hh + pad, 0.01),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineBasicMaterial({
      color: '#c9a96e',
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const line = new THREE.LineLoop(geometry, material);
    line.frustumCulled = false;
    return { line, material, geometry };
  }, [dims]);

  // Dispose on unmount / when border changes
  useEffect(() => {
    return () => {
      border.geometry.dispose();
      border.material.dispose();
    };
  }, [border]);

  const fadeInRef = useRef(0);

  // three.js objects are mutated inside useFrame — that is the standard r3f
  // pattern. Suppress the immutability lint which doesn't understand it.
  /* eslint-disable react-hooks/immutability */
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    fadeInRef.current = Math.min(1, fadeInRef.current + 0.018);

    if (groupRef.current) {
      groupRef.current.quaternion.copy(state.camera.quaternion);
      groupRef.current.position.y = position[1] + Math.sin(t * 0.6 + bobSeed) * 0.04;
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
    const borderTarget = (hovered ? 1.0 : faded ? 0.08 : 0.42) * fadeInRef.current;
    const curB = border.material.opacity;
    border.material.opacity = curB + (borderTarget - curB) * 0.1;
  });
  /* eslint-enable react-hooks/immutability */

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
      <primitive object={border.line} />
    </group>
  );
}
