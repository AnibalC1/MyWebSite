'use client';

import { useRef, useState, useCallback, useMemo, useEffect, Suspense, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
    const cellH = (Math.PI * radius) / nRows;
    const nCols = Math.max(1, Math.round((2 * Math.PI * rowR) / cellH));
    const cellW = (2 * Math.PI * rowR) / nCols;
    for (let col = 0; col < nCols; col++) {
      const phi = (2 * Math.PI * col) / nCols + Math.PI / nCols;
      const pos = new THREE.Vector3(rowR * Math.cos(phi), radius * cosT, rowR * Math.sin(phi));
      const quat = new THREE.Quaternion().setFromUnitVectors(up, pos.clone().normalize());
      tiles.push({ pos, quat, w: cellW * 1.02, h: cellH * 1.02 });
    }
  }
  return tiles;
}

// ─── Star Field ───────────────────────────────────────────────────────────────

function StarField() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 600;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 20 + Math.random() * 14;
      pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.04} sizeAttenuation transparent opacity={0.3} />
    </points>
  );
}

// ─── Globe Connections ────────────────────────────────────────────────────────

function GlobeConnections({ hoveredIdRef }: { hoveredIdRef: React.MutableRefObject<string | null> }) {
  const lineObjects = useMemo(() =>
    GLOBE_CONNECTIONS.map(([aId, bId]) => {
      const a = GLOBE_DEFS.find(g => g.id === aId)!;
      const b = GLOBE_DEFS.find(g => g.id === bId)!;
      const s = new THREE.Vector3(...a.position);
      const e = new THREE.Vector3(...b.position);
      const m = s.clone().lerp(e, 0.5).multiplyScalar(1.06);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 32; i++) pts.push(new THREE.QuadraticBezierCurve3(s, m, e).getPoint(i / 32));
      const mat = new THREE.LineBasicMaterial({ color: '#c9a84c', transparent: true, opacity: 0.07 });
      return { line: new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat), aId, bId };
    }), []);
  useFrame(() => {
    const active = hoveredIdRef.current;
    lineObjects.forEach(({ line, aId, bId }) => {
      const mat = line.material as THREE.LineBasicMaterial;
      const connected = active && (aId === active || bId === active);
      mat.opacity += ((connected ? 0.6 : active ? 0.01 : 0.07) - mat.opacity) * 0.07;
    });
  });
  return <group>{lineObjects.map(({ line }, i) => <primitive key={i} object={line} />)}</group>;
}

// ─── Photo Tile ───────────────────────────────────────────────────────────────

interface TileProps {
  tile: GridTile;
  texture: THREE.Texture;
  memory: Memory;
  globeActiveRef: React.MutableRefObject<boolean>;
  onSelect: (m: Memory) => void;
}

const PhotoTile = memo(function PhotoTile({ tile, texture, memory, globeActiveRef, onSelect }: TileProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hovRef = useRef(false);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const active = globeActiveRef.current;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, active ? (hovRef.current ? 1.0 : 0.88) : 0.55, 0.1);
  });

  return (
    <mesh
      ref={meshRef}
      position={tile.pos}
      quaternion={tile.quat}
      // NO stopPropagation on hover — must bubble to Globe group
      onPointerOver={() => { hovRef.current = true; }}
      onPointerOut={() => { hovRef.current = false; }}
      onClick={(e) => { e.stopPropagation(); onSelect(memory); }}
    >
      <planeGeometry args={[tile.w, tile.h]} />
      <meshBasicMaterial map={texture} transparent opacity={0.55} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
});

// ─── Single Globe ─────────────────────────────────────────────────────────────

interface GlobeProps {
  def: GlobeDef;
  textures: THREE.Texture[];
  memories: Memory[];
  hoveredIdRef: React.MutableRefObject<string | null>;
  onSelect: (m: Memory) => void;
  onHoverChange: (id: string | null) => void;
}

const Globe = memo(function Globe({ def, textures, memories, hoveredIdRef, onSelect, onHoverChange }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * 100);
  const activeRef = useRef(false); // shared with PhotoTile for opacity
  const tiles = useMemo(() => buildLatLongGrid(def.radius), [def.radius]);
  const basePos = useMemo(() => new THREE.Vector3(...def.position), [def.position]);

  // Set initial position imperatively — never via prop, so React re-renders can't reset it
  useEffect(() => {
    if (groupRef.current) groupRef.current.position.copy(basePos);
  }, [basePos]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    t.current += delta;

    const isHovered = hoveredIdRef.current === def.id;
    const anyHovered = hoveredIdRef.current !== null;
    activeRef.current = isHovered;

    // Scale — hover: 1.35x, others shrink to 0.82x, rest: 1.0
    const targetScale = isHovered ? 1.35 : (anyHovered ? 0.82 : 1.0);
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, targetScale, 0.08));

    // Float — independent per globe, clearly visible
    const fy = 0.22 * Math.sin(t.current * 0.38 + def.position[0] * 1.3);
    const fx = 0.11 * Math.cos(t.current * 0.26 + def.position[2] * 0.9);
    const fz = 0.07 * Math.sin(t.current * 0.31 + def.position[1] * 1.1);

    // Z — hovered globe comes 2 units forward, others push back
    const targetZ = basePos.z + (isHovered ? 2.0 : (anyHovered ? -0.7 : 0.0));

    g.position.x = basePos.x + fx;
    g.position.y = basePos.y + fy;
    g.position.z = THREE.MathUtils.lerp(g.position.z, targetZ + fz, 0.06);

    // Slow spin
    g.rotation.y += delta * 0.055;
    g.rotation.x += delta * 0.018;
  });

  if (!memories.length || !textures.length) return null;

  return (
    // NO position prop — position managed entirely in useFrame/useEffect
    <group
      ref={groupRef}
      onPointerOver={(e) => { e.stopPropagation(); onHoverChange(def.id); }}
      onPointerOut={(e)  => { e.stopPropagation(); onHoverChange(null); }}
      onClick={(e) => { e.stopPropagation(); }}
    >
      {tiles.map((tile, i) => (
        <PhotoTile
          key={i}
          tile={tile}
          texture={textures[i % textures.length]}
          memory={memories[i % memories.length]}
          globeActiveRef={activeRef}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
});

// ─── Globe System ─────────────────────────────────────────────────────────────

const GlobeSystem = memo(function GlobeSystem({
  hoveredIdRef, onSelect, onHoverChange,
}: {
  hoveredIdRef: React.MutableRefObject<string | null>;
  onSelect: (m: Memory) => void;
  onHoverChange: (id: string | null) => void;
}) {
  const globeMemories = useMemo(() =>
    GLOBE_DEFS.map(g => MEMORIES.filter(m => m.globeId === g.id)), []);
  const allPaths = useMemo(() =>
    globeMemories.flatMap(mems => mems.map(m => m.img)), [globeMemories]);
  const safePaths = allPaths.length > 0 ? allPaths : ['/images/photo-oq31-family-selfie.jpg'];
  const allTextures = useTexture(safePaths) as THREE.Texture[];

  let idx = 0;
  const globeTextures = globeMemories.map(mems => mems.map(() => allTextures[idx++]));

  return (
    <group>
      <StarField />
      <GlobeConnections hoveredIdRef={hoveredIdRef} />
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
});

// ─── Camera Rig ───────────────────────────────────────────────────────────────

function CameraRig({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const t = useRef(0);
  useFrame((state, delta) => {
    t.current += delta;
    const [mx, my] = mouse.current;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mx * 0.6, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, -my * 0.4 + 0.1 * Math.sin(t.current * 0.3), 0.04);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 7.5, 0.03);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Exported Scene ───────────────────────────────────────────────────────────

export interface GlobeSceneProps {
  onSelect: (m: Memory) => void;
}

export function GlobeScene({ onSelect }: GlobeSceneProps) {
  const mouse = useRef<[number, number]>([0, 0]);
  const hoveredIdRef = useRef<string | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouse.current = [
      (e.clientX / window.innerWidth) * 2 - 1,
      (e.clientY / window.innerHeight) * 2 - 1,
    ];
  }, []);

  // Decouple: ref update (for useFrame) vs state update (for DOM labels)
  const handleHoverChange = useCallback((id: string | null) => {
    hoveredIdRef.current = id;
    setHoveredLabel(id);
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
          <Bloom intensity={0.4} luminanceThreshold={0.55} luminanceSmoothing={0.9} mipmapBlur kernelSize={KernelSize.MEDIUM} />
          <Vignette darkness={0.45} offset={0.3} />
        </EffectComposer>
      </Canvas>

      {/* DOM labels — only these re-render on hover */}
      {GLOBE_DEFS.map(def => (
        <div
          key={def.id}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: hoveredLabel === def.id ? 1 : 0.22,
            transform: `translate(-50%, -50%) scale(${hoveredLabel === def.id ? 1.12 : 1})`,
            color: '#fff',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '0.65rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase' as const,
            left: `${50 + def.position[0] * 9}%`,
            top: `${50 - def.position[1] * 9.5}%`,
          }}
        >
          {def.label}
        </div>
      ))}
    </div>
  );
}
