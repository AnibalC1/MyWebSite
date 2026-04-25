'use client';

import { useRef, useState, useCallback, useMemo, useEffect, Suspense, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { GLOBE_DEFS, GLOBE_CONNECTIONS, type GlobeDef } from '@/data/globes';
import { MEMORIES, type Memory } from '@/data/memories';

// ─── Constants ────────────────────────────────────────────────────────────────

const FOCUSED_VISUAL_RADIUS = 1.6; // all focused globes reach this world-space radius

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

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, globeActiveRef.current ? 0.92 : 0.55, 0.1);
  });

  return (
    <mesh
      ref={meshRef}
      position={tile.pos}
      quaternion={tile.quat}
      // Tiles: click only. Invisible to raycaster so only hitbox sphere fires hover events.
      raycast={() => null}
      onClick={(e) => { e.stopPropagation(); onSelect(memory); }}
    >
      <planeGeometry args={[tile.w, tile.h]} />
      <meshBasicMaterial map={texture} transparent opacity={0.55} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
});

// ─── Single Globe ─────────────────────────────────────────────────────────────

interface DragState {
  active: boolean;
  globeId: string | null;
  lastX: number;
  lastY: number;
  velX: number;
  velY: number;
  accDX: number;
  accDY: number;
}

// Per-globe momentum store — keyed by globe id
type MomentumStore = Record<string, { velX: number; velY: number }>;

interface GlobeProps {
  def: GlobeDef;
  textures: THREE.Texture[];
  memories: Memory[];
  hoveredIdRef: React.MutableRefObject<string | null>;
  dragRef: React.MutableRefObject<DragState>;
  momentumRef: React.MutableRefObject<MomentumStore>;
  onSelect: (m: Memory) => void;
  onHoverChange: (id: string | null) => void;
}

const Globe = memo(function Globe({
  def, textures, memories, hoveredIdRef, dragRef, momentumRef, onSelect, onHoverChange,
}: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * 100);
  const activeRef = useRef(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tiles = useMemo(() => buildLatLongGrid(def.radius), [def.radius]);
  const basePos = useMemo(() => new THREE.Vector3(...def.position), [def.position]);
  const orbR     = useMemo(() => Math.sqrt(basePos.x ** 2 + basePos.z ** 2), [basePos]);
  const orbPhase = useMemo(() => Math.atan2(basePos.z, basePos.x), [basePos]);

  // Normalize focus scale: all focused globes reach FOCUSED_VISUAL_RADIUS world units
  const focusedScale = FOCUSED_VISUAL_RADIUS / def.radius;

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(basePos.x, basePos.y, basePos.z);
    }
    // Init momentum slot
    momentumRef.current[def.id] = { velX: 0, velY: 0 };
  }, [basePos, def.id, momentumRef]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    t.current += delta;

    const isHovered = hoveredIdRef.current === def.id;
    const anyHovered = hoveredIdRef.current !== null;
    activeRef.current = isHovered;

    // Scale — all focused globes reach the same absolute visual size
    const targetScale = isHovered ? focusedScale : (anyHovered ? 0.72 : 1.0);
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, targetScale, 0.09));

    // Position
    const angle = t.current * def.orbitSpeed + orbPhase;
    const orbX = Math.cos(angle) * orbR;
    const orbZ = Math.sin(angle) * orbR;
    const fy = 0.20 * Math.sin(t.current * 0.38 + orbPhase * 1.3);

    if (isHovered) {
      g.position.x = THREE.MathUtils.lerp(g.position.x, 0, 0.07);
      g.position.y = THREE.MathUtils.lerp(g.position.y, 0, 0.07);
      g.position.z = THREE.MathUtils.lerp(g.position.z, 3.2, 0.07);
    } else {
      g.position.x = orbX;
      g.position.y = basePos.y + fy;
      g.position.z = THREE.MathUtils.lerp(g.position.z, orbZ + (anyHovered ? -1.2 : 0), 0.05);
    }

    // Rotation — each globe has its own isolated momentum
    const mom = momentumRef.current[def.id] ?? { velX: 0, velY: 0 };
    const drag = dragRef.current;

    if (drag.active && drag.globeId === def.id) {
      // This is the actively-dragged globe
      g.rotation.y += drag.accDX;
      g.rotation.x = THREE.MathUtils.clamp(g.rotation.x + drag.accDY, -1.1, 1.1);
      // Capture velocity for momentum when drag ends
      mom.velX = drag.accDX;
      mom.velY = drag.accDY;
      drag.accDX = 0;
      drag.accDY = 0;
    } else if (drag.globeId === def.id && (Math.abs(mom.velX) + Math.abs(mom.velY) > 0.0003)) {
      // Coast with momentum — ONLY for the globe that was dragged
      g.rotation.y += mom.velX;
      g.rotation.x = THREE.MathUtils.clamp(g.rotation.x + mom.velY, -1.1, 1.1);
      mom.velX *= 0.92;
      mom.velY *= 0.92;
    } else {
      // Auto-spin — all non-dragged globes
      g.rotation.y += delta * 0.055;
      g.rotation.x += delta * 0.018;
    }
  });

  const hasPhotos = memories.length > 0 && textures.length > 0;

  return (
    <group ref={groupRef}>
      {/* ── Invisible sphere hitbox — solid so it blocks raycasts through tile gaps ── */}
      <mesh
        onPointerEnter={(e) => { e.stopPropagation(); if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; } onHoverChange(def.id); }}
        onPointerLeave={(e) => { e.stopPropagation(); leaveTimer.current = setTimeout(() => { leaveTimer.current = null; if (hoveredIdRef.current === def.id) onHoverChange(null); }, 80); }}
      >
        <sphereGeometry args={[def.radius * 1.05, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* ── Photo tiles (click only, hover handled by hitbox sphere) ── */}
      {hasPhotos
        ? tiles.map((tile, i) => (
            <PhotoTile
              key={i}
              tile={tile}
              texture={textures[i % textures.length]}
              memory={memories[i % memories.length]}
              globeActiveRef={activeRef}
              onSelect={onSelect}
            />
          ))
        : (
            <mesh>
              <sphereGeometry args={[def.radius, 32, 32]} />
              <meshBasicMaterial color={def.color} transparent opacity={0.18} wireframe />
            </mesh>
          )
      }
    </group>
  );
});

// ─── Globe System ─────────────────────────────────────────────────────────────

const GlobeSystem = memo(function GlobeSystem({
  hoveredIdRef, dragRef, momentumRef, onSelect, onHoverChange,
}: {
  hoveredIdRef: React.MutableRefObject<string | null>;
  dragRef: React.MutableRefObject<DragState>;
  momentumRef: React.MutableRefObject<MomentumStore>;
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
          dragRef={dragRef}
          momentumRef={momentumRef}
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
  const exitCooldown = useRef<{ id: string; until: number } | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const dragRef = useRef<DragState>({
    active: false, globeId: null, lastX: 0, lastY: 0,
    velX: 0, velY: 0, accDX: 0, accDY: 0,
  });
  // Per-globe momentum — isolated so dragging one globe never affects others
  const momentumRef = useRef<MomentumStore>({});

  const handleHoverChange = useCallback((id: string | null) => {
    if (id === null) {
      // Leaving — set cooldown so the returning hitbox can't instantly re-trigger focus
      if (hoveredIdRef.current) {
        exitCooldown.current = { id: hoveredIdRef.current, until: Date.now() + 600 };
      }
      hoveredIdRef.current = null;
      setHoveredLabel(null);
    } else {
      // Entering — skip if this globe just exited (still in cooldown)
      if (exitCooldown.current?.id === id && Date.now() < exitCooldown.current.until) return;
      hoveredIdRef.current = id;
      setHoveredLabel(id);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const gid = hoveredIdRef.current;
    if (!gid) return;
    const d = dragRef.current;
    d.active = true; d.globeId = gid;
    d.lastX = e.clientX; d.lastY = e.clientY;
    d.velX = 0; d.velY = 0; d.accDX = 0; d.accDY = 0;
    // Reset this globe's momentum when a new drag starts
    if (momentumRef.current[gid]) {
      momentumRef.current[gid] = { velX: 0, velY: 0 };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouse.current = [(e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1];
    const d = dragRef.current;
    if (!d.active) return;
    const dx = (e.clientX - d.lastX) * 0.013;
    const dy = (e.clientY - d.lastY) * 0.009;
    d.lastX = e.clientX; d.lastY = e.clientY;
    d.accDX += dx; d.accDY += dy;
    d.velX = dx; d.velY = dy;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', cursor: 'default' }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
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
            dragRef={dragRef}
            momentumRef={momentumRef}
            onSelect={onSelect}
            onHoverChange={handleHoverChange}
          />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.4} luminanceThreshold={0.55} luminanceSmoothing={0.9} mipmapBlur kernelSize={KernelSize.MEDIUM} />
          <Vignette darkness={0.45} offset={0.3} />
        </EffectComposer>
      </Canvas>

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
