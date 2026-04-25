'use client';

import { useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { GLOBE_DEFS, GLOBE_CONNECTIONS, type GlobeDef } from '@/data/globes';
import { MEMORIES, type Memory } from '@/data/memories';

// ─── Fibonacci Sphere Distribution ───────────────────────────────────────────

function fibonacciSphere(n: number, radius: number): THREE.Vector3[] {
  if (n === 0) return [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    return new THREE.Vector3(
      Math.cos(theta) * r * radius,
      y * radius,
      Math.sin(theta) * r * radius,
    );
  });
}

// ─── Holographic Rim Shader ───────────────────────────────────────────────────

const rimVert = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const rimFrag = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float ndotv = max(dot(vNormal, vViewDir), 0.0);
    float fresnel = pow(1.0 - ndotv, 3.2);
    float pulse = 1.0 + 0.12 * sin(uTime * 1.5);
    gl_FragColor = vec4(uColor, fresnel * uOpacity * pulse);
  }
`;

// ─── Camera Rig ───────────────────────────────────────────────────────────────

function CameraRig({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const { camera } = useThree();
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    const [mx, my] = mouse.current;
    camera.position.x += (mx * 0.55 - camera.position.x) * 0.035;
    camera.position.y += (-my * 0.38 + 0.1 * Math.sin(t.current * 0.27) - camera.position.y) * 0.035;
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
      <pointsMaterial color="#d4c5a9" size={0.045} sizeAttenuation transparent opacity={0.45} />
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
      const target = connected ? 0.55 : (active ? 0.02 : 0.08);
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

// ─── Surface Photo Fragment ───────────────────────────────────────────────────
// Each fragment sits ON the sphere surface, normal facing outward.
// The collection of fragments defines the globe shape.

function SurfaceFragment({
  localPos, quat, texture, memory,
  planeW, planeH,
  globeId, activeIdRef, onSelect,
}: {
  localPos: THREE.Vector3;
  quat: THREE.Quaternion;
  texture: THREE.Texture;
  memory: Memory;
  planeW: number;
  planeH: number;
  globeId: string;
  activeIdRef: React.MutableRefObject<string | null>;
  onSelect: (m: Memory) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hov, setHov] = useState(false);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const isActive = activeIdRef.current === globeId;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const targetOpacity = isActive ? (hov ? 0.92 : 0.68) : 0.14;
    mat.opacity += (targetOpacity - mat.opacity) * 0.07;
    const targetScale = isActive ? (hov ? 1.18 : 1.0) : 0.88;
    mesh.scale.setScalar(mesh.scale.x + (targetScale - mesh.scale.x) * 0.09);
  });

  return (
    <mesh
      ref={meshRef}
      position={localPos}
      quaternion={quat}
      onPointerOver={(e) => { e.stopPropagation(); setHov(true); }}
      onPointerOut={() => setHov(false)}
      onClick={(e) => { e.stopPropagation(); if (activeIdRef.current === globeId) onSelect(memory); }}
    >
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.14}
        side={THREE.DoubleSide}
        toneMapped={false}
        depthWrite={false}
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

  // Number of surface fragments — more = denser sphere
  const fragCount = memories.length > 0 ? Math.max(memories.length * 5, 18) : 0;

  // Fibonacci sphere positions (local space, relative to globe center)
  const surfacePoints = useMemo(
    () => fibonacciSphere(fragCount, def.radius),
    [fragCount, def.radius]
  );

  // Quaternions: rotate each plane so +Z aligns with outward sphere normal
  const quats = useMemo(
    () => surfacePoints.map(p =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        p.clone().normalize()
      )
    ),
    [surfacePoints]
  );

  // Photo plane size — sized to nearly tile the sphere surface
  const planeW = def.radius * 0.56;
  const planeH = def.radius * 0.38;

  // Rim material (holographic edge glow)
  const rimMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(def.color) },
      uOpacity: { value: 0.75 },
      uTime: { value: 0 },
    },
    vertexShader: rimVert,
    fragmentShader: rimFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  }), [def.color]);

  useFrame((_, delta) => {
    t.current += delta;
    rimMat.uniforms.uTime.value = t.current;

    const isActive = activeIdRef.current === def.id;
    const isOther = activeIdRef.current !== null && !isActive;

    if (groupRef.current) {
      const g = groupRef.current;
      const targetScale = isActive ? 1.28 : (isOther ? 0.76 : 1.0);
      g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * 0.055);

      // Organic float
      const floatY = 0.07 * Math.sin(t.current * 0.38 + def.position[0] * 1.2);
      const floatX = 0.028 * Math.cos(t.current * 0.22 + def.position[2]);
      const targetZ = isActive ? def.position[2] + 1.9 : (isOther ? def.position[2] - 0.65 : def.position[2]);

      g.position.x += (def.position[0] + floatX - g.position.x) * 0.04;
      g.position.y += (def.position[1] + floatY - g.position.y) * 0.04;
      g.position.z += (targetZ - g.position.z) * 0.04;

      // Slow rotation — fragments orbit as a unit
      g.rotation.y += delta * 0.065;
      g.rotation.x += delta * 0.022;
    }

    // Rim opacity — fade when another globe is active
    const targetRimOpacity = isOther ? 0.22 : 0.75;
    rimMat.uniforms.uOpacity.value += (targetRimOpacity - rimMat.uniforms.uOpacity.value) * 0.055;
  });

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
      {/* Ambient glow core — implies presence even when fragments are sparse */}
      <mesh>
        <sphereGeometry args={[def.radius * 0.38, 16, 16]} />
        <meshBasicMaterial color={def.color} transparent opacity={0.11} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Point light — gives depth to fragments */}
      <pointLight color={def.color} intensity={0.28} distance={def.radius * 4} decay={2} />

      {/* Surface photo fragments — THESE ARE THE GLOBE */}
      {surfacePoints.map((pos, i) => {
        const mem = memories[i % memories.length];
        const tex = textures[i % textures.length];
        return tex ? (
          <SurfaceFragment
            key={i}
            localPos={pos}
            quat={quats[i]}
            texture={tex}
            memory={mem}
            planeW={planeW}
            planeH={planeH}
            globeId={def.id}
            activeIdRef={activeIdRef}
            onSelect={onSelect}
          />
        ) : null;
      })}

      {/* Holographic rim — subtle edge glow only, sphere shape implied */}
      <mesh>
        <sphereGeometry args={[def.radius * 1.04, 48, 48]} />
        <primitive object={rimMat} attach="material" />
      </mesh>

      {/* Outer halo — soft bloom catch */}
      <mesh>
        <sphereGeometry args={[def.radius * 1.32, 24, 24]} />
        <meshBasicMaterial
          color={def.color}
          transparent
          opacity={0.028}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─── Globe System (loads all textures) ───────────────────────────────────────

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
  // Always pass at least one path to useTexture
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
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
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
            intensity={1.2}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.85}
            mipmapBlur
            kernelSize={KernelSize.LARGE}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={new THREE.Vector2(0.0012, 0.0012)}
            radialModulation={true}
            modulationOffset={0.22}
          />
          <Vignette darkness={0.5} offset={0.28} />
        </EffectComposer>
      </Canvas>

      {/* DOM label overlay */}
      {GLOBE_DEFS.map(def => (
        <div
          key={def.id}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            opacity: hoveredId === def.id ? 0.95 : 0.28,
            transform: `translate(-50%, -50%) ${hoveredId === def.id ? 'scale(1.1)' : 'scale(1)'}`,
            color: def.color,
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '0.7rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase' as const,
            textShadow: `0 0 16px ${def.color}aa, 0 0 32px ${def.color}44`,
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
