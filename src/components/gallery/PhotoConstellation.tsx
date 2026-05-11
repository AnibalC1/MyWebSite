'use client';

import { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import {
  CLUSTER_ANCHORS,
  CLUSTER_BY_ID,
  sampleConstellation,
  photoPosition,
  type GalleryPhoto,
  type ClusterAnchor,
} from '@/lib/gallery';
import PhotoCard from './PhotoCard';
import ConstellationLines from './ConstellationLines';

type PlacedPhoto = {
  photo: GalleryPhoto;
  anchor: ClusterAnchor;
  position: [number, number, number];
  bobSeed: number;
};

type Props = {
  activeCluster: string | null;
  focusCluster: string | null;
  onSelectPhoto: (photo: GalleryPhoto) => void;
  onSelectCluster: (cluster: string) => void;
};

function buildPlacements(): PlacedPhoto[] {
  const sample = sampleConstellation(14);
  const byCluster = new Map<string, GalleryPhoto[]>();
  for (const p of sample) {
    if (!byCluster.has(p.cluster)) byCluster.set(p.cluster, []);
    byCluster.get(p.cluster)!.push(p);
  }
  const placed: PlacedPhoto[] = [];
  for (const anchor of CLUSTER_ANCHORS) {
    const list = byCluster.get(anchor.id) ?? [];
    list.forEach((photo, i) => {
      placed.push({
        photo,
        anchor,
        position: photoPosition(anchor, i, list.length),
        bobSeed: (i * 17.3 + anchor.position[0] * 3.1) % (Math.PI * 2),
      });
    });
  }
  return placed;
}

function ClusterLabel({
  anchor,
  active,
  onClick,
}: {
  anchor: ClusterAnchor;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Html
      position={anchor.position}
      center
      distanceFactor={9}
      style={{ pointerEvents: 'auto', userSelect: 'none' }}
    >
      <button
        onClick={onClick}
        style={{
          background: 'transparent',
          border: 'none',
          color: active ? '#c9a96e' : 'rgba(241,237,230,0.8)',
          fontFamily: 'var(--font-display, Cormorant Garamond)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1.45rem',
          letterSpacing: '0.01em',
          cursor: 'pointer',
          padding: '0.4rem 0.7rem',
          textShadow: '0 0 28px rgba(10,10,11,0.92), 0 0 8px rgba(10,10,11,0.95)',
          transition: 'color 300ms, transform 300ms',
          transform: active ? 'scale(1.08)' : 'scale(1)',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#c9a96e')}
        onMouseLeave={(e) => (e.currentTarget.style.color = active ? '#c9a96e' : 'rgba(241,237,230,0.8)')}
      >
        {anchor.label}
      </button>
    </Html>
  );
}

function SceneContents({ activeCluster, focusCluster, onSelectPhoto, onSelectCluster }: Props) {
  const placements = useMemo(() => buildPlacements(), []);
  const groupRef = useRef<THREE.Group>(null);
  const { camera, pointer } = useThree();
  const lookTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const camTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 11));

  useEffect(() => {
    if (focusCluster) {
      const c = CLUSTER_BY_ID[focusCluster];
      if (c) {
        lookTargetRef.current.set(...c.position);
        // Pull the camera toward this cluster along the line from origin → cluster,
        // offset back by 5 units so we don't end up inside the cluster.
        const dir = new THREE.Vector3(...c.position);
        const dist = dir.length();
        if (dist > 0.01) dir.divideScalar(dist);
        else dir.set(0, 0, 1);
        camTargetRef.current
          .copy(new THREE.Vector3(...c.position))
          .add(dir.multiplyScalar(5));
      }
    } else {
      lookTargetRef.current.set(0, 0, 0);
      camTargetRef.current.set(0, 0, 11);
    }
  }, [focusCluster]);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      const rx = -pointer.y * 0.14;
      const ry = pointer.x * 0.2;
      groupRef.current.rotation.x += (rx - groupRef.current.rotation.x) * 0.04;
      groupRef.current.rotation.y += (ry - groupRef.current.rotation.y) * 0.04;
      // Idle slow drift
      groupRef.current.rotation.y += delta * 0.012;
    }
    // Camera easing toward target
    camera.position.lerp(camTargetRef.current, 0.045);
    camera.lookAt(lookTargetRef.current);
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <Stars radius={80} depth={50} count={1200} factor={3.2} fade speed={0.4} saturation={0} />

      <group ref={groupRef}>
        <ConstellationLines
          lines={placements.map(p => ({ anchor: p.anchor, position: p.position }))}
          activeCluster={activeCluster}
        />

        {placements.map((p) => (
          <Suspense key={p.photo.src} fallback={null}>
            <PhotoCard
              photo={p.photo}
              position={p.position}
              bobSeed={p.bobSeed}
              faded={!!activeCluster && activeCluster !== p.photo.cluster}
              highlighted={false}
              onClick={() => onSelectPhoto(p.photo)}
              onHover={() => {}}
            />
          </Suspense>
        ))}

        {CLUSTER_ANCHORS.map((a) => (
          <ClusterLabel
            key={a.id}
            anchor={a}
            active={activeCluster === a.id || focusCluster === a.id}
            onClick={() => onSelectCluster(a.id)}
          />
        ))}
      </group>

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.5} luminanceThreshold={0.6} luminanceSmoothing={0.55} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.88} />
      </EffectComposer>
    </>
  );
}

export default function PhotoConstellation(props: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 11], fov: 50, near: 0.1, far: 200 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'radial-gradient(ellipse at center, #0c0c10 0%, #050507 65%, #020203 100%)',
      }}
    >
      <Suspense fallback={null}>
        <SceneContents {...props} />
      </Suspense>
    </Canvas>
  );
}
