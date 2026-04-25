'use client';

import { useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { GLOBE_DEFS, GLOBE_CONNECTIONS, type GlobeDef } from '@/data/globes';
import { MEMORIES, type Memory } from '@/data/memories';

// ─── Lat-Long Grid Distribution ───────────────────────────────────────────────
// Distributes tiles in rows (latitude) × columns (longitude).
// Each tile is sized to fill its cell — zero gaps.

interface GridTile {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  w: number;
  h: number;
}

function buildLatLongGrid(radius: number): GridTile[] {
  const nRows = 10; // consistent density across all globe sizes
  const tiles: GridTile[] = [];
  const up = new THREE.Vector3(0, 0, 1); // plane default normal

  for (let row = 0; row < nRows; row++) {
    const theta = Math.PI * (row + 0.5) / nRows; // polar angle, 0=top, π=bottom
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const rowR = radius * sinT; // circle radius at this latitude

    const cellArcH = (Math.PI * radius) / nRows;
    const circumference = 2 * Math.PI * rowR;
    const nCols = Math.max(1, Math.round(circumference / cellArcH)); // square-ish cells
    const cellArcW = circumference / nCols;

    // Slight overlap (1.5%) to eliminate seam gaps
    const tileW = cellArcW * 1.015;
    const tileH = cellArcH * 1.015;

    for (let col = 0; col < nCols; col++) {
      const phi = (2 * Math.PI * col) / nCols + Math.PI / nCols; // offset half step
      const x = rowR * Math.cos(phi);
      const y = radius * cosT;
      const z = rowR * Math.sin(phi);

      const pos = new THREE.Vector3(x, y, z);
      const outward = pos.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(up, outward);

      tiles.push({ pos, quat, w: tileW, h: tileH });
    }
  }

  return tiles;
}

// ─── Camera Rig ───────────────────────────────────────────────────────────────

function CameraRig({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const { camera } = useThree();
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    const [mx, my] = mouse.current;
    camera.position.x += (mx * 0.55 - camera.position.x) * 0.035;
    camera.position.y += (-my * 0.38 + 0.08 * Math.sin(t.current * 0.27) - camera.position.y) * 0.035;
    camera.position.z += (7.5 - camera.position.z) * 0.025;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Star Field ───────────────────────────────────────────────────────────────

function StarField() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 600;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 20 + Math.random() * 14;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.04} sizeAttenuation transparent opacity={0.35} />
    </points>
  );
}

// ─── Globe Connections ────────────────────────────────────────────────────────

function GlobeConnections({ activeId }: { activeId: React.MutableRefObject<string | null> }) {
  const lineObjects = useMemo(() =>
    GLOBE_CONNECTIONS.map(([aId, bId]) => {
      const a = GLOBE_DEFS.find(g => g.id === aId)!;
      const b = GLOBE_DEFS.find(g => g.id === bId)!;
      const start = new THREE.Vector3(...a.position);
      const end = new THREE.Vector3(...b.position);
      const mid = start.clone().lerp(end, 0.5).multiplyScalar(1.06);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 32; i++) pts.push(curve.getPoint(i / 32));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: '#c9a84c', transparent: true, opacity: 0.08 });
      return { line: new THREE.Line(geo, mat), aId, bId };
    }),
  []);

  useFrame(() => {
    const active = activeId.current;
    lineObjects.forEach(({ line, aId, bId }) => {
      const mat = line.material as THREE.LineBasicMaterial;
      const connected = active && (aId === active || bId === active);
      const target = connected ? 0.5 : (active ? 0.02 : 0.08);
      mat.opacity += (target - mat.opacity) * 0.06;
    });
  });

  return (
    <group>
      {lineObjects.map(({ line }, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

// ─── Photo Tile ───────────────────────────────────────────────────────────────
// One photo panel on the globe surface. No glow — just the image.

function PhotoTile({
  tile, texture, memory, globeId, activeIdRef, onSelect,
}: {
  tile: GridTile;
  texture: THREE.Texture;
  memory: Memory;
  globeId: string;
  activeIdRef: React.MutableRefObject<string | null>;
  onSelect: (m: Memory) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hov, setHov] = useState(false);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const isActive = activeIdRef.current === globeId;
    const isOther = activeIdRef.current !== null && !isActive;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const targetOpacity = isOther ? 0.18 : (isActive ? (hov ? 1.0 : 0.88) : 0.72);
    mat.opacity += (targetOpacity - mat.opacity) * 0.07;
  });

  return (
    <mesh
      ref={meshRef}
      position={tile.pos}
      quaternion={tile.quat}
      onPointerOver={(e) => { e.stopPropagation(); setHov(true); }}
      onPointerOut={() => setHov(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (activeIdRef.current === globeId) onSelect(memory);
      }}
    >
      <planeGeometry args={[tile.w, tile.h]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.72}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Single Globe ─────────────────────────────────────────────────────────────

function Globe({
  def, textures, memories, activeIdRef, onSelect, onHover,
}: {
  def: GlobeDef;
  textures: THREE.Texture[];
  memories: Memory[];
  activeIdRef: React.MutableRefObject<string | null>;
  onSelect: (m: Memory) => void;
  onHover: (id: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * 100);
  const tiles = useMemo(() => buildLatLongGrid(def.radius), [def.radius]);

  useFrame((_, delta) => {
    t.current += delta;
    if (!groupRef.current) return;
    const g = groupRef.current;
    const isActive = activeIdRef.current === def.id;
    const isOther = activeIdRef.current !== null && !isActive;

    const targetScale = isActive ? 1.25 : (isOther ? 0.78 : 1.0);
    g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * 0.055);

    const floatY = 0.065 * Math.sin(t.current * 0.36 + def.position[0] * 1.2);
    const floatX = 0.025 * Math.cos(t.current * 0.21 + def.position[2]);
    const targetZ = isActive ? def.position[2] + 1.9 : (isOther ? def.position[2] - 0.6 : def.position[2]);

    g.position.x += (def.position[0] + floatX - g.position.x) * 0.04;
    g.position.y += (def.position[1] + floatY - g.position.y) * 0.04;
    g.position.z += (targetZ - g.position.z) * 0.04;

    // Slow spin — photo grid rotates as a unit
    g.rotation.y += delta * 0.06;
    g.rotation.x += delta * 0.02;
  });

  // Skip render if no photos
  if (memories.length === 0 || textures.length === 0) return null;

  return (
    <group
      ref={groupRef}
      position={def.position}
      onPointerOver={(e) => { e.stopPropagation(); onHover(def.id); }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        activeIdRef.current = activeIdRef.current === def.id ? null : def.id;
      }}
    >
      {tiles.map((tile, i) => {
        const mem = memories[i % memories.length];
        const tex = textures[i % textures.length];
        return (
          <PhotoTile
            key={i}
            tile={tile}
            texture={tex}
            memory={mem}
            globeId={def.id}
            activeIdRef={activeIdRef}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}

// ─── Globe System ─────────────────────────────────────────────────────────────

function GlobeSystem({
  activeIdRef, onSelect, onHover,
}: {
  activeIdRef: React.MutableRefObject<string | null>;
  onSelect: (m: Memory) => void;
  onHover: (id: string | null) => void;
}) {
  const globeMemories = useMemo(() =>
    GLOBE_DEFS.map(g => MEMORIES.filter(m => m.globeId === g.id)), []
  );
  const allPaths = useMemo(() =>
    globeMemories.flatMap(mems => mems.map(m => m.img)), [globeMemories]
  );
  const safePaths = allPaths.length > 0 ? allPaths : ['/images/photo-oq31-family-selfie.jpg'];
  const allTextures = useTexture(safePaths) as THREE.Texture[];

  let idx = 0;
  const globeTextures = globeMemories.map(mems => mems.map(() => allTextures[idx++]));

  return (
    <group>
      <StarField />
      <GlobeConnections activeId={activeIdRef} />
      {GLOBE_DEFS.map((def, i) => (
        <Globe
          key={def.id}
          def={def}
          textures={globeTextures[i]}
          memories={globeMemories[i]}
          activeIdRef={activeIdRef}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

// ─── Exported Scene ───────────────────────────────────────────────────────────

export interface GlobeSceneProps {
  onSelect: (m: Memory) => void;
}

export function GlobeScene({ onSelect }: GlobeSceneProps) {
  const mouse = useRef<[number, number]>([0, 0]);
  const activeIdRef = useRef<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouse.current = [
      (e.clientX / window.innerWidth) * 2 - 1,
      (e.clientY / window.innerHeight) * 2 - 1,
    ];
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} onMouseMove={handleMouseMove}>
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 50, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <CameraRig mouse={mouse} />
        <Suspense fallback={null}>
          <GlobeSystem
            activeIdRef={activeIdRef}
            onSelect={onSelect}
            onHover={setHoveredId}
          />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.35}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.9}
            mipmapBlur
            kernelSize={KernelSize.MEDIUM}
          />
          <Vignette darkness={0.48} offset={0.3} />
        </EffectComposer>
      </Canvas>

      {/* Globe labels */}
      {GLOBE_DEFS.map(def => (
        <div
          key={def.id}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            opacity: hoveredId === def.id ? 0.9 : 0.25,
            transform: `translate(-50%, -50%) ${hoveredId === def.id ? 'scale(1.08)' : 'scale(1)'}`,
            color: '#ffffff',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '0.68rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase' as const,
            left: `${50 + def.position[0] * 9.2}%`,
            top: `${50 - def.position[1] * 9.8}%`,
          }}
        >
          {def.label}
        </div>
      ))}
    </div>
  );
}
