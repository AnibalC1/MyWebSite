'use client';

import { useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { GLOBE_DEFS, GLOBE_CONNECTIONS, type GlobeDef } from '@/data/globes';
import { MEMORIES, type Memory } from '@/data/memories';

// ─── Holographic Globe Shader ──────────────────────────────────────────────────

const holoVert = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const holoFrag = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    float ndotv = max(dot(vNormal, vViewDir), 0.0);
    float fresnel = pow(1.0 - ndotv, 2.8);
    float scan = sin(vUv.y * 90.0 - uTime * 0.8) * 0.05 + 0.95;
    vec2 grid = abs(fract(vUv * 14.0) - 0.5);
    float gridLine = min(grid.x, grid.y);
    float gridMask = 1.0 - smoothstep(0.0, 0.045, gridLine);
    float hue = mod(ndotv * 0.45 + uTime * 0.04, 1.0);
    vec3 iriColor = hsl2rgb(vec3(hue, 0.55, 0.65));
    float pulse = 1.0 + 0.1 * sin(uTime * 1.6);
    vec3 baseColor = mix(uColor, iriColor, fresnel * 0.35);
    baseColor += gridMask * iriColor * 0.12;
    baseColor *= scan * pulse;
    float alpha = (fresnel * uOpacity + gridMask * 0.07) * uOpacity;
    gl_FragColor = vec4(baseColor, clamp(alpha, 0.0, 1.0));
  }
`;

const coreVert = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const coreFrag = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float ndotv = max(dot(vNormal, vViewDir), 0.0);
    float fill = pow(ndotv, 3.5) * 0.18;
    float breathe = 1.0 + 0.08 * sin(uTime * 0.9);
    gl_FragColor = vec4(uColor * breathe, fill * uOpacity);
  }
`;

// ─── Camera Rig ───────────────────────────────────────────────────────────────

function CameraRig({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const { camera } = useThree();
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    const [mx, my] = mouse.current;
    const tx = mx * 0.55;
    const ty = -my * 0.38 + 0.12 * Math.sin(t.current * 0.27);
    camera.position.x += (tx - camera.position.x) * 0.035;
    camera.position.y += (ty - camera.position.y) * 0.035;
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
      const mat = new THREE.LineBasicMaterial({ color: '#c9a84c', transparent: true, opacity: 0.1 });
      return { line: new THREE.Line(geo, mat), aId, bId };
    }),
  []);

  useFrame(() => {
    const active = activeId.current;
    lineObjects.forEach(({ line, aId, bId }) => {
      const mat = line.material as THREE.LineBasicMaterial;
      const connected = active && (aId === active || bId === active);
      const target = connected ? 0.6 : (active ? 0.03 : 0.1);
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

// ─── Memory Fragment ──────────────────────────────────────────────────────────

function MemoryFragmentProxy({
  texture, memory, orbitRadius, orbitOffset, orbitSpeed,
  globePos, activeIdRef, globeId, onSelect,
}: {
  texture: THREE.Texture;
  memory: Memory;
  orbitRadius: number;
  orbitOffset: number;
  orbitSpeed: number;
  globePos: [number, number, number];
  activeIdRef: React.MutableRefObject<string | null>;
  globeId: string;
  onSelect: (m: Memory) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const t = useRef(orbitOffset);
  const [hov, setHov] = useState(false);
  const axis = useMemo(() =>
    new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
  []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const isActive = activeIdRef.current === globeId;
    t.current += delta * orbitSpeed * (isActive ? 0.55 : 0.22);
    const q = new THREE.Quaternion().setFromAxisAngle(axis, t.current);
    const bp = new THREE.Vector3(orbitRadius, 0, 0).applyQuaternion(q);
    mesh.position.set(globePos[0] + bp.x, globePos[1] + bp.y, globePos[2] + bp.z);
    mesh.lookAt(globePos[0], globePos[1], globePos[2]);
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const targetOpacity = isActive ? (hov ? 0.88 : 0.46) : 0.055;
    mat.opacity += (targetOpacity - mat.opacity) * 0.07;
    const targetScale = isActive ? (hov ? 1.3 : 1.0) : 0.65;
    mesh.scale.setScalar(mesh.scale.x + (targetScale - mesh.scale.x) * 0.09);
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={(e) => { e.stopPropagation(); setHov(true); }}
      onPointerOut={() => setHov(false)}
      onClick={(e) => { e.stopPropagation(); if (activeIdRef.current === globeId) onSelect(memory); }}
    >
      <planeGeometry args={[0.42, 0.28]} />
      <meshBasicMaterial map={texture} transparent opacity={0.055} side={THREE.DoubleSide} toneMapped={false} />
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

  const holoMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(def.color) },
      uTime: { value: 0 },
      uOpacity: { value: 0.9 },
    },
    vertexShader: holoVert,
    fragmentShader: holoFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  }), [def.color]);

  const coreMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(def.color) },
      uOpacity: { value: 1.0 },
      uTime: { value: 0 },
    },
    vertexShader: coreVert,
    fragmentShader: coreFrag,
    transparent: true,
    depthWrite: false,
  }), [def.color]);

  useFrame((_, delta) => {
    t.current += delta;
    holoMat.uniforms.uTime.value = t.current;
    coreMat.uniforms.uTime.value = t.current;

    const isActive = activeIdRef.current === def.id;
    const isOther = activeIdRef.current !== null && !isActive;

    if (groupRef.current) {
      const g = groupRef.current;
      const targetScale = isActive ? 1.3 : (isOther ? 0.78 : 1.0);
      g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * 0.055);
      const floatY = 0.075 * Math.sin(t.current * 0.38 + def.position[0] * 1.2);
      const floatX = 0.03 * Math.cos(t.current * 0.22 + def.position[2]);
      const targetZ = isActive ? def.position[2] + 1.8 : (isOther ? def.position[2] - 0.7 : def.position[2]);
      g.position.x += (def.position[0] + floatX - g.position.x) * 0.04;
      g.position.y += (def.position[1] + floatY - g.position.y) * 0.04;
      g.position.z += (targetZ - g.position.z) * 0.04;
      g.rotation.y += delta * 0.07;
      g.rotation.x += delta * 0.025;
    }

    const targetOpacity = isOther ? 0.28 : 0.9;
    holoMat.uniforms.uOpacity.value += (targetOpacity - holoMat.uniforms.uOpacity.value) * 0.055;
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
      {/* Core fill */}
      <mesh>
        <sphereGeometry args={[def.radius * 0.95, 64, 64]} />
        <primitive object={coreMat} attach="material" />
      </mesh>

      {/* Holographic rim */}
      <mesh>
        <sphereGeometry args={[def.radius, 64, 64]} />
        <primitive object={holoMat} attach="material" />
      </mesh>

      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[def.radius * 1.28, 32, 32]} />
        <meshBasicMaterial
          color={def.color}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* God ray emissive core */}
      <mesh>
        <sphereGeometry args={[def.radius * 0.55, 16, 16]} />
        <meshBasicMaterial color={def.color} transparent opacity={0.08} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Memory fragments */}
      {memories.map((mem, i) =>
        textures[i] ? (
          <MemoryFragmentProxy
            key={mem.id}
            texture={textures[i]}
            memory={mem}
            orbitRadius={def.radius * (0.82 + (i % 3) * 0.2)}
            orbitOffset={(i / Math.max(memories.length, 1)) * Math.PI * 2}
            orbitSpeed={0.16 + i * 0.038}
            globePos={def.position}
            activeIdRef={activeIdRef}
            globeId={def.id}
            onSelect={onSelect}
          />
        ) : null
      )}
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
  const safeAllPaths = allPaths.length > 0 ? allPaths : ['/images/photo-oq31-family-selfie.jpg'];
  const allTextures = useTexture(safeAllPaths) as THREE.Texture[];
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
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
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
            intensity={1.1}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.82}
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
      {GLOBE_DEFS.map(def => {
        const active = hoveredId === def.id;
        return (
          <div
            key={def.id}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              opacity: active ? 0.95 : 0.32,
              transform: `translate(-50%, -50%) ${active ? 'scale(1.08)' : 'scale(1)'}`,
              color: def.color,
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '0.72rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase' as const,
              textShadow: `0 0 14px ${def.color}99, 0 0 28px ${def.color}44`,
              left: `${50 + def.position[0] * 9.2}%`,
              top: `${50 - def.position[1] * 9.8}%`,
            }}
          >
            {def.label}
          </div>
        );
      })}
    </div>
  );
}
