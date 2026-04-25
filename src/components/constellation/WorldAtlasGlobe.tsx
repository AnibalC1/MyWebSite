'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { mesh as topoMesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

// ─── Constants ───────────────────────────────────────────────────────────────
const R = 2.4; // globe radius

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
  const curve = new THREE.QuadraticBezierCurve3(v0, mid, v1);
  return curve.getPoints(steps);
}

// ─── Cluster data ─────────────────────────────────────────────────────────────
const CLUSTERS = [
  { id: 'worcester',   name: 'Worcester, MA',     lat: 42.55, lng: -71.78, count: 549, anchor: true },
  { id: 'nyc-nj',      name: 'New York / NJ',     lat: 40.8,  lng: -74.1,  count: 141 },
  { id: 'manchester',  name: 'Manchester, NH',    lat: 42.9,  lng: -71.5,  count: 126 },
  { id: 'springfield', name: 'Springfield, MA',   lat: 42.1,  lng: -72.6,  count: 52  },
  { id: 'houston',     name: 'Houston, TX',       lat: 29.8,  lng: -95.5,  count: 41  },
  { id: 'scranton',    name: 'Scranton, PA',      lat: 41.4,  lng: -75.6,  count: 35  },
  { id: 'boston',      name: 'Boston, MA',        lat: 42.4,  lng: -71.1,  count: 34  },
  { id: 'cancun',      name: 'Cancún, México',    lat: 21.2,  lng: -86.8,  count: 22, international: true },
  { id: 'nyc',         name: 'New York City',     lat: 40.7,  lng: -74.0,  count: 16  },
] as const;

type ClusterKey = typeof CLUSTERS[number]['id'];

const ARC_PAIRS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 5], [0, 6],
  [0, 4], [0, 7],
  [1, 8], [2, 6], [4, 7],
];

// ─── Earth base sphere ────────────────────────────────────────────────────────
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

// ─── Atmospheric rim glow ─────────────────────────────────────────────────────
function AtmosphericGlow() {
  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[R * 1.04, 32, 32]} />
      <meshBasicMaterial
        color="#00aaff"
        transparent
        opacity={0.04}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ─── Continent outline lines (loaded from topojson) ───────────────────────────
function ContinentLines() {
  const [geom, setGeom] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const worldRes = await fetch('/world-land-110m.json').then(r => r.json()) as Topology<{ land: GeometryCollection }>;
        if (cancelled) return;

        const coastline = topoMesh(worldRes, worldRes.objects.land);
        const positions: number[] = [];

        for (const ring of coastline.coordinates as number[][][]) {
          for (let i = 0; i < ring.length - 1; i++) {
            const [lon0, lat0] = ring[i];
            const [lon1, lat1] = ring[i + 1];
            const v0 = latLonToVec3(lat0, lon0, R + 0.005);
            const v1 = latLonToVec3(lat1, lon1, R + 0.005);
            positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z);
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        setGeom(geo);
      } catch (e) {
        console.error('WorldAtlas load error', e);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  if (!geom) return null;
  return (
    <lineSegments geometry={geom} renderOrder={2}>
      <lineBasicMaterial color="#00d4ff" transparent opacity={0.32} />
    </lineSegments>
  );
}

// ─── Outer geodesic cage ──────────────────────────────────────────────────────
function OuterCage() {
  const geo = useMemo(() => new THREE.IcosahedronGeometry(R * 1.18, 2), []);
  return (
    <mesh geometry={geo} renderOrder={3}>
      <meshBasicMaterial
        color="#00c8e8"
        wireframe
        transparent
        opacity={0.18}
      />
    </mesh>
  );
}

// ─── Glowing nodes at icosahedron vertices ─────────────────────────────────────
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

// ─── Connection arcs between clusters ────────────────────────────────────────
function ConnectionArcs() {
  const primitives = useMemo(() =>
    ARC_PAIRS.map(([ai, bi]) => {
      const a = CLUSTERS[ai];
      const b = CLUSTERS[bi];
      const pts = arcPoints([a.lat, a.lng], [b.lat, b.lng]);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: '#c9a84c', transparent: true, opacity: 0.45 });
      const lineObj = new THREE.Line(geo, mat);
      lineObj.renderOrder = 5;
      return { lineObj, id: `${a.id}-${b.id}` };
    }), []);

  return (
    <>
      {primitives.map(({ lineObj, id }) => (
        <primitive key={id} object={lineObj} />
      ))}
    </>
  );
}

// ─── Cluster pin ──────────────────────────────────────────────────────────────
function ClusterPin({
  cluster, onSelect, selected,
}: {
  cluster: typeof CLUSTERS[number];
  onSelect: (id: string) => void;
  selected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const pos = useMemo(
    () => latLonToVec3(cluster.lat, cluster.lng, R + 0.08),
    [cluster],
  );

  const c = cluster as Record<string, unknown>;
  const baseRadius = c['anchor']
    ? 0.075 : Math.max(0.028, Math.min(0.055, cluster.count / 2800));

  useFrame(({ clock }) => {
    if (!meshRef.current || !ringRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + 0.18 * Math.sin(t * 2.8 + cluster.lat);
    meshRef.current.scale.setScalar(hovered || selected ? pulse * 1.5 : pulse);
    ringRef.current.scale.setScalar(1 + 0.35 * Math.abs(Math.sin(t * 1.6)));
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - Math.abs(Math.sin(t * 1.6)));
  });

  const color = c['anchor']
    ? '#ffffff'
    : c['international']
      ? '#ff6b35'
      : '#00e5ff';

  return (
    <group position={pos}>
      {/* Ping ring */}
      <mesh
        ref={ringRef}
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={6}
      >
        <ringGeometry args={[baseRadius * 1.4, baseRadius * 1.8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Core sphere */}
      <mesh
        ref={meshRef}
        renderOrder={6}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={e => { e.stopPropagation(); onSelect(cluster.id); }}
      >
        <sphereGeometry args={[baseRadius, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// ─── Lat/lon grid lines ───────────────────────────────────────────────────────
function LatLonGrid() {
  const geom = useMemo(() => {
    const positions: number[] = [];
    const steps = 64;

    // Latitude lines every 30°
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let i = 0; i < steps; i++) {
        const lon0 = (i / steps) * 360 - 180;
        const lon1 = ((i + 1) / steps) * 360 - 180;
        const v0 = latLonToVec3(lat, lon0, R + 0.002);
        const v1 = latLonToVec3(lat, lon1, R + 0.002);
        positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z);
      }
    }
    // Longitude lines every 30°
    for (let lon = -180; lon < 180; lon += 30) {
      for (let i = 0; i < steps; i++) {
        const lat0 = (i / steps) * 180 - 90;
        const lat1 = ((i + 1) / steps) * 180 - 90;
        const v0 = latLonToVec3(lat0, lon, R + 0.002);
        const v1 = latLonToVec3(lat1, lon, R + 0.002);
        positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z);
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

// ─── Rotating globe group ─────────────────────────────────────────────────────
function GlobeGroup({
  onSelect, selectedId,
}: {
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06;
    }
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
      {CLUSTERS.map(c => (
        <ClusterPin
          key={c.id}
          cluster={c}
          onSelect={onSelect}
          selected={selectedId === c.id}
        />
      ))}
    </group>
  );
}

// CameraRig replaced by OrbitControls in Canvas

// ─── Info panel (DOM overlay) ─────────────────────────────────────────────────
const CLUSTER_PHOTOS: Record<string, string[]> = {
  'worcester': ['/images/atlas/worcester/IMG_0091.JPG', '/images/atlas/worcester/IMG_0092.JPG', '/images/atlas/worcester/IMG_0093.JPG', '/images/atlas/worcester/IMG_0094.JPG', '/images/atlas/worcester/IMG_0095.JPG', '/images/atlas/worcester/IMG_0121.JPG', '/images/atlas/worcester/IMG_0151.JPG', '/images/atlas/worcester/IMG_0152.JPG', '/images/atlas/worcester/IMG_0156.JPG', '/images/atlas/worcester/IMG_0398.JPG', '/images/atlas/worcester/IMG_0412.JPG', '/images/atlas/worcester/IMG_0415.JPG', '/images/atlas/worcester/IMG_0421.JPG', '/images/atlas/worcester/IMG_0422.JPG', '/images/atlas/worcester/IMG_0423.JPG', '/images/atlas/worcester/IMG_0427.JPG'],
  'nyc_nj': ['/images/atlas/nyc_nj/IMG_4418.JPG', '/images/atlas/nyc_nj/IMG_4424.JPG', '/images/atlas/nyc_nj/IMG_4425.JPG', '/images/atlas/nyc_nj/IMG_4426.JPG', '/images/atlas/nyc_nj/IMG_4427.JPG', '/images/atlas/nyc_nj/IMG_4428.JPG', '/images/atlas/nyc_nj/IMG_4430.JPG', '/images/atlas/nyc_nj/IMG_4432.JPG', '/images/atlas/nyc_nj/IMG_4433.JPG', '/images/atlas/nyc_nj/IMG_4446.JPG', '/images/atlas/nyc_nj/IMG_4461.JPG', '/images/atlas/nyc_nj/IMG_4462.JPG', '/images/atlas/nyc_nj/IMG_4463.JPG', '/images/atlas/nyc_nj/IMG_4465.JPG', '/images/atlas/nyc_nj/IMG_4494.JPG', '/images/atlas/nyc_nj/IMG_4497.JPG'],
  'manchester': ['/images/atlas/manchester/IMG_1792.JPG', '/images/atlas/manchester/IMG_1793.JPG', '/images/atlas/manchester/IMG_1794.JPG', '/images/atlas/manchester/IMG_7328.JPG', '/images/atlas/manchester/IMG_7329.JPG'],
  'houston': ['/images/atlas/houston/IMG_1393.JPG', '/images/atlas/houston/IMG_1394.JPG', '/images/atlas/houston/IMG_1395.JPG', '/images/atlas/houston/IMG_1396.JPG', '/images/atlas/houston/IMG_1397.JPG', '/images/atlas/houston/IMG_1416.JPG', '/images/atlas/houston/IMG_1417.JPG', '/images/atlas/houston/IMG_1418.JPG', '/images/atlas/houston/IMG_1443.JPG', '/images/atlas/houston/IMG_1444.JPG', '/images/atlas/houston/IMG_1448.JPG', '/images/atlas/houston/IMG_1474.JPG', '/images/atlas/houston/IMG_1475.JPG'],
  'scranton': ['/images/atlas/scranton/PXL_20240704_004826502.jpg', '/images/atlas/scranton/PXL_20240704_005049212.jpg', '/images/atlas/scranton/PXL_20240704_005119969.MP.jpg', '/images/atlas/scranton/PXL_20240704_005125117.MP.jpg'],
  'boston': ['/images/atlas/boston/IMG_1390.JPG', '/images/atlas/boston/IMG_6520.JPG', '/images/atlas/boston/IMG_6521.JPG', '/images/atlas/boston/IMG_8049.JPG', '/images/atlas/boston/IMG_8050.JPG', '/images/atlas/boston/IMG_8051.JPG', '/images/atlas/boston/IMG_8052.JPG', '/images/atlas/boston/IMG_8053.JPG', '/images/atlas/boston/IMG_8054.JPG', '/images/atlas/boston/IMG_8055.JPG'],
  'cancun': ['/images/atlas/cancun/IMG_0834.jpeg', '/images/atlas/cancun/IMG_9430.JPG', '/images/atlas/cancun/IMG_9431.JPG', '/images/atlas/cancun/IMG_9432.JPG', '/images/atlas/cancun/IMG_9442.JPG', '/images/atlas/cancun/IMG_9443.JPG', '/images/atlas/cancun/IMG_9450.JPG', '/images/atlas/cancun/IMG_9452.JPG', '/images/atlas/cancun/IMG_9453.JPG', '/images/atlas/cancun/IMG_9454.JPG', '/images/atlas/cancun/IMG_9455.JPG', '/images/atlas/cancun/IMG_9456.JPG', '/images/atlas/cancun/IMG_9457.JPG', '/images/atlas/cancun/IMG_9458.JPG', '/images/atlas/cancun/IMG_9459.JPG', '/images/atlas/cancun/IMG_9460.JPG'],
  'springfield': ['/images/atlas/springfield/IMG_0200.JPG', '/images/atlas/springfield/IMG_0201.JPG'],
};

const CLUSTER_COUNTS: Record<string, number> = {
  'worcester': 297,
  'nyc_nj': 84,
  'manchester': 5,
  'houston': 13,
  'scranton': 4,
  'boston': 10,
  'cancun': 22,
  'springfield': 2,
};

function ClusterPanel({
  clusterId, onClose,
}: {
  clusterId: string;
  onClose: () => void;
}) {
  const cluster = CLUSTERS.find(c => c.id === clusterId);
  if (!cluster) return null;

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: '360px', zIndex: 200,
      background: 'linear-gradient(135deg, rgba(0,8,20,0.97) 0%, rgba(0,20,45,0.96) 100%)',
      borderLeft: '1px solid rgba(0,212,255,0.18)',
      boxShadow: '-20px 0 60px rgba(0,100,200,0.15)',
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(20px)',
      animation: 'panelSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '2rem 1.8rem 1.4rem', borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem',
            letterSpacing: '0.2em', textTransform: 'uppercase', padding: 0,
            fontFamily: 'Inter, sans-serif', marginBottom: '1rem',
          }}
        >
          ← Back to globe
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: (cluster as Record<string,unknown>)['anchor']
              ? '#ffffff'
              : (cluster as Record<string,unknown>)['international'] ? '#ff6b35' : '#00e5ff',
            boxShadow: `0 0 12px currentColor`,
          }} />
          <h2 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.5rem', color: '#ffffff',
            fontWeight: 300, margin: 0, letterSpacing: '0.04em',
          }}>
            {cluster.name}
          </h2>
        </div>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.65rem',
          letterSpacing: '0.18em', color: '#00d4ff',
          textTransform: 'uppercase', margin: 0,
        }}>
          {cluster.count} memories · Apr 2023 – Feb 2026
        </p>
      </div>

      {/* Photos grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem 1.8rem' }}>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.6rem',
          letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          Featured Memories
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {(CLUSTER_PHOTOS[clusterId] ?? []).slice(0, 16).map((src, i) => (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: '4px', overflow: 'hidden',
              border: '1px solid rgba(0,212,255,0.12)',
              boxShadow: '0 0 20px rgba(0,100,200,0.1)',
            }}>
              <img
                src={src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </div>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.58rem',
          color: 'rgba(255,255,255,0.22)', marginTop: '1.4rem',
          textAlign: 'center', letterSpacing: '0.08em',
        }}>
          {(CLUSTER_COUNTS[clusterId] ?? cluster.count).toLocaleString()} photos from this location
        </p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function WorldAtlasGlobe() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready,      setReady]      = useState(false);

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
      {/* CSS animations */}
      <style>{`
        @keyframes panelSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Film grain */}
      <div className="grain-overlay" aria-hidden />

      {/* No click-away div — onPointerMissed on Canvas handles deselection */}

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 7], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'auto', cursor: 'grab' }}
        dpr={[1, 2]}
        onPointerMissed={() => setSelectedId(null)}
      >
        <ambientLight intensity={0.15} />
        <pointLight position={[10, 10, 10]} intensity={0.4} color="#4488ff" />
        <pointLight position={[-10, -5, -10]} intensity={0.2} color="#002244" />

        <Stars radius={50} depth={50} count={4000} factor={3.5} fade speed={0.6} />

        <GlobeGroup
          onSelect={id => { setSelectedId(prev => prev === id ? null : id); }}
          selectedId={selectedId}
        />

        {/* Orbit controls — drag to rotate, scroll to zoom, no pan */}
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
          <Bloom
            intensity={1.4}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.9}
          />
          <Vignette darkness={0.55} offset={0.3} />
        </EffectComposer>
      </Canvas>

      {/* Info panel */}
      {selectedId && (
        <ClusterPanel
          clusterId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Bottom hint */}
      {!selectedId && (
        <div style={{
          position: 'fixed', bottom: '2.2rem', left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Inter, sans-serif', fontSize: '0.6rem',
          letterSpacing: '0.22em', color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase', textAlign: 'center',
          pointerEvents: 'none',
          opacity: ready ? 1 : 0, transition: 'opacity 2s ease 1.5s',
        }}>
          Click a location node to explore memories
        </div>
      )}
    </div>
  );
}
