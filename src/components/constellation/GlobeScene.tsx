'use client';

import { useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { GLOBE_DEFS, GLOBE_CONNECTIONS, type GlobeDef } from '@/data/globes';
import { MEMORIES, type Memory } from '@/data/memories';

// ─── Lat-Long Grid ────────────────────────────────────────────────────────────

interface GridTile {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  w: number;
  h: number;
}

function buildLatLongGrid(radius: number): GridTile[] {
  const nRows = 10;
  const tiles: GridTile[] = [];
  const up = new THREE.Vector3(0, 0, 1);

  for (let row = 0; row < nRows; row++) {
    const theta = Math.PI * (row + 0.5) / nRows;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const rowR = radius * sinT;
    const cellArcH = (Math.PI * radius) / nRows;
    const circumference = 2 * Math.PI * rowR;
    const nCols = Math.max(1, Math.round(circumference / cellArcH));
    const cellArcW = circumference / nCols;
    const tileW = cellArcW * 1.015;
    const tileH = cellArcH * 1.015;

    for (let col = 0; col < nCols; col++) {
      const phi = (2 * Math.PI * col) / nCols + Math.PI / nCols;
      const x = rowR * Math.cos(phi);
      const y = radius * cosT;
      const z = rowR * Math.sin(phi);
      const pos = new THREE.Vector3(x, y, z);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, pos.clone().normalize());
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
    camera.position.x += (mx * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.4 + 0.1 * Math.sin(t.current * 0.3) - camera.position.y) * 0.04;
    camera.position.z += (7.5 - camera.position.z) * 0.03;
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

function GlobeConnections({ hoveredId }: { hoveredId: React.MutableRefObject<string | null> }) {
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
    const active = hoveredId.current;
    lineObjects.forEach(({ line, aId, bId }) => {
      const mat = line.material as THREE.LineBasicMaterial;
      const connected = active && (aId === active || bId === active);
      const target = connected ? 0.55 : (active ? 0.02 : 0.08);
      mat.opacity += (target - mat.opacity) * 0.07;
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

function PhotoTile({
  tile, texture, memory, isGlobeActive, onSelect,
}: {
  tile: GridTile;
  texture: THREE.Texture;
  memory: Memory;
  isGlobeActive: React.MutableRefObject<boolean>;
  onSelect: (m: Memory) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hov, setHov] = useState(false);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const active = isGlobeActive.current;
    // At rest: 0.55 opacity so photos are visible. Active: brighter.
    const targetOpacity = active ? (hov ? 1.0 : 0.88) : 0.55;
    mat.opacity += (targetOpacity - mat.opacity) * 0.08;
    const targetScale = active && hov ? 1.15 : 1.0;
    mesh.scale.setScalar(mesh.scale.x + (targetScale - mesh.scale.x) * 0.1);
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
        onSelect(memory); // always clickable — no gate
      }}
    >
      <planeGeometry args={[tile.w, tile.h]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.55}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Single Globe ─────────────────────────────────────────────────────────────

function Globe({
  def, textures, memories, hoveredIdRef, onSelect, onHoverChange,
}: {
  def: GlobeDef;
  textures: THREE.Texture[];
  memories: Memory[];
  hoveredIdRef: React.MutableRefObject<string | null>;
  onSelect: (m: Memory) => void;
  onHoverChange: (id: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * 100);
  // Per-globe: is this globe currently hovered/active?
  const isActiveRef = useRef(false);
  const tiles = useMemo(() => buildLatLongGrid(def.radius), [def.radius]);

  useFrame((_, delta) => {
    t.current += delta;
    if (!groupRef.current) return;
    const g = groupRef.current;

    const isHovered = hoveredIdRef.current === def.id;
    const anyHovered = hoveredIdRef.current !== null;
    isActiveRef.current = isHovered;

    // Scale: hover = 1.3x, others shrink slightly, rest = 1.0
    const targetScale = isHovered ? 1.3 : (anyHovered ? 0.85 : 1.0);
    g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * 0.07);

    // Float: organic breathing motion — clearly visible
    const floatY = 0.18 * Math.sin(t.current * 0.42 + def.position[0] * 1.4);
    const floatX = 0.09 * Math.cos(t.current * 0.28 + def.position[2] * 0.8);
    const floatZ = 0.06 * Math.sin(t.current * 0.35 + def.position[1]);

    // Z push: hovered globe comes toward camera, others pull back
    const baseZ = def.position[2];
    const targetZ = isHovered ? baseZ + 1.6 : (anyHovered ? baseZ - 0.5 : baseZ);

    g.position.x = def.position[0] + floatX;
    g.position.y = def.position[1] + floatY;
    g.position.z += (targetZ + floatZ - g.position.z) * 0.05;

    // Slow spin
    g.rotation.y += delta * 0.06;
    g.rotation.x += delta * 0.02;
  });

  if (memories.length === 0 || textures.length === 0) return null;

  return (
    <group
      ref={groupRef}
      position={def.position}
      onPointerOver={(e) => { e.stopPropagation(); onHoverChange(def.id); }}
      onPointerOut={(e) => { e.stopPropagation(); onHoverChange(null); }}
      onClick={(e) => { e.stopPropagation(); }} // absorb globe clicks (photo tiles handle theirs)
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
            isGlobeActive={isActiveRef}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}

// ─── Globe System ─────────────────────────────────────────────────────────────

function GlobeSystem({
  hoveredIdRef, onSelect, onHoverChange,
}: {
  hoveredIdRef: React.MutableRefObject<string | null>;
  onSelect: (m: Memory) => void;
  onHoverChange: (id: string | null) => void;
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
      <GlobeConnections hoveredId={hoveredIdRef} />
      {GLOBE_DEFS.map((def, i) => (
        <Globe
          key={def.id}
          def={def}
          textures={globeTextures[i]}
          memories={globeMemories[i]}
          hoveredIdRef={hoveredIdRef}
          onSelect={onSelect}
          onHoverChange={onHoverChange}
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
  // Single shared ref for hovered globe — readable inside useFrame without stale closure
  const hoveredIdRef = useRef<string | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouse.current = [
      (e.clientX / window.innerWidth) * 2 - 1,
      (e.clientY / window.innerHeight) * 2 - 1,
    ];
  }, []);

  const handleHoverChange = useCallback((id: string | null) => {
    hoveredIdRef.current = id;
    setHoveredLabel(id); // triggers label re-render only
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
            hoveredIdRef={hoveredIdRef}
            onSelect={onSelect}
            onHoverChange={handleHoverChange}
          />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
            mipmapBlur
            kernelSize={KernelSize.MEDIUM}
          />
          <Vignette darkness={0.45} offset={0.3} />
        </EffectComposer>
      </Canvas>

      {/* Globe labels */}
      {GLOBE_DEFS.map(def => (
        <div
          key={def.id}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
            opacity: hoveredLabel === def.id ? 0.95 : 0.28,
            transform: `translate(-50%, -50%) ${hoveredLabel === def.id ? 'scale(1.1)' : 'scale(1)'}`,
            color: '#ffffff',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '0.68rem',
            letterSpacing: '0.32em',
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
