'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { mesh as topoMesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import RAW_DATA from '@/data/gallery_data.json';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GalleryPhoto {
  file: string;
  src: string;
  lat: number;
  lng: number;
  ts: number;
  date: string;
  cluster: string;
  label: string;
  people: string[];
}

const PHOTOS = RAW_DATA as GalleryPhoto[];

// ─── Constants ────────────────────────────────────────────────────────────────
const R = 2.4;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const THIRTY_DAYS  = 30 * 24 * 3600;

const MAX_SPREAD: Record<string, number> = {
  worcester:   2.2,
  'nyc-nj':    1.5,
  manchester:  0.6,
  cancun:      0.7,
  houston:     0.6,
  boston:      0.6,
  scranton:    0.5,
  springfield: 0.4,
  other:       0.3,
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

function tangentFrame(lat: number, lng: number): [THREE.Vector3, THREE.Vector3] {
  const n  = latLonToVec3(lat, lng, 1);
  const up = new THREE.Vector3(0, 1, 0);
  const t1 = up.clone().sub(n.clone().multiplyScalar(up.dot(n))).normalize();
  const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
  return [t1, t2];
}

// ─── Pre-compute 3D positions ─────────────────────────────────────────────────
interface PhotoPos { localPos: THREE.Vector3; surfacePos: THREE.Vector3; }

const PHOTO_POSITIONS: PhotoPos[] = (() => {
  const byCluster = new Map<string, number[]>();
  PHOTOS.forEach((p, i) => {
    const a = byCluster.get(p.cluster) ?? [];
    a.push(i); byCluster.set(p.cluster, a);
  });
  const result: PhotoPos[] = new Array(PHOTOS.length);
  byCluster.forEach((indices, cluster) => {
    const anchor    = CLUSTER_ANCHORS[cluster] ?? [PHOTOS[indices[0]].lat, PHOTOS[indices[0]].lng];
    const [t1, t2]  = tangentFrame(anchor[0], anchor[1]);
    const maxSpread = MAX_SPREAD[cluster] ?? 0.3;
    const N         = indices.length;
    indices.forEach((idx, i) => {
      const sR    = Math.sqrt(i / N) * maxSpread;
      const sT    = i * GOLDEN_ANGLE;
      const off   = t1.clone().multiplyScalar(sR * Math.cos(sT))
                      .add(t2.clone().multiplyScalar(sR * Math.sin(sT)));
      const base  = latLonToVec3(PHOTOS[idx].lat, PHOTOS[idx].lng, R);
      const dir   = base.clone().add(off).normalize();
      const rOff  = 0.32 + (i % 9) * 0.07;
      result[idx] = {
        localPos:   dir.clone().multiplyScalar(R + rOff),
        surfacePos: dir.clone().multiplyScalar(R + 0.01),
      };
    });
  });
  return result;
})();

// ─── Pre-compute connections ──────────────────────────────────────────────────
interface Connection { toIdx: number; type: 'people-strong' | 'people-weak' | 'time' | 'location'; }

const CONNECTIONS: Connection[][] = PHOTOS.map((p, i) => {
  const results: Connection[] = [];
  for (let j = 0; j < PHOTOS.length; j++) {
    if (j === i || results.length >= 12) break;
    const q = PHOTOS[j];
    const shared = p.people.filter(x => q.people.includes(x)).length;
    if (shared >= 2) { results.push({ toIdx: j, type: 'people-strong' }); continue; }
    if (shared === 1) { results.push({ toIdx: j, type: 'people-weak' }); continue; }
    if (Math.abs(p.ts - q.ts) <= THIRTY_DAYS) { results.push({ toIdx: j, type: 'time' }); continue; }
    if (p.cluster === q.cluster && results.length < 6) { results.push({ toIdx: j, type: 'location' }); }
  }
  // Sort: people-strong first, then weak, then time, then location
  const order = { 'people-strong': 0, 'people-weak': 1, 'time': 2, 'location': 3 };
  return results.sort((a, b) => order[a.type] - order[b.type]).slice(0, 12);
});

// ─── Earth components ─────────────────────────────────────────────────────────
function EarthSphere() {
  return (
    <mesh renderOrder={0}>
      <sphereGeometry args={[R, 64, 64]} />
      <meshPhongMaterial color="#000d1a" emissive="#003366" emissiveIntensity={0.12}
        transparent opacity={0.96} depthWrite />
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
    fetch('/world-land-110m.json').then(r => r.json())
      .then((w: Topology<{ land: GeometryCollection }>) => {
        if (cancelled) return;
        const coast = topoMesh(w, w.objects.land);
        const pos: number[] = [];
        for (const ring of coast.coordinates as number[][][]) {
          for (let i = 0; i < ring.length - 1; i++) {
            const v0 = latLonToVec3(ring[i][1], ring[i][0], R + 0.005);
            const v1 = latLonToVec3(ring[i+1][1], ring[i+1][0], R + 0.005);
            pos.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z);
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        setGeom(g);
      }).catch(console.error);
    return () => { cancelled = true; };
  }, []);
  if (!geom) return null;
  return <lineSegments geometry={geom} renderOrder={2}><lineBasicMaterial color="#00d4ff" transparent opacity={0.32} /></lineSegments>;
}
function LatLonGrid() {
  const geom = useMemo(() => {
    const pos: number[] = []; const steps = 64;
    for (let lat = -60; lat <= 60; lat += 30)
      for (let i = 0; i < steps; i++) {
        pos.push(...latLonToVec3(lat, (i/steps)*360-180, R+0.002).toArray());
        pos.push(...latLonToVec3(lat, ((i+1)/steps)*360-180, R+0.002).toArray());
      }
    for (let lon = -180; lon < 180; lon += 30)
      for (let i = 0; i < steps; i++) {
        pos.push(...latLonToVec3((i/steps)*180-90, lon, R+0.002).toArray());
        pos.push(...latLonToVec3(((i+1)/steps)*180-90, lon, R+0.002).toArray());
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  return <lineSegments geometry={geom} renderOrder={2}><lineBasicMaterial color="#003355" transparent opacity={0.18} /></lineSegments>;
}
function OuterCage() {
  const geo = useMemo(() => new THREE.IcosahedronGeometry(R * 1.18, 2), []);
  return <mesh geometry={geo} renderOrder={3}><meshBasicMaterial color="#00c8e8" wireframe transparent opacity={0.10} /></mesh>;
}

const ARC_PAIRS: [[number,number],[number,number]][] = [
  [[42.5,-71.8],[40.7,-74.0]],[[42.5,-71.8],[42.9,-71.5]],
  [[42.5,-71.8],[42.4,-71.1]],[[42.5,-71.8],[29.8,-95.4]],
  [[42.5,-71.8],[21.2,-86.8]],[[40.7,-74.0],[42.4,-71.1]],
  [[40.7,-74.0],[41.4,-75.6]],[[42.5,-71.8],[42.1,-72.6]],
];
function ConnectionArcs() {
  const lines = useMemo(() => ARC_PAIRS.map(([a,b]) => {
    const geo = new THREE.BufferGeometry().setFromPoints(arcPoints(a,b));
    const mat = new THREE.LineBasicMaterial({ color:'#c9a84c', transparent:true, opacity:0.25 });
    const l = new THREE.Line(geo,mat); l.renderOrder=5; return l;
  }), []);
  return <>{lines.map((l,i) => <primitive key={i} object={l} />)}</>;
}

// ─── Connection line colors ───────────────────────────────────────────────────
const LINE_COLORS = {
  'people-strong': '#c9a84c',  // gold bright
  'people-weak':   '#c9a84c',  // gold dim
  'time':          '#ff66cc',  // magenta
  'location':      '#00d2ff',  // cyan
};
const LINE_OPACITIES = {
  'people-strong': 0.75,
  'people-weak':   0.40,
  'time':          0.30,
  'location':      0.22,
};

// ─── Floating Holograms ───────────────────────────────────────────────────────
const _tintRest = new THREE.Color(0.65, 0.88, 1.0);
const _white    = new THREE.Color(1, 1, 1);
const _tmp      = new THREE.Color();

interface HologramProps {
  selectedIdxRef: React.MutableRefObject<number>;
  onHover: (idx: number) => void;
  onClick: (idx: number) => void;
}

function FloatingHolograms({ selectedIdxRef, onHover, onClick }: HologramProps) {
  const spriteRefs = useRef<(THREE.Sprite|null)[]>(PHOTOS.map(()=>null));
  const matRefs    = useRef<(THREE.SpriteMaterial|null)[]>(PHOTOS.map(()=>null));
  const scales     = useRef(new Float32Array(PHOTOS.length).fill(0.13));
  const opacities  = useRef(new Float32Array(PHOTOS.length).fill(0.50));
  const hoverRef   = useRef(-1);

  // Texture loading
  const textures  = useRef<(THREE.Texture|null)[]>(PHOTOS.map(()=>null));
  const texLoaded = useRef<boolean[]>(PHOTOS.map(()=>false));
  const loading   = useRef(0);
  useEffect(() => {
    let idx = 0;
    const next = () => {
      while (idx < PHOTOS.length && loading.current < 20) {
        const i = idx++;
        loading.current++;
        new THREE.TextureLoader().load(PHOTOS[i].src, t => {
          t.colorSpace = THREE.SRGBColorSpace;
          textures.current[i] = t; texLoaded.current[i] = true; loading.current--;
          if (matRefs.current[i]) { matRefs.current[i]!.map = t; matRefs.current[i]!.needsUpdate = true; }
          next();
        }, undefined, () => { loading.current--; texLoaded.current[i] = true; next(); });
      }
    };
    next();
  }, []);

  // 12 connection lines (reused pool)
  const connMats = useMemo(() => Array.from({length:12}, () =>
    new THREE.LineBasicMaterial({color:'#c9a84c',transparent:true,opacity:0,depthTest:false})), []);
  const connPosArr = useMemo(() => Array.from({length:12}, () => new Float32Array(6)), []);
  const connGeos   = useMemo(() => connPosArr.map(arr => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr,3)); return g;
  }), [connPosArr]);
  const connLines = useMemo(() => connGeos.map((g,i) => new THREE.Line(g,connMats[i])), [connGeos,connMats]);

  // Pin line (selected photo → earth)
  const pinMat = useMemo(() => new THREE.LineBasicMaterial({color:'#c9a84c',transparent:true,opacity:0,depthTest:false}), []);
  const pinArr = useMemo(() => new Float32Array(6), []);
  const pinGeo = useMemo(() => { const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pinArr,3)); return g; }, [pinArr]);
  const pinLine = useMemo(() => new THREE.Line(pinGeo,pinMat), [pinGeo,pinMat]);

  useFrame(() => {
    const h = hoverRef.current;
    const s = selectedIdxRef.current;

    // Determine connected indices from selected
    const connSet = new Set<number>();
    const connData = s >= 0 ? CONNECTIONS[s] : [];
    connData.forEach(c => connSet.add(c.toIdx));

    for (let i = 0; i < PHOTOS.length; i++) {
      const sp = spriteRefs.current[i];
      const mat = matRefs.current[i];
      if (!sp || !mat) continue;

      let tOp: number, tSc: number, tTint: number;

      if (s >= 0) {
        // Selection mode
        if (i === s) { tOp=1.0; tSc=0.18; tTint=0; }
        else if (connSet.has(i)) { tOp=0.85; tSc=0.15; tTint=0.4; }
        else { tOp=0.12; tSc=0.10; tTint=0; }
      } else if (h >= 0) {
        // Hover mode — just a subtle glow, DOM overlay does the heavy lifting
        if (i === h) { tOp=0.75; tSc=0.16; tTint=0.5; }
        else { tOp=0.40; tSc=0.12; tTint=0; }
      } else {
        tOp=0.50; tSc=0.13; tTint=0;
      }

      scales.current[i]   = scales.current[i]   + (tSc - scales.current[i])   * 0.08;
      opacities.current[i] = opacities.current[i] + (tOp - opacities.current[i]) * 0.08;
      sp.scale.setScalar(scales.current[i]);
      mat.opacity = opacities.current[i];
      _tmp.copy(_tintRest).lerp(_white, tTint);
      mat.color.copy(_tmp);
    }

    // Connection lines (only when selected)
    connData.slice(0,12).forEach((c, li) => {
      const from = spriteRefs.current[s]?.position ?? PHOTO_POSITIONS[s].localPos;
      const to   = spriteRefs.current[c.toIdx]?.position ?? PHOTO_POSITIONS[c.toIdx].localPos;
      connPosArr[li][0]=from.x; connPosArr[li][1]=from.y; connPosArr[li][2]=from.z;
      connPosArr[li][3]=to.x;   connPosArr[li][4]=to.y;   connPosArr[li][5]=to.z;
      connGeos[li].attributes.position.needsUpdate = true;
      connMats[li].color.set(LINE_COLORS[c.type]);
      connMats[li].opacity += (LINE_OPACITIES[c.type] - connMats[li].opacity) * 0.1;
    });
    // Hide unused lines
    for (let li = connData.length; li < 12; li++) {
      connMats[li].opacity += (0 - connMats[li].opacity) * 0.15;
    }

    // Pin line (selected → surface)
    if (s >= 0) {
      const fp = PHOTO_POSITIONS[s];
      const sp = spriteRefs.current[s]?.position ?? fp.localPos;
      pinArr[0]=sp.x; pinArr[1]=sp.y; pinArr[2]=sp.z;
      pinArr[3]=fp.surfacePos.x; pinArr[4]=fp.surfacePos.y; pinArr[5]=fp.surfacePos.z;
      pinGeo.attributes.position.needsUpdate = true;
      const t = performance.now()/1000;
      pinMat.opacity = 0.3 + 0.3 * Math.sin(t * 3.5);
    } else {
      pinMat.opacity += (0 - pinMat.opacity) * 0.15;
    }
  });

  return (
    <group>
      {PHOTOS.map((_, i) => (
        <sprite
          key={i}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el: any) => { spriteRefs.current[i] = el; }}
          position={PHOTO_POSITIONS[i].localPos}
          scale={[0.13, 0.098, 1]}
          renderOrder={7}
          onPointerOver={(e) => { e.stopPropagation(); hoverRef.current = i; onHover(i); document.body.style.cursor='pointer'; }}
          onPointerOut={() => { hoverRef.current = -1; onHover(-1); document.body.style.cursor=''; }}
          onClick={(e) => { e.stopPropagation(); onClick(i); }}
        >
          <spriteMaterial
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={(el: any) => { matRefs.current[i] = el; }}
            color={_tintRest.clone()}
            transparent opacity={0.50} depthTest={false}
          />
        </sprite>
      ))}
      <primitive object={pinLine} />
      {connLines.map((l,i) => <primitive key={i} object={l} />)}
    </group>
  );
}

// ─── Globe group ──────────────────────────────────────────────────────────────
function GlobeGroup({ selectedIdxRef, onHover, onClick }: HologramProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_,d) => { if (ref.current) ref.current.rotation.y += d * 0.045; });
  return (
    <group ref={ref}>
      <EarthSphere /><AtmosphericGlow /><LatLonGrid /><ContinentLines />
      <OuterCage /><ConnectionArcs />
      <FloatingHolograms selectedIdxRef={selectedIdxRef} onHover={onHover} onClick={onClick} />
    </group>
  );
}

// ─── Photo overlay (DOM) ──────────────────────────────────────────────────────
function PhotoOverlay({
  photo, selectedIdx, onClose,
}: {
  photo: GalleryPhoto | null;
  selectedIdx: number;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (photo) setVisible(true); else setVisible(false); }, [photo]);

  if (!photo) return null;

  const conns = selectedIdx >= 0 ? CONNECTIONS[selectedIdx] : [];
  const peopleConns = conns.filter(c => c.type === 'people-strong' || c.type === 'people-weak').length;
  const timeConns   = conns.filter(c => c.type === 'time').length;
  const locConns    = conns.filter(c => c.type === 'location').length;
  const sharedPeople = selectedIdx >= 0
    ? [...new Set(conns.flatMap(c => PHOTOS[c.toIdx].people.filter(p => photo.people.includes(p))))]
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:90,
          background:'rgba(0,0,0,0.72)',
          opacity: visible ? 1 : 0,
          transition:'opacity 0.3s ease',
          backdropFilter:'blur(4px)',
        }}
      />
      {/* Photo card */}
      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform: visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.92)',
        zIndex:100,
        opacity: visible ? 1 : 0,
        transition:'all 0.35s cubic-bezier(0.16,1,0.3,1)',
        maxWidth:'min(85vw, 820px)',
        maxHeight:'85vh',
        display:'flex', flexDirection:'column',
        alignItems:'center',
      }}>
        {/* Image */}
        <div style={{
          border:'1px solid rgba(201,168,76,0.35)',
          boxShadow:'0 0 40px rgba(0,180,255,0.15), 0 0 0 1px rgba(201,168,76,0.12)',
          borderRadius:'4px',
          overflow:'hidden',
          background:'#000',
          maxWidth:'100%',
          maxHeight:'calc(85vh - 80px)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.file}
            style={{
              display:'block',
              maxWidth:'100%',
              maxHeight:'calc(85vh - 80px)',
              objectFit:'contain',
            }}
          />
        </div>

        {/* Meta */}
        <div style={{
          marginTop:'0.8rem',
          display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem',
          textAlign:'center',
        }}>
          <p style={{
            fontFamily:'"Cormorant Garamond",serif', fontSize:'1rem',
            color:'rgba(255,255,255,0.85)', margin:0, letterSpacing:'0.05em',
          }}>
            {photo.label} · {photo.date.slice(0,12)}
          </p>
          {photo.people.length > 0 && (
            <p style={{
              fontFamily:'Inter,sans-serif', fontSize:'0.6rem',
              letterSpacing:'0.15em', color:'rgba(201,168,76,0.7)',
              textTransform:'uppercase', margin:0,
            }}>
              {photo.people.join(' · ')}
            </p>
          )}

          {/* Connection summary (shown after click) */}
          {selectedIdx >= 0 && conns.length > 0 && (
            <p style={{
              fontFamily:'Inter,sans-serif', fontSize:'0.55rem',
              letterSpacing:'0.12em', color:'rgba(0,210,255,0.55)',
              textTransform:'uppercase', margin:'0.2rem 0 0',
            }}>
              {peopleConns > 0 && `${peopleConns} shared memories`}
              {timeConns > 0 && ` · ${timeConns} nearby in time`}
              {locConns > 0 && ` · ${locConns} same place`}
              {sharedPeople.length > 0 && ` — ${sharedPeople.slice(0,3).join(', ')}`}
            </p>
          )}
          {selectedIdx < 0 && (
            <p style={{
              fontFamily:'Inter,sans-serif', fontSize:'0.55rem',
              letterSpacing:'0.18em', color:'rgba(255,255,255,0.2)',
              textTransform:'uppercase', margin:'0.2rem 0 0',
            }}>
              Click to reveal connections
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position:'absolute', top:'-0.8rem', right:'-0.8rem',
            background:'rgba(0,8,20,0.9)', border:'1px solid rgba(0,212,255,0.2)',
            color:'rgba(255,255,255,0.5)', borderRadius:'50%',
            width:'28px', height:'28px', cursor:'pointer',
            fontFamily:'Inter,sans-serif', fontSize:'0.65rem',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
        >
          ×
        </button>
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function WorldAtlasGlobe() {
  const [ready, setReady] = useState(false);

  // Hover → DOM overlay only (no re-render lag: use ref + scheduled setState)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredPhoto,  setHoveredPhoto]  = useState<GalleryPhoto | null>(null);
  const [selectedIdx,   setSelectedIdx]   = useState<number>(-1);

  // Ref for selectedIdx so 3D code can read it without prop drilling re-renders
  const selectedIdxRef = useRef<number>(-1);
  useEffect(() => { selectedIdxRef.current = selectedIdx; }, [selectedIdx]);

  const handleHover = useCallback((idx: number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (idx < 0) {
      // Small delay before hiding overlay so you can move between photos
      hoverTimerRef.current = setTimeout(() => setHoveredPhoto(p => p), 80);
      setHoveredPhoto(null);
    } else {
      setHoveredPhoto(PHOTOS[idx]);
    }
  }, []);

  const handleClick = useCallback((idx: number) => {
    setSelectedIdx(prev => prev === idx ? -1 : idx);
    setHoveredPhoto(PHOTOS[idx]);
  }, []);

  const handleClose = useCallback(() => {
    setHoveredPhoto(null);
    setSelectedIdx(-1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'radial-gradient(ellipse at 40% 45%, #00091a 0%, #000000 75%)',
      opacity: ready ? 1 : 0,
      transition:'opacity 1.2s ease',
    }}>
      <div className="grain-overlay" aria-hidden />

      <Canvas
        camera={{ position:[0,0,7], fov:48 }}
        gl={{ antialias:true, alpha:true }}
        style={{ position:'absolute', inset:0, pointerEvents:'auto', cursor:'grab' }}
        dpr={[1,2]}
      >
        <ambientLight intensity={0.15} />
        <pointLight position={[10,10,10]}   intensity={0.4} color="#4488ff" />
        <pointLight position={[-10,-5,-10]} intensity={0.2} color="#002244" />
        <Stars radius={50} depth={50} count={4000} factor={3.5} fade speed={0.6} />

        <GlobeGroup
          selectedIdxRef={selectedIdxRef}
          onHover={handleHover}
          onClick={handleClick}
        />

        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.06}
          minDistance={3.5} maxDistance={12} rotateSpeed={0.55} zoomSpeed={0.7} />

        <EffectComposer>
          <Bloom intensity={1.6} luminanceThreshold={0.15} luminanceSmoothing={0.9} />
          <Vignette darkness={0.55} offset={0.3} />
        </EffectComposer>
      </Canvas>

      {/* Photo overlay — DOM layer, outside Canvas */}
      <PhotoOverlay
        photo={hoveredPhoto}
        selectedIdx={selectedIdx}
        onClose={handleClose}
      />

      {!hoveredPhoto && (
        <div style={{
          position:'fixed', bottom:'2.2rem', left:'50%',
          transform:'translateX(-50%)',
          fontFamily:'Inter,sans-serif', fontSize:'0.58rem',
          letterSpacing:'0.22em', color:'rgba(255,255,255,0.16)',
          textTransform:'uppercase', textAlign:'center',
          pointerEvents:'none',
          opacity: ready ? 1 : 0, transition:'opacity 2s ease 1.5s',
        }}>
          Hover a memory · Click to reveal connections · ESC to close
        </div>
      )}
    </div>
  );
}
