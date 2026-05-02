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
  file:string; src:string; lat:number; lng:number;
  ts:number; date:string; cluster:string; label:string; people:string[];
}
const PHOTOS = RAW_DATA as GalleryPhoto[];
const N = PHOTOS.length;

// ─── Module-level constants & temporaries (no GC pressure) ───────────────────
const R = 2.4;

const _gQ    = new THREE.Quaternion();
const _cinQ  = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _wPos  = new THREE.Vector3();
const _wSurf = new THREE.Vector3();
const _col   = new THREE.Color();
const _screenCtr = new THREE.Vector3();
const _tintCol  = new THREE.Color(0.55, 0.82, 1.0);
const _clearCol = new THREE.Color(1, 1, 1);

const SHARED_GEO = new THREE.PlaneGeometry(1.333, 1);
SHARED_GEO.computeBoundingSphere();
const SHARED_BORDER_GEO = new THREE.PlaneGeometry(1.333, 1);
SHARED_BORDER_GEO.computeBoundingSphere();

// ─── Geo helpers ─────────────────────────────────────────────────────────────
function ll2v(lat:number,lon:number,r=R){
  const p=(90-lat)*Math.PI/180, t=(lon+180)*Math.PI/180;
  return new THREE.Vector3(-r*Math.sin(p)*Math.cos(t), r*Math.cos(p), r*Math.sin(p)*Math.sin(t));
}
function arcPts(a:[number,number],b:[number,number],elev=0.55,steps=72){
  const v0=ll2v(a[0],a[1]),v1=ll2v(b[0],b[1]);
  return new THREE.QuadraticBezierCurve3(v0,v0.clone().add(v1).normalize().multiplyScalar(R+elev),v1).getPoints(steps);
}
function arcPtsFromVec(v0:THREE.Vector3,v1:THREE.Vector3,elev=0.45,steps=32){
  const mid=v0.clone().add(v1).normalize().multiplyScalar(R+elev);
  return new THREE.QuadraticBezierCurve3(v0.clone(),mid,v1.clone()).getPoints(steps);
}
function monthKey(ts:number){const d=new Date(ts*1000);return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;}

// ─── Pre-compute positions ────────────────────────────────────────────────────
interface PPos { base:THREE.Vector3; surf:THREE.Vector3; }
const PPOS:PPos[] = (()=>{
  const gr=(1+Math.sqrt(5))/2;
  return Array.from({length:N},(_,i)=>{
    const theta=Math.acos(1-2*(i+0.5)/N);
    const phi=2*Math.PI*i/gr;
    const dir=new THREE.Vector3(
      Math.sin(theta)*Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta)*Math.sin(phi)
    );
    const rOff=0.32+(i%9)*0.07;
    return{base:dir.clone().multiplyScalar(R+rOff),surf:dir.clone().multiplyScalar(R+0.01)};
  });
})();

// ─── Month buckets — photos sharing the same calendar year+month ─────────────
const MONTH_MATES:number[][] = (()=>{
  const buckets = new Map<string, number[]>();
  PHOTOS.forEach((p,i)=>{
    const k = monthKey(p.ts);
    if(!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(i);
  });
  return PHOTOS.map((_,i)=>{
    const k = monthKey(PHOTOS[i].ts);
    return buckets.get(k)!.filter(j=>j!==i);
  });
})();
const MAX_MATES = MONTH_MATES.reduce((m,a)=>Math.max(m,a.length),0);

// ─── Earth components (compact) ───────────────────────────────────────────────
function EarthSphere(){return<mesh renderOrder={0}><sphereGeometry args={[R,64,64]}/><meshPhongMaterial color="#000d1a" emissive="#003366" emissiveIntensity={0.12} transparent opacity={0.96} depthWrite/></mesh>;}
function Glow(){return<mesh renderOrder={1}><sphereGeometry args={[R*1.04,32,32]}/><meshBasicMaterial color="#00aaff" transparent opacity={0.04} side={THREE.BackSide}/></mesh>;}
function Cage(){const geo=useMemo(()=>new THREE.IcosahedronGeometry(R*1.18,2),[]);return<mesh geometry={geo} renderOrder={3}><meshBasicMaterial color="#00c8e8" wireframe transparent opacity={0.09}/></mesh>;}
function Grid(){
  const geo=useMemo(()=>{
    const p:number[]=[],s=64;
    for(let lat=-60;lat<=60;lat+=30)for(let i=0;i<s;i++){p.push(...ll2v(lat,(i/s)*360-180,R+.002).toArray(),...ll2v(lat,((i+1)/s)*360-180,R+.002).toArray());}
    for(let lon=-180;lon<180;lon+=30)for(let i=0;i<s;i++){p.push(...ll2v((i/s)*180-90,lon,R+.002).toArray(),...ll2v(((i+1)/s)*180-90,lon,R+.002).toArray());}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return g;
  },[]);
  return<lineSegments geometry={geo} renderOrder={2}><lineBasicMaterial color="#003355" transparent opacity={0.18}/></lineSegments>;
}
function Coasts(){
  const[geo,setGeo]=useState<THREE.BufferGeometry|null>(null);
  useEffect(()=>{
    let dead=false;
    fetch('/world-land-110m.json').then(r=>r.json()).then((w:Topology<{land:GeometryCollection}>)=>{
      if(dead)return;
      const c=topoMesh(w,w.objects.land);const p:number[]=[];
      for(const ring of c.coordinates as number[][][])
        for(let i=0;i<ring.length-1;i++){const v0=ll2v(ring[i][1],ring[i][0],R+.005),v1=ll2v(ring[i+1][1],ring[i+1][0],R+.005);p.push(v0.x,v0.y,v0.z,v1.x,v1.y,v1.z);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));setGeo(g);
    }).catch(()=>{});
    return()=>{dead=true;};
  },[]);
  if(!geo)return null;
  return<lineSegments geometry={geo} renderOrder={2}><lineBasicMaterial color="#00d4ff" transparent opacity={0.28}/></lineSegments>;
}
const ARC_PAIRS:[[number,number],[number,number]][]=[ [[42.5,-71.8],[40.7,-74.0]],[[42.5,-71.8],[42.9,-71.5]],[[42.5,-71.8],[42.4,-71.1]],[[42.5,-71.8],[29.8,-95.4]],[[42.5,-71.8],[21.2,-86.8]],[[40.7,-74.0],[42.4,-71.1]] ];
function Arcs(){
  const lines=useMemo(()=>ARC_PAIRS.map(([a,b])=>{const g=new THREE.BufferGeometry().setFromPoints(arcPts(a,b));const m=new THREE.LineBasicMaterial({color:'#c9a84c',transparent:true,opacity:0.22});const l=new THREE.Line(g,m);l.renderOrder=5;return l;}),[]);
  return<>{lines.map((l,i)=><primitive key={i} object={l}/>)}</>;
}

// ─── Globe group ──────────────────────────────────────────────────────────────
function GlobeGroup({globeRef,pausedRef}:{globeRef:React.RefObject<THREE.Group|null>;pausedRef:React.MutableRefObject<boolean>;}){
  useFrame((_,d)=>{if(globeRef.current&&!pausedRef.current)globeRef.current.rotation.y+=d*0.045;});
  return(
    <group ref={globeRef as React.RefObject<THREE.Group>}>
      <EarthSphere/><Glow/><Grid/><Coasts/><Cage/><Arcs/>
    </group>
  );
}

// ─── Floating Holograms — outside globe group for clean billboarding ──────────
interface HoloProps{
  globeRef:React.RefObject<THREE.Group|null>;
  globalHoverRef:React.MutableRefObject<number>;
  globalLinkedRef:React.MutableRefObject<number>;
  onHoverChange:(i:number)=>void;
  onSingleClick:(i:number)=>void;
  onDoubleClick:(i:number)=>void;
}

const ARC_STEPS = 32;

function FloatingHolograms({globeRef,globalHoverRef,globalLinkedRef,onHoverChange,onSingleClick,onDoubleClick}:HoloProps){
  // visRefs = visual photo plane (raycast disabled), hitRefs = invisible static hit sphere on globe
  const visRefs =useRef<(THREE.Mesh|null)[]>(PHOTOS.map(()=>null));
  const hitRefs =useRef<(THREE.Mesh|null)[]>(PHOTOS.map(()=>null));
  const matRefs =useRef<(THREE.MeshBasicMaterial|null)[]>(PHOTOS.map(()=>null));
  // borderRefs = pool of glow border planes (one per photo, only month-mates show)
  const borderRefs =useRef<(THREE.Mesh|null)[]>(PHOTOS.map(()=>null));
  const borderMatRefs =useRef<(THREE.MeshBasicMaterial|null)[]>(PHOTOS.map(()=>null));

  // Gold glow plane behind hovered photo
  const glowMat =useMemo(()=>new THREE.MeshBasicMaterial({color:'#c9a84c',transparent:true,opacity:0,depthTest:false}),[]);
  const glowMesh=useMemo(()=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.333,1.0),glowMat);m.renderOrder=8;return m;},[glowMat]);

  // Per-photo animation state
  const scales      =useRef(new Float32Array(N).fill(0.12));
  const opacs       =useRef(new Float32Array(N).fill(0.48));
  const rotYs       =useRef(new Float32Array(N).fill(0));
  const rotZs       =useRef(new Float32Array(N).fill(0));
  const tintTs      =useRef(new Float32Array(N).fill(0));
  const borderOpacs =useRef(new Float32Array(N).fill(0));
  const bobs        =useRef(new Float32Array(N).map((_,i)=>Math.random()*Math.PI*2+i));

  // Linked-mode tracking
  const prevLinkedRef = useRef(-1);
  const matesSetRef   = useRef(new Set<number>());

  // Texture loading — limited concurrency
  useEffect(()=>{
    let idx=0,active=0;
    const next=()=>{ while(idx<N&&active<20){const i=idx++;active++;new THREE.TextureLoader().load(PHOTOS[i].src,t=>{t.colorSpace=THREE.SRGBColorSpace;active--;if(matRefs.current[i]){matRefs.current[i]!.map=t;matRefs.current[i]!.needsUpdate=true;}next();},undefined,()=>{active--;next();});} };
    next();
  },[]);

  // Arc line pool — sized to largest possible month bucket
  const POOL = Math.max(MAX_MATES, 8);
  const aArrs = useMemo(()=>Array.from({length:POOL},()=>new Float32Array((ARC_STEPS+1)*3)),[POOL]);
  const aGeos = useMemo(()=>aArrs.map(arr=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));g.setDrawRange(0, ARC_STEPS+1);return g;}),[aArrs]);
  const aMats = useMemo(()=>Array.from({length:POOL},()=>new THREE.LineBasicMaterial({color:'#ffd66b',transparent:true,opacity:0,depthTest:false,blending:THREE.AdditiveBlending})),[POOL]);
  const aLines = useMemo(()=>aGeos.map((g,i)=>{const l=new THREE.Line(g,aMats[i]); l.renderOrder=7; l.frustumCulled=false; return l;}),[aGeos,aMats]);

  // Base-space arc points (recomputed only when linkedIdx changes)
  const aBasePts = useRef<THREE.Vector3[][]>(Array.from({length:POOL},()=>[]));
  const aActiveCount = useRef(0);

  // Pin line — shows where the linked photo's globe position is
  const pinMat=useMemo(()=>new THREE.LineBasicMaterial({color:'#ffd66b',transparent:true,opacity:0,depthTest:false}),[]);
  const pinArr=useMemo(()=>new Float32Array(6),[]);
  const pinGeo=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pinArr,3));return g;},[pinArr]);
  const pinLine=useMemo(()=>new THREE.Line(pinGeo,pinMat),[pinGeo,pinMat]);

  useFrame(({camera},delta) => {
    const h=globalHoverRef.current, s=globalLinkedRef.current;
    const anyHov=h>=0, anyLink=s>=0;
    _screenCtr.set(0,0,-3.5).applyMatrix4(camera.matrixWorld);

    // ── Recompute month-mate set & arc base points when linked changes
    if(s !== prevLinkedRef.current){
      prevLinkedRef.current = s;
      matesSetRef.current.clear();
      aActiveCount.current = 0;
      if(s >= 0){
        const mates = MONTH_MATES[s];
        const limit = Math.min(mates.length, POOL);
        const v0 = PPOS[s].base;
        for(let li=0; li<limit; li++){
          const j = mates[li];
          matesSetRef.current.add(j);
          aBasePts.current[li] = arcPtsFromVec(v0, PPOS[j].base, 0.45, ARC_STEPS);
        }
        aActiveCount.current = limit;
      }
    }

    const matesSet = matesSetRef.current;

    // Globe world quaternion
    if(globeRef.current) globeRef.current.getWorldQuaternion(_gQ);
    else _gQ.identity();

    const t=performance.now()/1000;

    // Hit spheres track globe rotation (invisible static hit targets)
    for(let i=0;i<N;i++){
      const hit=hitRefs.current[i];
      if(hit){ _wPos.copy(PPOS[i].base).applyQuaternion(_gQ); hit.position.copy(_wPos); }
    }

    for(let i=0;i<N;i++){
      const mesh=visRefs.current[i];const mat=matRefs.current[i];
      if(!mesh||!mat)continue;

      const iAmHov  = i===h;
      const iAmLink = i===s;
      const isMate  = matesSet.has(i);
      const isPrimary = iAmHov; // centered photo
      const isEmphasized = iAmLink || isMate;

      // ── Scale target — only the hovered photo flies to center
      let tSc:number;
      if(isPrimary)            tSc = 0.26;
      else if(isEmphasized)    tSc = 0.13;
      else if(anyHov||anyLink) tSc = 0.06;
      else                     tSc = 0.12;
      scales.current[i]+=(tSc-scales.current[i])*Math.min(delta*9,1);

      // ── Opacity target
      const tOp = isPrimary ? 1.0 : isEmphasized ? 0.95 : (anyHov||anyLink) ? 0.05 : 0.48;
      opacs.current[i]+=(tOp-opacs.current[i])*Math.min(delta*9,1);

      // ── Tint (0=cyan holographic, 1=full color)
      const tTint = (isPrimary||isEmphasized) ? 1 : 0;
      tintTs.current[i]+=(tTint-tintTs.current[i])*Math.min(delta*9,1);

      // ── Cinematic rotation — spring back to 0
      if(iAmHov){
        rotYs.current[i]+=(0-rotYs.current[i])*Math.min(delta*4.5,1);
        rotZs.current[i]+=(0-rotZs.current[i])*Math.min(delta*7.0,1);
      } else {
        rotYs.current[i]=0; rotZs.current[i]=0;
      }

      // ── World position = base position rotated by globe
      _wPos.copy(PPOS[i].base).applyQuaternion(_gQ);

      // Bob only when nothing active
      if(!anyHov && !anyLink){
        bobs.current[i]+=delta*0.55;
        _wPos.y+=Math.sin(bobs.current[i])*0.009;
      }

      // ── Position: hovered → screen center; everything else → globe surface
      if(isPrimary){
        mesh.position.lerp(_screenCtr, Math.min(delta*12,1));
      } else {
        mesh.position.lerp(_wPos, Math.min(delta*12,1));
      }
      mesh.scale.setScalar(scales.current[i]);
      mesh.renderOrder = iAmHov ? 12 : isEmphasized ? (10 + i/N) : (6 + i/N);

      // Billboard
      mesh.quaternion.copy(camera.quaternion);
      if(rotYs.current[i]!==0 || rotZs.current[i]!==0){
        _euler.set(rotZs.current[i], rotYs.current[i], 0, 'YXZ');
        _cinQ.setFromEuler(_euler);
        mesh.quaternion.multiply(_cinQ);
      }

      mat.opacity = opacs.current[i];
      _col.copy(_tintCol).lerp(_clearCol, tintTs.current[i]);
      mat.color.copy(_col);

      // ── Glow border (month-mates only) — pulses to indicate luminating link
      const border = borderRefs.current[i];
      const bMat = borderMatRefs.current[i];
      if(border && bMat){
        const tBorder = isMate ? (0.55 + 0.30*Math.sin(t*2.8 + i*0.4)) : 0;
        borderOpacs.current[i] += (tBorder - borderOpacs.current[i]) * Math.min(delta*6, 1);
        bMat.opacity = borderOpacs.current[i];
        if(borderOpacs.current[i] > 0.01){
          border.visible = true;
          border.position.copy(mesh.position);
          border.quaternion.copy(mesh.quaternion);
          border.scale.copy(mesh.scale).multiplyScalar(1.22);
          border.renderOrder = mesh.renderOrder - 0.5;
        } else {
          border.visible = false;
        }
      }
    }

    // ── Gold glow behind primary (hovered) photo
    const glowTarget = h>=0 ? visRefs.current[h] : null;
    if(glowTarget){
      glowMesh.visible=true;
      glowMesh.position.copy(glowTarget.position);
      glowMesh.quaternion.copy(camera.quaternion);
      glowMat.opacity = 0.30 + 0.10*Math.sin(t*2.2);
      glowMesh.scale.setScalar(scales.current[h]);
    } else {
      glowMat.opacity += (0 - glowMat.opacity) * 0.18;
      if(glowMat.opacity < 0.01) glowMesh.visible = false;
    }

    // ── Luminating arcs — from linked photo to each month-mate
    const active = aActiveCount.current;
    for(let li=0; li<POOL; li++){
      if(li < active){
        const pts = aBasePts.current[li];
        const arr = aArrs[li];
        for(let k=0; k<pts.length; k++){
          _wPos.copy(pts[k]).applyQuaternion(_gQ);
          arr[k*3]=_wPos.x; arr[k*3+1]=_wPos.y; arr[k*3+2]=_wPos.z;
        }
        aGeos[li].attributes.position.needsUpdate = true;
        const target = 0.55 + 0.30*Math.sin(t*3.4 + li*0.35);
        aMats[li].opacity += (target - aMats[li].opacity) * 0.18;
      } else if(aMats[li].opacity > 0.01){
        aMats[li].opacity += (0 - aMats[li].opacity) * 0.20;
      }
    }

    // ── Pin line (linked photo → globe surface)
    if(anyLink){
      _wPos.copy(PPOS[s].base).applyQuaternion(_gQ);
      _wSurf.copy(PPOS[s].surf).applyQuaternion(_gQ);
      pinArr[0]=_wPos.x;pinArr[1]=_wPos.y;pinArr[2]=_wPos.z;
      pinArr[3]=_wSurf.x;pinArr[4]=_wSurf.y;pinArr[5]=_wSurf.z;
      pinGeo.attributes.position.needsUpdate=true;
      pinMat.opacity = 0.30 + 0.30*Math.sin(t*3.5);
    } else { pinMat.opacity += (0 - pinMat.opacity) * 0.18; }
  });

  // ── Pointer handlers ────────────────────────────────────────────────────────
  const debounceRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const clickTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);

  const handleOver=(i:number)=>(e:{stopPropagation:()=>void})=>{
    e.stopPropagation();
    if(debounceRef.current) clearTimeout(debounceRef.current);
    const _hd=globalHoverRef.current>=0&&globalHoverRef.current!==i?250:80;
    debounceRef.current=setTimeout(()=>{
      if(globalHoverRef.current===i) return;
      globalHoverRef.current=i;
      rotYs.current[i]=(Math.random()>0.5?1:-1)*(0.42+Math.random()*0.18);
      rotZs.current[i]=(Math.random()>0.5?1:-1)*(0.08+Math.random()*0.11);
      onHoverChange(i);
      document.body.style.cursor='pointer';
    },_hd);
  };
  const handleOut=(i:number)=>()=>{
    if(globalHoverRef.current!==i) return;
    if(debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>{
      if(globalHoverRef.current===i){
        globalHoverRef.current=-1;
        onHoverChange(-1);
        document.body.style.cursor='';
      }
    },80);
  };
  // Distinguish single vs double click via a short delay
  const handleClick=(i:number)=>(e:{stopPropagation:()=>void})=>{
    e.stopPropagation();
    if(clickTimerRef.current){
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current=null;
      onDoubleClick(i);
      return;
    }
    clickTimerRef.current = setTimeout(()=>{
      clickTimerRef.current = null;
      onSingleClick(i);
    }, 240);
  };

  return(
    <group>
      {/* Glow border planes — one per photo, hidden unless month-mate */}
      {PHOTOS.map((_,i)=>(
        <mesh key={`bd-${i}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el:any)=>{borderRefs.current[i]=el;}}
          geometry={SHARED_BORDER_GEO}
          visible={false}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          raycast={()=>{}}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <meshBasicMaterial ref={(el:any)=>{borderMatRefs.current[i]=el;}} color="#ffd66b" transparent opacity={0} side={THREE.DoubleSide} depthTest={false} blending={THREE.AdditiveBlending}/>
        </mesh>
      ))}
      {/* Visual photo planes — raycast disabled */}
      {PHOTOS.map((_,i)=>(
        <mesh key={`vis-${i}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el:any)=>{visRefs.current[i]=el;}}
          geometry={SHARED_GEO}
          position={PPOS[i].base}
          renderOrder={9}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          raycast={()=>{}}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <meshBasicMaterial ref={(el:any)=>{matRefs.current[i]=el;}} color={_tintCol.clone()} transparent opacity={0.48} side={THREE.DoubleSide} depthTest={false}/>
        </mesh>
      ))}
      {/* Invisible hit spheres — STATIC on globe, fire all pointer events */}
      {PHOTOS.map((_,i)=>(
        <mesh key={`hit-${i}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el:any)=>{hitRefs.current[i]=el;}}
          position={PPOS[i].base}
          onPointerOver={handleOver(i)}
          onPointerOut={handleOut(i)}
          onClick={handleClick(i)}
        >
          <sphereGeometry args={[0.07,8,8]}/>
          <meshBasicMaterial visible={false}/>
        </mesh>
      ))}
      <primitive object={glowMesh}/>
      <primitive object={pinLine}/>
      {aLines.map((l,i)=><primitive key={`arc-${i}`} object={l}/>)}
    </group>
  );
}

// ─── Hover overlay (centered, pointer-events:none) ────────────────────────────
function HoverOverlay({hoveredIdx,fullOpenIdx}:{hoveredIdx:number;fullOpenIdx:number}){
  const cardRef=useRef<HTMLDivElement>(null);
  const prevIdx=useRef(-1);
  const photo = hoveredIdx>=0 && fullOpenIdx<0 ? PHOTOS[hoveredIdx] : null;

  useEffect(()=>{
    const card=cardRef.current;
    if(!card)return;
    if(!photo){
      card.style.transition='opacity 0.18s ease,transform 0.18s ease';
      card.style.opacity='0';
      card.style.transform='translate(-50%,-50%) scale(0.94)';
      prevIdx.current=-1;
      return;
    }
    if(hoveredIdx===prevIdx.current)return;
    prevIdx.current=hoveredIdx;
    const ry=(Math.random()>0.5?1:-1)*(42+Math.random()*46);
    const rx=(Math.random()-0.5)*26;
    const rz=(Math.random()-0.5)*14;
    const ease='cubic-bezier(0.22,1,0.36,1)';
    card.style.transition='none';
    card.style.opacity='0';
    card.style.transform=`translate(-50%,-50%) perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(0.15)`;
    void card.getBoundingClientRect();
    card.style.transition=`opacity 0.22s ease,transform 0.52s ${ease}`;
    card.style.opacity='1';
    card.style.transform='translate(-50%,-50%) perspective(1200px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)';
  },[hoveredIdx,photo]);

  return(
    <div ref={cardRef} style={{
      position:'fixed',top:'50%',left:'50%',zIndex:80,
      opacity:0,transform:'translate(-50%,-50%) scale(0.94)',
      maxWidth:'min(55vw,620px)',pointerEvents:'none',
      display:'flex',flexDirection:'column',alignItems:'center',
    }}>
      <div style={{border:'1px solid rgba(255,255,255,0.13)',borderRadius:'3px',overflow:'hidden',background:'#000',maxHeight:'62vh',boxShadow:'0 12px 60px rgba(0,0,0,0.65)'}}>
        {photo&&<img src={photo.src} alt="" style={{display:'block',maxWidth:'100%',maxHeight:'62vh',objectFit:'contain'}}/>}
      </div>
      {photo&&(
        <div style={{marginTop:'0.6rem',textAlign:'center'}}>
          <p style={{fontFamily:'"Cormorant Garamond",serif',fontSize:'1.05rem',fontStyle:'italic',color:'rgba(255,255,255,0.82)',margin:0,letterSpacing:'0.04em'}}>{photo.label}</p>
          {photo.people.length>0&&<p style={{fontFamily:'Inter,sans-serif',fontSize:'0.58rem',letterSpacing:'0.14em',color:'rgba(201,168,76,0.65)',textTransform:'uppercase',margin:'0.2rem 0 0'}}>{photo.people.filter(p=>p!=='Anibal Cabral').slice(0,3).join(' · ')}</p>}
          <p style={{fontFamily:'Inter,sans-serif',fontSize:'0.52rem',letterSpacing:'0.18em',color:'rgba(255,255,255,0.2)',textTransform:'uppercase',margin:'0.2rem 0 0'}}>{photo.date.slice(0,12)} · Click for month · Double-click to open</p>
        </div>
      )}
    </div>
  );
}

// ─── Photo overlay (double-click full view) ───────────────────────────────────
function PhotoOverlay({fullOpenIdx,onClose}:{fullOpenIdx:number;onClose:()=>void;}){
  const cardRef=useRef<HTMLDivElement>(null);
  const bdRef  =useRef<HTMLDivElement>(null);
  const prevSel=useRef(-1);

  const photo = fullOpenIdx>=0 ? PHOTOS[fullOpenIdx] : null;
  const mateCount = fullOpenIdx>=0 ? MONTH_MATES[fullOpenIdx].length : 0;

  useEffect(()=>{
    const card=cardRef.current,bd=bdRef.current;
    if(!card||!bd)return;
    if(fullOpenIdx<0){
      card.style.transition='opacity 0.22s ease,transform 0.22s ease';
      card.style.opacity='0';card.style.transform='translate(-50%,-50%) scale(0.94)';
      bd.style.transition='opacity 0.22s ease';bd.style.opacity='0';bd.style.pointerEvents='none';
      prevSel.current=-1;return;
    }
    if(fullOpenIdx===prevSel.current)return;
    prevSel.current=fullOpenIdx;
    const ease='cubic-bezier(0.22,1,0.36,1)';
    card.style.transition='none';
    card.style.opacity='0';card.style.transform='translate(-50%,-50%) perspective(1000px) rotateY(12deg) scale(0.88)';
    bd.style.transition='none';bd.style.opacity='0';
    void card.getBoundingClientRect();
    card.style.transition=`opacity 0.3s ease,transform 0.5s ${ease}`;
    card.style.opacity='1';card.style.transform='translate(-50%,-50%) perspective(1000px) rotateY(0deg) scale(1)';
    bd.style.transition='opacity 0.3s ease';bd.style.opacity='1';bd.style.pointerEvents='auto';
  },[fullOpenIdx]);

  return(
    <>
      <div ref={bdRef} onClick={onClose} style={{position:'fixed',inset:0,zIndex:90,background:'rgba(0,0,0,0.70)',backdropFilter:'blur(5px)',opacity:0,pointerEvents:'none'}}/>
      <div ref={cardRef} style={{position:'fixed',top:'50%',left:'50%',zIndex:100,opacity:0,transform:'translate(-50%,-50%) scale(0.94)',display:'flex',flexDirection:'column',alignItems:'center',maxWidth:'min(88vw,900px)',pointerEvents:'none'}}>
        <div style={{position:'relative',border:'1px solid rgba(201,168,76,0.45)',boxShadow:'0 0 60px rgba(201,168,76,0.14)',borderRadius:'4px',overflow:'visible',background:'#000',maxHeight:'78vh',pointerEvents:'auto'}}>
          {photo&&<img src={photo.src} alt="" style={{display:'block',maxWidth:'100%',maxHeight:'78vh',objectFit:'contain',borderRadius:'4px'}}/>}
          <button onClick={onClose} aria-label="Close" style={{position:'absolute',top:'-12px',right:'-12px',background:'rgba(0,6,16,0.95)',border:'1px solid rgba(255,214,107,0.55)',color:'rgba(255,255,255,0.85)',borderRadius:'50%',width:'30px',height:'30px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',lineHeight:1,pointerEvents:'auto',boxShadow:'0 0 16px rgba(255,214,107,0.25)'}}>×</button>
        </div>
        {photo&&(
          <div style={{marginTop:'0.75rem',textAlign:'center',display:'flex',flexDirection:'column',gap:'0.22rem',pointerEvents:'auto'}}>
            <p style={{fontFamily:'"Cormorant Garamond",serif',fontSize:'1.1rem',color:'rgba(255,255,255,0.88)',margin:0,letterSpacing:'0.05em'}}>{photo.label} · {photo.date.slice(0,12)}</p>
            {photo.people.length>0&&<p style={{fontFamily:'Inter,sans-serif',fontSize:'0.6rem',letterSpacing:'0.15em',color:'rgba(201,168,76,0.72)',textTransform:'uppercase',margin:0}}>{photo.people.join(' · ')}</p>}
            {mateCount>0&&<p style={{fontFamily:'Inter,sans-serif',fontSize:'0.55rem',letterSpacing:'0.12em',color:'rgba(255,214,107,0.55)',textTransform:'uppercase',margin:'0.15rem 0 0'}}>{mateCount} photos that month</p>}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WorldAtlasGlobe(){
  const[ready,setReady]=useState(false);
  const[hoveredIdx,setHoveredIdx]=useState(-1);
  const[linkedIdx,setLinkedIdx]=useState(-1);     // single-click → month strings
  const[fullOpenIdx,setFullOpenIdx]=useState(-1); // double-click → full overlay

  const globeRef       = useRef<THREE.Group|null>(null);
  const pausedRef      = useRef(false);
  const globalHovRef   = useRef(-1);
  const globalLinkedRef= useRef(-1);
  const fullOpenRef    = useRef(-1);

  useEffect(()=>{globalLinkedRef.current=linkedIdx;},[linkedIdx]);
  useEffect(()=>{fullOpenRef.current=fullOpenIdx;},[fullOpenIdx]);

  // Globe spins unless hovered or full-open. Linked-mode alone never pauses;
  // it only persists while hovering, and hover already pauses.
  const recomputePause = useCallback(()=>{
    pausedRef.current = globalHovRef.current>=0 || fullOpenRef.current>=0;
  },[]);

  const handleHoverChange=useCallback((i:number)=>{
    globalHovRef.current = i;
    setHoveredIdx(i);
    // Hover-out clears month-link mode — image closes back down, globe resumes.
    if(i<0 && globalLinkedRef.current>=0){
      globalLinkedRef.current = -1;
      setLinkedIdx(-1);
    }
    recomputePause();
  },[recomputePause]);

  const handleSingleClick=useCallback((i:number)=>{
    // Toggle: same photo clicked again clears the link.
    const next = globalLinkedRef.current===i ? -1 : i;
    globalLinkedRef.current = next;
    setLinkedIdx(next);
  },[]);

  const handleDoubleClick=useCallback((i:number)=>{
    // Open full overlay; clear hover/link to dismiss the centered hover card.
    globalLinkedRef.current = -1;
    setLinkedIdx(-1);
    globalHovRef.current = -1;
    setHoveredIdx(-1);
    fullOpenRef.current = i;
    setFullOpenIdx(i);
    pausedRef.current = true;
    document.body.style.cursor='';
  },[]);

  const handleCloseFull=useCallback(()=>{
    fullOpenRef.current = -1;
    setFullOpenIdx(-1);
    recomputePause();
  },[recomputePause]);

  useEffect(()=>{const t=setTimeout(()=>setReady(true),200);return()=>clearTimeout(t);},[]);
  useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Escape')handleCloseFull();};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);},[handleCloseFull]);

  return(
    <div style={{position:'fixed',inset:0,background:'radial-gradient(ellipse at 40% 45%,#00091a 0%,#000000 75%)',opacity:ready?1:0,transition:'opacity 1.2s ease'}}>
      <div className="grain-overlay" aria-hidden/>

      <Canvas camera={{position:[0,0,7],fov:48}} gl={{antialias:true,alpha:true}} style={{position:'absolute',inset:0,pointerEvents:'auto',cursor:'grab'}} dpr={[1,2]}>
        <ambientLight intensity={0.15}/>
        <pointLight position={[10,10,10]}   intensity={0.4} color="#4488ff"/>
        <pointLight position={[-10,-5,-10]} intensity={0.2} color="#002244"/>
        <Stars radius={50} depth={50} count={4000} factor={3.5} fade speed={0.6}/>

        <GlobeGroup globeRef={globeRef} pausedRef={pausedRef}/>

        <FloatingHolograms
          globeRef={globeRef}
          globalHoverRef={globalHovRef}
          globalLinkedRef={globalLinkedRef}
          onHoverChange={handleHoverChange}
          onSingleClick={handleSingleClick}
          onDoubleClick={handleDoubleClick}
        />

        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.06} minDistance={3.5} maxDistance={12} rotateSpeed={0.55} zoomSpeed={0.7}/>
        <EffectComposer>
          <Bloom intensity={1.6} luminanceThreshold={0.15} luminanceSmoothing={0.9}/>
          <Vignette darkness={0.55} offset={0.3}/>
        </EffectComposer>
      </Canvas>

      <HoverOverlay hoveredIdx={hoveredIdx} fullOpenIdx={fullOpenIdx}/>
      <PhotoOverlay fullOpenIdx={fullOpenIdx} onClose={handleCloseFull}/>

      {fullOpenIdx<0&&(
        <div style={{position:'fixed',bottom:'2.2rem',left:'50%',transform:'translateX(-50%)',fontFamily:'Inter,sans-serif',fontSize:'0.58rem',letterSpacing:'0.22em',color:'rgba(255,255,255,0.15)',textTransform:'uppercase',textAlign:'center',pointerEvents:'none',opacity:ready?1:0,transition:'opacity 2s ease 1.5s'}}>
          Hover · Click for month · Double-click to open · ESC to close
        </div>
      )}
    </div>
  );
}
