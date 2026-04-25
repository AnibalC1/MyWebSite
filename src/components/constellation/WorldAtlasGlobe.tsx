'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { mesh as topoMesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import PHOTO_DATA from '@/data/hologram_photos.json';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PhotoEntry {
  file: string;
  src: string;
  lat: number;
  lng: number;
  ts: number;
  date: string;
  cluster: string;
  label: string;
}

const PHOTOS = PHOTO_DATA as PhotoEntry[];

// ─── Constants ────────────────────────────────────────────────────────────────
const R = 2.4;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.399 rad
const MAX_SPREAD: Record<string, number> = {
  worcester:   0.75,
  'nyc-nj':    0.50,
  manchester:  0.20,
  cancun:      0.22,
  houston:     0.18,
  boston:      0.18,
  scranton:    0.15,
  springfield: 0.12,
  other:       0.10,
};
const CLUSTER_ANCHORS: Record<string, [number, number]> = {
  worcester:   [42.5, -71.8],
  'nyc-nj':    [40.7, -74.0],
  manchester:  [42.9, -71.5],
  cancun:      [21.2, -86.8],
  houston:     [29.8, -95.4],
  boston:      [42.4, -71.1],
  scranton:    [41.4, -75.6],
  springfield: [42.1, -72.6],
  other:       [40.0, -75.0],
};

// ─── Geo helpers ─────────────────────────────────────────────────────────────
function latLonToVec3(lat: number, lon: number, r = R): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function arcPoints(
  a: [number, number], b: [number, number],
  elevation = 0.55, steps = 72,
): THREE.Vector3[] {
  const v0  = latLonToVec3(a[0], a[1]);
  const v1  = latLonToVec3(b[0], b[1]);
  const mid = v0.clone().add(v1).normalize().multiplyScalar(R + elevation);
  return new THREE.QuadraticBezierCurve3(v0, mid, v1).getPoints(steps);
}

// Compute tangent frame at a surface point
function tangentFrame(lat: number, lng: number): [THREE.Vector3, THREE.Vector3] {
  const n = latLonToVec3(lat, lng, 1); // unit normal
  const up = new THREE.Vector3(0, 1, 0);
  const t1 = up.clone().sub(n.clone().multiplyScalar(up.dot(n))).normalize();
  const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
  return [t1, t2];
}

// ─── Pre-compute photo positions (fibonacci spiral per cluster) ──────────────
interface PhotoPos {
  localPos: THREE.Vector3;   // floating position in GlobeGroup local space
  surfacePos: THREE.Vector3; // pin on sphere surface (local space)
  radialOffset: number;
}

function computePhotoPositions(): PhotoPos[] {
  // Group by cluster, keeping insertion order
  const byCluster = new Map<string, number[]>();
  PHOTOS.forEach((p, i) => {
    const arr = byCluster.get(p.cluster) ?? [];
    arr.push(i);
    byCluster.set(p.cluster, arr);
  });

  const result: PhotoPos[] = new Array(PHOTOS.length);

  byCluster.forEach((indices, cluster) => {
    const anchor = CLUSTER_ANCHORS[cluster] ?? [PHOTOS[indices[0]].lat, PHOTOS[indices[0]].lng];
    const [t1, t2] = tangentFrame(anchor[0], anchor[1]);
    const n  = PHOTOS.length; // cluster count
    const maxSpread = MAX_SPREAD[cluster] ?? 0.2;

    indices.forEach((photoIdx, i) => {
      const N = indices.length;
      // Fibonacci spiral in tangent plane
      const spiralR = Math.sqrt(i / N) * maxSpread;
      const spiralTheta = i * GOLDEN_ANGLE;
      const tangentOffset = t1.clone()
        .multiplyScalar(spiralR * Math.cos(spiralTheta))
        .add(t2.clone().multiplyScalar(spiralR * Math.sin(spiralTheta)));

      const p = PHOTOS[photoIdx];
      // Use photo's actual GPS as base direction, then add tangent spread
      const baseVec = latLonToVec3(p.lat, p.lng, R);
      const spreadVec = baseVec.clone().add(tangentOffset).normalize();

      const radialOffset = 0.18 + (i % 7) * 0.04; // 0.18 – 0.42
      const localPos = spreadVec.clone().multiplyScalar(R + radialOffset);
      const surfacePos = spreadVec.clone().multiplyScalar(R + 0.01);

      result[photoIdx] = { localPos, surfacePos, radialOffset };
    });
  });

  return result;
}

const PHOTO_POSITIONS = computePhotoPositions();

// Pre-compute related photo indices (same cluster, ±30 days)
const THIRTY_DAYS = 30 * 24 * 3600;
function computeRelated(): number[][] {
  return PHOTOS.map((p, i) => {
    const candidates: number[] = [];
    for (let j = 0; j < PHOTOS.length && candidates.length < 8; j++) {
      if (j === i) continue;
      if (PHOTOS[j].cluster !== p.cluster) continue;
      if (Math.abs(PHOTOS[j].ts - p.ts) <= THIRTY_DAYS) candidates.push(j);
    }
    return candidates;
  });
}

const RELATED_INDICES = computeRelated();

// ─── Earth layers ─────────────────────────────────────────────────────────────
function EarthSphere() {
  return (
    <mesh renderOrder={0}>
      <sphereGeometry args={[R, 64, 64]} />
      <meshPhongMaterial
        color="#000d1a"
        emissive="#003366"
        emissiveIntensity={0.12}
        transparent
        opacity={0.96}
        depthWrite
      />
    </mesh>
  );
}

function AtmosphericGlow() {
  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[R * 1.04, 32, 32]} />
      <meshBasicMaterial color="#00aaff" transparent opacity={0.04} side={THREE.BackSide} />
    </mesh>
  );
}

function ContinentLines() {
  const [geom, setGeom] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/world-land-110m.json')
      .then(r => r.json())
      .then((worldRes: Topology<{ land: GeometryCollection }>) => {
        if (cancelled) return;
        const coastline = topoMesh(worldRes, worldRes.objects.land);
        const positions: number[] = [];
        for (const ring of coastline.coordinates as number[][][]) {
          for (let i = 0; i < ring.length - 1; i++) {
            const v0 = latLonToVec3(ring[i][1], ring[i][0], R + 0.005);
            const v1 = latLonToVec3(ring[i + 1][1], ring[i + 1][0], R + 0.005);
            positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z);
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        setGeom(geo);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, []);

  if (!geom) return null;
  return (
    <lineSegments geometry={geom} renderOrder={2}>
      <lineBasicMaterial color="#00d4ff" transparent opacity={0.32} />
    </lineSegments>
  );
}

function OuterCage() {
  const geo = useMemo(() => new THREE.IcosahedronGeometry(R * 1.18, 2), []);
  return (
    <mesh geometry={geo} renderOrder={3}>
      <meshBasicMaterial color="#00c8e8" wireframe transparent opacity={0.14} />
    </mesh>
  );
}

function CageNodes() {
  const positions = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(R * 1.18, 1);
    const pos = ico.getAttribute('position');
    const seen = new Set<string>();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      const key = v.toArray().map(n => n.toFixed(2)).join(',');
      if (!seen.has(key)) { seen.add(key); pts.push(v); }
    }
    return pts;
  }, []);

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} renderOrder={4}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshBasicMaterial color={i % 5 === 0 ? '#ff8c00' : '#00e5ff'} />
        </mesh>
      ))}
    </>
  );
}

function LatLonGrid() {
  const geom = useMemo(() => {
    const positions: number[] = [];
    const steps = 64;
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let i = 0; i < steps; i++) {
        const lon0 = (i / steps) * 360 - 180;
        const lon1 = ((i + 1) / steps) * 360 - 180;
        positions.push(...latLonToVec3(lat, lon0, R + 0.002).toArray());
        positions.push(...latLonToVec3(lat, lon1, R + 0.002).toArray());
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let i = 0; i < steps; i++) {
        const lat0 = (i / steps) * 180 - 90;
        const lat1 = ((i + 1) / steps) * 180 - 90;
        positions.push(...latLonToVec3(lat0, lon, R + 0.002).toArray());
        positions.push(...latLonToVec3(lat1, lon, R + 0.002).toArray());
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geom} renderOrder={2}>
      <lineBasicMaterial color="#003355" transparent opacity={0.22} />
    </lineSegments>
  );
}

// ─── Arc connections (between clusters) ──────────────────────────────────────
const ARC_PAIRS: [[number, number], [number, number]][] = [
  [[42.5, -71.8], [40.7, -74.0]],
  [[42.5, -71.8], [42.9, -71.5]],
  [[42.5, -71.8], [42.4, -71.1]],
  [[42.5, -71.8], [29.8, -95.4]],
  [[42.5, -71.8], [21.2, -86.8]],
  [[40.7, -74.0], [42.4, -71.1]],
];

function ConnectionArcs() {
  const primitives = useMemo(() =>
    ARC_PAIRS.map(([a, b]) => {
      const pts = arcPoints(a, b);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: '#c9a84c', transparent: true, opacity: 0.3 });
      const line = new THREE.Line(geo, mat);
      line.renderOrder = 5;
      return line;
    }), []);

  return <>{primitives.map((l, i) => <primitive key={i} object={l} />)}</>;
}

// ─── Floating Holograms ────────────────────────────────────────────────────────
const _tmpColor = new THREE.Color();
const _white    = new THREE.Color(1, 1, 1);
const _tintRest = new THREE.Color(0.7, 0.9, 1.0);

function FloatingHolograms() {
  const { camera } = useThree();

  // Sprite refs — 556 items
  const spriteRefs = useRef<(THREE.Sprite | null)[]>(PHOTOS.map(() => null));
  const matRefs    = useRef<(THREE.SpriteMaterial | null)[]>(PHOTOS.map(() => null));

  // Current animated values
  const scales     = useRef<Float32Array>(new Float32Array(PHOTOS.length).fill(0.12));
  const opacities  = useRef<Float32Array>(new Float32Array(PHOTOS.length).fill(0.55));

  // Hover state (ref, not state — no re-render)
  const hoverIdx = useRef<number>(-1);

  // ── Texture loading ───────────────────────────────────────────────────────
  const textures      = useRef<(THREE.Texture | null)[]>(PHOTOS.map(() => null));
  const texState      = useRef<('idle' | 'loading' | 'done')[]>(PHOTOS.map(() => 'idle'));
  const activeLoads   = useRef(0);

  useEffect(() => {
    let idx = 0;

    const loadNext = () => {
      while (idx < PHOTOS.length && activeLoads.current < 20) {
        const i = idx++;
        activeLoads.current++;
        const loader = new THREE.TextureLoader();
        loader.load(
          PHOTOS[i].src,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            textures.current[i] = t;
            texState.current[i] = 'done';
            activeLoads.current--;
            if (matRefs.current[i]) {
              matRefs.current[i]!.map = t;
              matRefs.current[i]!.needsUpdate = true;
            }
            loadNext();
          },
          undefined,
          () => { activeLoads.current--; texState.current[i] = 'done'; loadNext(); },
        );
        texState.current[i] = 'loading';
      }
    };

    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Dynamic connection lines ──────────────────────────────────────────────
  const pinLineMat = useMemo(() => new THREE.LineBasicMaterial({
    color: '#c9a84c', transparent: true, opacity: 0, depthTest: false,
  }), []);
  const pinLinePosArr = useMemo(() => new Float32Array(6), []);
  const pinLineGeo    = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pinLinePosArr, 3));
    return g;
  }, [pinLinePosArr]);
  const pinLine = useMemo(() => new THREE.Line(pinLineGeo, pinLineMat), [pinLineGeo, pinLineMat]);

  // 8 related lines (cyan, photo→photo)
  const relMats     = useMemo(() => Array.from({ length: 8 }, () =>
    new THREE.LineBasicMaterial({ color: '#00d2ff', transparent: true, opacity: 0, depthTest: false }),
  ), []);
  const relPosArrays = useMemo(() => Array.from({ length: 8 }, () => new Float32Array(6)), []);
  const relGeos      = useMemo(() => relPosArrays.map(arr => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }), [relPosArrays]);
  const relLines = useMemo(() =>
    relGeos.map((g, i) => new THREE.Line(g, relMats[i])), [relGeos, relMats]);

  // ── Per-frame animation ──────────────────────────────────────────────────
  useFrame(() => {
    const h = hoverIdx.current;
    const relIdxs = h >= 0 ? RELATED_INDICES[h] : [];
    const relSet  = new Set(relIdxs);

    for (let i = 0; i < PHOTOS.length; i++) {
      const sp  = spriteRefs.current[i];
      const mat = matRefs.current[i];
      if (!sp || !mat) continue;

      // Targets
      let targetOp:  number;
      let targetSc:  number;
      let targetTint = 0; // 0 = full tint, 1 = full white (true photo colors)

      if (h < 0) {
        // Nothing hovered
        targetOp = 0.55;
        targetSc = 0.12;
        targetTint = 0;
      } else if (i === h) {
        // Hovered photo
        targetOp   = 1.0;
        targetSc   = 0.30; // ~2.5× base
        targetTint = 1;    // show real photo colors
      } else if (relSet.has(i)) {
        // Related photo
        targetOp   = 0.80;
        targetSc   = 0.145;
        targetTint = 0.3;
      } else {
        // Unrelated — dim
        targetOp   = 0.22;
        targetSc   = 0.10;
        targetTint = 0;
      }

      // Lerp scale
      const cs = scales.current[i];
      scales.current[i] = cs + (targetSc - cs) * 0.08;
      sp.scale.setScalar(scales.current[i]);

      // Lerp opacity
      const co = opacities.current[i];
      opacities.current[i] = co + (targetOp - co) * 0.08;
      mat.opacity = opacities.current[i];

      // Lerp color tint
      _tmpColor.copy(_tintRest).lerp(_white, targetTint);
      mat.color.copy(_tmpColor);

      // Lerp position: push hovered photo outward toward camera
      if (i === h) {
        const outDir = PHOTO_POSITIONS[i].localPos.clone().normalize();
        const targetPos = PHOTO_POSITIONS[i].localPos.clone().addScaledVector(outDir, 0.22);
        sp.position.lerp(targetPos, 0.08);
      } else {
        sp.position.lerp(PHOTO_POSITIONS[i].localPos, 0.08);
      }
    }

    // ── Update pin line ────────────────────────────────────────────────────
    if (h >= 0) {
      const fp = PHOTO_POSITIONS[h];
      const sp = spriteRefs.current[h];
      const pos = sp ? sp.position : fp.localPos;
      pinLinePosArr[0] = pos.x; pinLinePosArr[1] = pos.y; pinLinePosArr[2] = pos.z;
      pinLinePosArr[3] = fp.surfacePos.x; pinLinePosArr[4] = fp.surfacePos.y; pinLinePosArr[5] = fp.surfacePos.z;
      pinLineGeo.attributes.position.needsUpdate = true;
      pinLineMat.opacity += (0.65 - pinLineMat.opacity) * 0.1;

      // Animate dash-like pulse on pin line opacity
      const t = performance.now() / 1000;
      pinLineMat.opacity = 0.35 + 0.3 * Math.sin(t * 3.0);
    } else {
      pinLineMat.opacity += (0 - pinLineMat.opacity) * 0.1;
    }

    // ── Update related lines ──────────────────────────────────────────────
    relMats.forEach((mat, li) => {
      if (h >= 0 && li < relIdxs.length) {
        const relI = relIdxs[li];
        const fromPos = spriteRefs.current[h]?.position ?? PHOTO_POSITIONS[h].localPos;
        const toPos   = spriteRefs.current[relI]?.position ?? PHOTO_POSITIONS[relI].localPos;
        relPosArrays[li][0] = fromPos.x; relPosArrays[li][1] = fromPos.y; relPosArrays[li][2] = fromPos.z;
        relPosArrays[li][3] = toPos.x;   relPosArrays[li][4] = toPos.y;   relPosArrays[li][5] = toPos.z;
        relGeos[li].attributes.position.needsUpdate = true;
        mat.opacity += (0.28 - mat.opacity) * 0.08;
      } else {
        mat.opacity += (0 - mat.opacity) * 0.1;
      }
    });
  });

  // ── Pointer handlers ─────────────────────────────────────────────────────
  const handleOver  = (i: number) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    hoverIdx.current = i;
    document.body.style.cursor = 'pointer';
  };
  const handleOut   = () => {
    hoverIdx.current = -1;
    document.body.style.cursor = '';
  };

  return (
    <group>
      {PHOTOS.map((_, i) => (
        <sprite
          key={i}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el: any) => { spriteRefs.current[i] = el; }}
          position={PHOTO_POSITIONS[i].localPos}
          scale={[0.12, 0.09, 1]}
          renderOrder={7}
          onPointerOver={handleOver(i)}
          onPointerOut={handleOut}
        >
          <spriteMaterial
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={(el: any) => { matRefs.current[i] = el; }}
            color={_tintRest}
            transparent
            opacity={0.55}
            depthTest={false}
          />
        </sprite>
      ))}

      {/* Pin line: hovered photo → earth surface */}
      <primitive object={pinLine} />

      {/* Related photo connections */}
      {relLines.map((l, i) => <primitive key={i} object={l} />)}
    </group>
  );
}

// ─── Globe group (rotates) ────────────────────────────────────────────────────
function GlobeGroup({ onSelect, selectedId }: {
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.045;
  });

  return (
    <group ref={groupRef}>
      <EarthSphere />
      <AtmosphericGlow />
      <LatLonGrid />
      <ContinentLines />
      <OuterCage />
      <CageNodes />
      <ConnectionArcs />
      <FloatingHolograms />
    </group>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function WorldAtlasGlobe() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 40% 45%, #00091a 0%, #000000 75%)',
      opacity: ready ? 1 : 0,
      transition: 'opacity 1.2s ease',
    }}>
      <style>{`
        @keyframes panelSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <div className="grain-overlay" aria-hidden />

      <Canvas
        camera={{ position: [0, 0, 7], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'auto', cursor: 'grab' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.15} />
        <pointLight position={[10, 10, 10]}   intensity={0.4} color="#4488ff" />
        <pointLight position={[-10, -5, -10]} intensity={0.2} color="#002244" />

        <Stars radius={50} depth={50} count={4000} factor={3.5} fade speed={0.6} />

        <GlobeGroup onSelect={() => {}} selectedId={null} />

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={3.5}
          maxDistance={12}
          rotateSpeed={0.55}
          zoomSpeed={0.7}
        />

        <EffectComposer>
          <Bloom intensity={1.6} luminanceThreshold={0.15} luminanceSmoothing={0.9} />
          <Vignette darkness={0.55} offset={0.3} />
        </EffectComposer>
      </Canvas>

      <div style={{
        position: 'fixed', bottom: '2.2rem', left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'Inter, sans-serif', fontSize: '0.6rem',
        letterSpacing: '0.22em', color: 'rgba(255,255,255,0.18)',
        textTransform: 'uppercase', textAlign: 'center',
        pointerEvents: 'none',
        opacity: ready ? 1 : 0, transition: 'opacity 2s ease 1.5s',
      }}>
        Hover to reveal a memory · Drag to explore · Scroll to zoom
      </div>
    </div>
  );
}
