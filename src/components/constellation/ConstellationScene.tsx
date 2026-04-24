'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Memory, MEMORIES } from '@/data/memories';

// Fibonacci sphere distribution
function fibonacciSphere(count: number, radius: number): [number, number, number][] {
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

// Star field particles for depth
function StarField() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial size={0.012} color="#f0ede8" transparent opacity={0.25} sizeAttenuation />
    </points>
  );
}

// Ambient glow sphere at center
function GlowCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.03 + Math.sin(clock.elapsedTime * 0.5) * 0.01;
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.8, 32, 32]} />
      <meshBasicMaterial color="#c9a84c" transparent opacity={0.03} side={THREE.BackSide} />
    </mesh>
  );
}

// Individual floating image fragment
function MemoryFragment({
  texture,
  memory,
  position,
  tilt,
  phaseOffset,
  onSelect,
}: {
  texture: THREE.Texture;
  memory: Memory;
  position: [number, number, number];
  tilt: [number, number, number];
  phaseOffset: number;
  onSelect: (m: Memory) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hoveredRef = useRef(false);
  const opacityRef = useRef(0.12);
  const scaleRef = useRef(1.0);
  const zOffsetRef = useRef(0);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;

    const hov = hoveredRef.current;
    const tgtOpacity = hov ? 0.92 : 0.12;
    const tgtScale   = hov ? 2.0  : 1.0;
    const tgtZ       = hov ? 0.6  : 0;

    const spd = 0.055;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, tgtOpacity, spd);
    scaleRef.current   = THREE.MathUtils.lerp(scaleRef.current, tgtScale, spd);
    zOffsetRef.current = THREE.MathUtils.lerp(zOffsetRef.current, tgtZ, spd);

    mat.opacity = opacityRef.current;
    meshRef.current.scale.setScalar(scaleRef.current);

    // Subtle organic drift
    const t = clock.elapsedTime;
    const driftY = Math.sin(t * 0.35 + phaseOffset) * 0.018;
    const driftX = Math.cos(t * 0.28 + phaseOffset * 1.3) * 0.010;
    meshRef.current.position.set(
      position[0] + driftX,
      position[1] + driftY,
      position[2] + zOffsetRef.current,
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={tilt}
      onClick={(e) => { e.stopPropagation(); onSelect(memory); }}
      onPointerOver={(e) => {
        e.stopPropagation();
        hoveredRef.current = true;
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        hoveredRef.current = false;
        document.body.style.cursor = 'auto';
      }}
    >
      <planeGeometry args={[0.52, 0.39]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// The globe — all fragments orbiting together
function MemoryGlobe({ onSelect }: { onSelect: (m: Memory) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const textures = useTexture(MEMORIES.map((m) => m.img)) as THREE.Texture[];

  const positions = useMemo(() => fibonacciSphere(MEMORIES.length, 3.0), []);
  const tilts = useMemo<[number, number, number][]>(() =>
    MEMORIES.map((_, i) => [
      ((i * 73.1)  % 50 - 25) * (Math.PI / 180),
      ((i * 137.5) % 70 - 35) * (Math.PI / 180),
      ((i * 59.3)  % 40 - 20) * (Math.PI / 180),
    ]), []
  );
  const phases = useMemo(() => MEMORIES.map((_, i) => i * 0.79), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.055;
    groupRef.current.rotation.x = Math.sin(t * 0.022) * 0.09;
  });

  return (
    <group ref={groupRef}>
      {MEMORIES.map((memory, i) => (
        <MemoryFragment
          key={memory.id}
          texture={textures[i]}
          memory={memory}
          position={positions[i]}
          tilt={tilts[i]}
          phaseOffset={phases[i]}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

export default function ConstellationScene({ onSelect }: { onSelect: (m: Memory) => void }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.5], fov: 52 }}
      style={{ background: 'transparent' }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <StarField />
        <GlowCore />
        <MemoryGlobe onSelect={onSelect} />
      </Suspense>
    </Canvas>
  );
}
