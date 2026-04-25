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
  file: string; src: string; lat: number; lng: number;
  ts: number; date: string; cluster: string; label: string; people: string[];
}
const PHOTOS = RAW_DATA as GalleryPhoto[];

// ─── Constants ────────────────────────────────────────────────────────────────
const R = 2.4;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const THIRTY_DAYS  = 30 * 24 * 3600;

const MAX_SPREAD: Record<string, number> = {
  worcester:   2.2,  'nyc-nj': 1.5,  manchester: 0.6,
  cancun:      0.7,  houston:  0.6,  boston:     0.6,
  scranton:    0.5,  springfield: 0.4, other: 0.3,
};
const CLUSTER_ANCHORS: Record<string, [number, number]> = {
  worcester:   [42.5,-71.8], 'nyc-nj': [40.7,-74.0], manchester: [42.9,-71.5],
  cancun:      [21.2,-86.8], houston:  [29.8,-95.4],  boston:     [42.4,-71.1],
  scranton:    [41.4,-75.6], springfield:[42.1,-72.6], other:      [40.0,-75.0],
};

// ─── Geo helpers ─────────────────────────────────────────────────────────────
function latLonToVec3(lat: number, lon: number, r = R): THREE.Vector3 {
  const phi = (90-lat)*(Math.PI/180), theta = (lon+180)*(Math.PI/180);
  return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta));
}
function arcPoints(a:[number,number], b:[number,number], elev=0.55, steps=72): THREE.Vector3[] {
  const v0=latLonToVec3(a[0],a[1]), v1=latLonToVec3(b[0],b[1]);
  return new THREE.QuadraticBezierCurve3(v0, v0.clone().add(v1).normalize().multiplyScalar(R+elev), v1).getPoints(steps);
}
function tangentFrame(lat:number, lng:number): [THREE.Vector3,THREE.Vector3] {
  const n=latLonToVec3(lat,lng,1), up=new THREE.Vector3(0,1,0);
  const t1=up.clone().sub(n.clone().multiplyScalar(up.dot(n))).normalize();
  return [t1, new THREE.Vector3().crossVectors(n,t1).normalize()];
}

// ─── Pre-compute positions ────────────────────────────────────────────────────
interface PhotoPos { localPos: THREE.Vector3; surfacePos: THREE.Vector3; }
const PHOTO_POSITIONS: PhotoPos[] = (() => {
  const byCluster = new Map<string,number[]>();
  PHOTOS.forEach((p,i)=>{ const a=byCluster.get(p.cluster)??[]; a.push(i); byCluster.set(p.cluster,a); });
  const res: PhotoPos[] = new Array(PHOTOS.length);
  byCluster.forEach((idxs,cluster)=>{
    const anchor=CLUSTER_ANCHORS[cluster]??[PHOTOS[idxs[0]].lat,PHOTOS[idxs[0]].lng];
    const [t1,t2]=tangentFrame(anchor[0],anchor[1]);
    const spread=MAX_SPREAD[cluster]??0.3, N=idxs.length;
    idxs.forEach((idx,i)=>{
      const sR=Math.sqrt(i/N)*spread, sT=i*GOLDEN_ANGLE;
      const off=t1.clone().multiplyScalar(sR*Math.cos(sT)).add(t2.clone().multiplyScalar(sR*Math.sin(sT)));
      const dir=latLonToVec3(PHOTOS[idx].lat,PHOTOS[idx].lng,R).add(off).normalize();
      const rOff=0.32+(i%9)*0.07;
      res[idx]={ localPos:dir.clone().multiplyScalar(R+rOff), surfacePos:dir.clone().multiplyScalar(R+0.01) };
    });
  });
  return res;
})();

// ─── Pre-compute connections ──────────────────────────────────────────────────
interface Connection { toIdx:number; type:'people-strong'|'people-weak'|'time'|'location'; }
const CONNECTIONS: Connection[][] = PHOTOS.map((p,i)=>{
  const res:Connection[]=[];
  for(let j=0;j<PHOTOS.length&&res.length<12;j++){
    if(j===i) continue; const q=PHOTOS[j];
    const shared=p.people.filter(x=>q.people.includes(x)).length;
    if(shared>=2){ res.push({toIdx:j,type:'people-strong'}); continue; }
    if(shared===1){ res.push({toIdx:j,type:'people-weak'}); continue; }
    if(Math.abs(p.ts-q.ts)<=THIRTY_DAYS){ res.push({toIdx:j,type:'time'}); continue; }
    if(p.cluster===q.cluster&&res.length<6){ res.push({toIdx:j,type:'location'}); }
  }
  return res.sort((a,b)=>({'people-strong':0,'people-weak':1,'time':2,'location':3}[a.type]-({'people-strong':0,'people-weak':1,'time':2,'location':3}[b.type]))).slice(0,12);
});

const LINE_COLORS  = {'people-strong':'#c9a84c','people-weak':'#c9a84c','time':'#ff66cc','location':'#00d2ff'} as const;
const LINE_OPACITY = {'people-strong':0.75,'people-weak':0.40,'time':0.30,'location':0.22} as const;

// ─── Earth ────────────────────────────────────────────────────────────────────
function EarthSphere(){return(<mesh renderOrder={0}><sphereGeometry args={[R,64,64]}/><meshPhongMaterial color="#000d1a" emissive="#003366" emissiveIntensity={0.12} transparent opacity={0.96} depthWrite/></mesh>);}
function AtmosphericGlow(){return(<mesh renderOrder={1}><sphereGeometry args={[R*1.04,32,32]}/><meshBasicMaterial color="#00aaff" transparent opacity={0.04} side={THREE.BackSide}/></mesh>);}
function OuterCage(){const geo=useMemo(()=>new THREE.IcosahedronGeometry(R*1.18,2),[]);return(<mesh geometry={geo} renderOrder={3}><meshBasicMaterial color="#00c8e8" wireframe transparent opacity={0.10}/></mesh>);}
function LatLonGrid(){
  const geo=useMemo(()=>{
    const pos:number[]=[],s=64;
    for(let lat=-60;lat<=60;lat+=30)for(let i=0;i<s;i++){pos.push(...latLonToVec3(lat,(i/s)*360-180,R+0.002).toArray(),...latLonToVec3(lat,((i+1)/s)*360-180,R+0.002).toArray());}
    for(let lon=-180;lon<180;lon+=30)for(let i=0;i<s;i++){pos.push(...latLonToVec3((i/s)*180-90,lon,R+0.002).toArray(),...latLonToVec3(((i+1)/s)*180-90,lon,R+0.002).toArray());}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));return g;
  },[]);
  return <lineSegments geometry={geo} renderOrder={2}><lineBasicMaterial color="#003355" transparent opacity={0.18}/></lineSegments>;
}
function ContinentLines(){
  const[geo,setGeo]=useState<THREE.BufferGeometry|null>(null);
  useEffect(()=>{
    let dead=false;
    fetch('/world-land-110m.json').then(r=>r.json()).then((w:Topology<{land:GeometryCollection}>)=>{
      if(dead)return;
      const coast=topoMesh(w,w.objects.land);const pos:number[]=[];
      for(const ring of coast.coordinates as number[][][])
        for(let i=0;i<ring.length-1;i++){const v0=latLonToVec3(ring[i][1],ring[i][0],R+0.005),v1=latLonToVec3(ring[i+1][1],ring[i+1][0],R+0.005);pos.push(v0.x,v0.y,v0.z,v1.x,v1.y,v1.z);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));setGeo(g);
    }).catch(()=>{});
    return()=>{dead=true;};
  },[]);
  if(!geo)return null;
  return <lineSegments geometry={geo} renderOrder={2}><lineBasicMaterial color="#00d4ff" transparent opacity={0.28}/></lineSegments>;
}

const ARC_PAIRS:[[number,number],[number,number]][]=[ [[42.5,-71.8],[40.7,-74.0]],[[42.5,-71.8],[42.9,-71.5]],[[42.5,-71.8],[42.4,-71.1]],[[42.5,-71.8],[29.8,-95.4]],[[42.5,-71.8],[21.2,-86.8]],[[40.7,-74.0],[42.4,-71.1]] ];
function ConnectionArcs(){
  const lines=useMemo(()=>ARC_PAIRS.map(([a,b])=>{const geo=new THREE.BufferGeometry().setFromPoints(arcPoints(a,b));const mat=new THREE.LineBasicMaterial({color:'#c9a84c',transparent:true,opacity:0.22});const l=new THREE.Line(geo,mat);l.renderOrder=5;return l;}),[]);
  return <>{lines.map((l,i)=><primitive key={i} object={l}/>)}</>;
}

// ─── Floating Holograms ───────────────────────────────────────────────────────
const _tintRest=new THREE.Color(0.55,0.82,1.0);
const _white=new THREE.Color(1,1,1);
const _tmp=new THREE.Color();

interface HoloProps {
  hoverRef: React.MutableRefObject<number>;
  selectedRef: React.MutableRefObject<number>;
  onHoverChange: (idx:number)=>void;
  onSelect: (idx:number)=>void;
}

function FloatingHolograms({hoverRef,selectedRef,onHoverChange,onSelect}:HoloProps){
  const sprRefs=useRef<(THREE.Sprite|null)[]>(PHOTOS.map(()=>null));
  const matRefs=useRef<(THREE.SpriteMaterial|null)[]>(PHOTOS.map(()=>null));
  const scales=useRef(new Float32Array(PHOTOS.length).fill(0.12));
  const opacs =useRef(new Float32Array(PHOTOS.length).fill(0.48));

  // Texture loading
  useEffect(()=>{
    let idx=0; let active=0;
    const next=()=>{ while(idx<PHOTOS.length&&active<20){const i=idx++;active++;new THREE.TextureLoader().load(PHOTOS[i].src,t=>{t.colorSpace=THREE.SRGBColorSpace;active--;if(matRefs.current[i]){matRefs.current[i]!.map=t;matRefs.current[i]!.needsUpdate=true;}next();},undefined,()=>{active--;next();});} };
    next();
  },[]);

  // Connection lines pool
  const cMats=useMemo(()=>Array.from({length:12},()=>new THREE.LineBasicMaterial({color:'#c9a84c',transparent:true,opacity:0,depthTest:false})),[]);
  const cArrs=useMemo(()=>Array.from({length:12},()=>new Float32Array(6)),[]);
  const cGeos=useMemo(()=>cArrs.map(arr=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));return g;}),[cArrs]);
  const cLines=useMemo(()=>cGeos.map((g,i)=>new THREE.Line(g,cMats[i])),[cGeos,cMats]);

  // Pin line
  const pinMat=useMemo(()=>new THREE.LineBasicMaterial({color:'#c9a84c',transparent:true,opacity:0,depthTest:false}),[]);
  const pinArr=useMemo(()=>new Float32Array(6),[]);
  const pinGeo=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pinArr,3));return g;},[pinArr]);
  const pinLine=useMemo(()=>new THREE.Line(pinGeo,pinMat),[pinGeo,pinMat]);

  useFrame(()=>{
    const h=hoverRef.current, s=selectedRef.current;
    const connSet=new Set(s>=0?CONNECTIONS[s].map(c=>c.toIdx):[]);

    for(let i=0;i<PHOTOS.length;i++){
      const sp=sprRefs.current[i]; const mat=matRefs.current[i];
      if(!sp||!mat)continue;
      let tOp:number, tSc:number, tTint:number;
      if(s>=0){
        if(i===s){tOp=1.0;tSc=0.16;tTint=0;}
        else if(connSet.has(i)){tOp=0.80;tSc=0.14;tTint=0.3;}
        else{tOp=0.10;tSc=0.09;tTint=0;}
      } else if(h>=0){
        // Hover: just dim others — the DOM overlay handles the big photo
        if(i===h){tOp=0.70;tSc=0.16;tTint=0.6;}
        else{tOp=0.30;tSc=0.11;tTint=0;}
      } else {
        tOp=0.48;tSc=0.12;tTint=0;
      }
      scales.current[i]+=((tSc-scales.current[i])*0.09);
      opacs.current[i] +=((tOp-opacs.current[i])*0.09);
      sp.scale.setScalar(scales.current[i]);
      mat.opacity=opacs.current[i];
      _tmp.copy(_tintRest).lerp(_white,tTint);
      mat.color.copy(_tmp);
    }

    // Connection lines (selection only)
    const connData=s>=0?CONNECTIONS[s]:[];
    connData.slice(0,12).forEach((c,li)=>{
      const from=sprRefs.current[s]?.position??PHOTO_POSITIONS[s].localPos;
      const to  =sprRefs.current[c.toIdx]?.position??PHOTO_POSITIONS[c.toIdx].localPos;
      cArrs[li][0]=from.x;cArrs[li][1]=from.y;cArrs[li][2]=from.z;
      cArrs[li][3]=to.x;  cArrs[li][4]=to.y;  cArrs[li][5]=to.z;
      cGeos[li].attributes.position.needsUpdate=true;
      cMats[li].color.set(LINE_COLORS[c.type]);
      cMats[li].opacity+=(LINE_OPACITY[c.type]-cMats[li].opacity)*0.10;
    });
    for(let li=connData.length;li<12;li++) cMats[li].opacity+=(0-cMats[li].opacity)*0.15;

    // Pin line
    if(s>=0){
      const fp=PHOTO_POSITIONS[s];
      const sp=sprRefs.current[s]?.position??fp.localPos;
      pinArr[0]=sp.x;pinArr[1]=sp.y;pinArr[2]=sp.z;
      pinArr[3]=fp.surfacePos.x;pinArr[4]=fp.surfacePos.y;pinArr[5]=fp.surfacePos.z;
      pinGeo.attributes.position.needsUpdate=true;
      pinMat.opacity=0.3+0.3*Math.sin(performance.now()/1000*3.5);
    } else { pinMat.opacity+=(0-pinMat.opacity)*0.15; }
  });

  return(
    <group>
      {PHOTOS.map((_,i)=>(
        <sprite key={i}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el:any)=>{sprRefs.current[i]=el;}}
          position={PHOTO_POSITIONS[i].localPos}
          scale={[0.12,0.09,1]} renderOrder={7}
          onPointerOver={(e)=>{e.stopPropagation();hoverRef.current=i;onHoverChange(i);document.body.style.cursor='pointer';}}
          onPointerOut={()=>{hoverRef.current=-1;onHoverChange(-1);document.body.style.cursor='';}}
          onClick={(e)=>{e.stopPropagation();onSelect(i);}}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <spriteMaterial ref={(el:any)=>{matRefs.current[i]=el;}} color={_tintRest.clone()} transparent opacity={0.48} depthTest={false}/>
        </sprite>
      ))}
      <primitive object={pinLine}/>
      {cLines.map((l,i)=><primitive key={i} object={l}/>)}
    </group>
  );
}

// ─── Globe group ──────────────────────────────────────────────────────────────
interface GlobeProps extends HoloProps { pausedRef: React.MutableRefObject<boolean>; }
function GlobeGroup({pausedRef,...holoProps}:GlobeProps){
  const ref=useRef<THREE.Group>(null);
  useFrame((_,d)=>{ if(ref.current&&!pausedRef.current) ref.current.rotation.y+=d*0.045; });
  return(
    <group ref={ref}>
      <EarthSphere/><AtmosphericGlow/><LatLonGrid/><ContinentLines/>
      <OuterCage/><ConnectionArcs/>
      <FloatingHolograms {...holoProps}/>
    </group>
  );
}

// ─── Photo overlay (DOM — no Three.js) ───────────────────────────────────────
function PhotoOverlay({
  hoveredIdx, selectedIdx, onClose, onSelect,
}:{
  hoveredIdx:number; selectedIdx:number; onClose:()=>void; onSelect:(i:number)=>void;
}){
  const cardRef    = useRef<HTMLDivElement>(null);
  const backdropRef= useRef<HTMLDivElement>(null);
  const prevIdx    = useRef(-1);

  const photo   = hoveredIdx>=0 ? PHOTOS[hoveredIdx] : null;
  const isSelected = selectedIdx>=0 && selectedIdx===hoveredIdx;
  const conns   = isSelected ? CONNECTIONS[selectedIdx] : [];
  const peopleCt= conns.filter(c=>c.type==='people-strong'||c.type==='people-weak').length;
  const timeCt  = conns.filter(c=>c.type==='time').length;
  const locCt   = conns.filter(c=>c.type==='location').length;

  // Trigger CSS 3D entry animation whenever hoveredIdx changes to a valid photo
  useEffect(()=>{
    const card=cardRef.current; const bd=backdropRef.current;
    if(!card||!bd) return;

    if(hoveredIdx<0){
      // Hide
      card.style.transition='opacity 0.2s ease, transform 0.2s ease';
      card.style.opacity='0';
      card.style.transform='translate(-50%,-50%) scale(0.92)';
      bd.style.transition='opacity 0.2s ease';
      bd.style.opacity='0';
      bd.style.pointerEvents='none';
      return;
    }

    // New photo — only re-animate if it's a different photo
    if(hoveredIdx===prevIdx.current){
      // Just make sure it's visible (e.g. after switching from selected back to hover)
      card.style.transition='opacity 0.2s ease, transform 0.3s ease';
      card.style.opacity='1';
      bd.style.opacity='1';
      bd.style.pointerEvents='auto';
      prevIdx.current=hoveredIdx;
      return;
    }
    prevIdx.current=hoveredIdx;

    // Random entry spin — elegant: slight tilt, not full flip
    const rx = (Math.random()-0.5)*28; // ±14°
    const ry = (Math.random()>0.5?1:-1)*(40+Math.random()*50); // 40–90° left or right
    const rz = (Math.random()-0.5)*16; // ±8° tilt

    // Snap to start state (no transition)
    card.style.transition='none';
    card.style.opacity='0';
    card.style.transform=`translate(-50%,-50%) perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(0.18)`;
    bd.style.transition='none';
    bd.style.opacity='0';

    // Force reflow
    void card.getBoundingClientRect();

    // Animate to final state
    const ease='cubic-bezier(0.22,1,0.36,1)';
    card.style.transition=`opacity 0.25s ${ease}, transform 0.55s ${ease}`;
    card.style.opacity='1';
    card.style.transform='translate(-50%,-50%) perspective(1200px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)';
    bd.style.transition=`opacity 0.3s ease`;
    bd.style.opacity='1';
    bd.style.pointerEvents='auto';
  },[hoveredIdx]);

  // Expand/shrink on selection change
  useEffect(()=>{
    const card=cardRef.current;
    if(!card||hoveredIdx<0) return;
    const ease='cubic-bezier(0.22,1,0.36,1)';
    card.style.transition=`max-width 0.35s ${ease}, max-height 0.35s ${ease}, box-shadow 0.35s ease`;
  },[isSelected, hoveredIdx]);

  return(
    <>
      {/* Backdrop */}
      <div ref={backdropRef} onClick={onClose} style={{
        position:'fixed',inset:0,zIndex:90,
        background:'rgba(0,0,0,0.68)',
        backdropFilter:'blur(6px)',
        opacity:0,pointerEvents:'none',
      }}/>

      {/* Card */}
      <div ref={cardRef} style={{
        position:'fixed',top:'50%',left:'50%',
        zIndex:100,
        opacity:0,
        transform:'translate(-50%,-50%) scale(0.92)',
        display:hoveredIdx>=0?'flex':'none',
        flexDirection:'column',
        alignItems:'center',
        maxWidth: isSelected ? 'min(88vw,940px)' : 'min(52vw,640px)',
        transition:'max-width 0.35s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Image */}
        <div style={{
          border:`1px solid ${isSelected?'rgba(201,168,76,0.5)':'rgba(201,168,76,0.25)'}`,
          boxShadow: isSelected
            ? '0 0 60px rgba(201,168,76,0.18), 0 0 0 1px rgba(201,168,76,0.1)'
            : '0 0 30px rgba(0,180,255,0.12)',
          borderRadius:'3px',overflow:'hidden',background:'#000',
          maxHeight: isSelected ? '80vh' : '65vh',
          transition:'all 0.35s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.src} alt="" style={{
              display:'block',
              maxWidth:'100%',
              maxHeight: isSelected ? '80vh' : '65vh',
              objectFit:'contain',
              transition:'max-height 0.35s cubic-bezier(0.22,1,0.36,1)',
            }}/>
          )}
        </div>

        {/* Meta */}
        {photo && (
          <div style={{marginTop:'0.7rem',textAlign:'center',display:'flex',flexDirection:'column',gap:'0.25rem'}}>
            <p style={{fontFamily:'"Cormorant Garamond",serif',fontSize:'1.05rem',color:'rgba(255,255,255,0.88)',margin:0,letterSpacing:'0.05em'}}>
              {photo.label} · {photo.date.slice(0,12)}
            </p>
            {photo.people.length>0&&(
              <p style={{fontFamily:'Inter,sans-serif',fontSize:'0.6rem',letterSpacing:'0.15em',color:'rgba(201,168,76,0.72)',textTransform:'uppercase',margin:0}}>
                {photo.people.join(' · ')}
              </p>
            )}
            {isSelected&&conns.length>0&&(
              <p style={{fontFamily:'Inter,sans-serif',fontSize:'0.55rem',letterSpacing:'0.12em',color:'rgba(0,210,255,0.55)',textTransform:'uppercase',margin:'0.2rem 0 0'}}>
                {peopleCt>0&&`${peopleCt} shared people`}
                {timeCt>0&&` · ${timeCt} same timeframe`}
                {locCt>0&&` · ${locCt} same place`}
              </p>
            )}
            {!isSelected&&(
              <p style={{fontFamily:'Inter,sans-serif',fontSize:'0.53rem',letterSpacing:'0.18em',color:'rgba(255,255,255,0.22)',textTransform:'uppercase',margin:'0.15rem 0 0'}}>
                Click to reveal connections
              </p>
            )}
          </div>
        )}

        {/* Close */}
        <button onClick={onClose} style={{
          position:'absolute',top:'-10px',right:'-10px',
          background:'rgba(0,6,16,0.92)',border:'1px solid rgba(0,212,255,0.22)',
          color:'rgba(255,255,255,0.55)',borderRadius:'50%',
          width:'26px',height:'26px',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:'0.7rem',fontFamily:'Inter,sans-serif',
        }}>×</button>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WorldAtlasGlobe(){
  const [ready,setReady]=useState(false);
  const [hoveredIdx,setHoveredIdx]=useState(-1);
  const [selectedIdx,setSelectedIdx]=useState(-1);

  // Refs shared with Three.js (no re-render cost)
  const hoverRef   =useRef(-1);
  const selectedRef=useRef(-1);
  const pausedRef  =useRef(false);

  useEffect(()=>{selectedRef.current=selectedIdx;},[selectedIdx]);

  // Debounced hover — prevents flicker when moving between sprites
  const hoverTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const handleHoverChange=useCallback((idx:number)=>{
    hoverRef.current=idx;
    if(hoverTimer.current) clearTimeout(hoverTimer.current);
    if(idx>=0){
      pausedRef.current=true;
      setHoveredIdx(idx);
    } else {
      // Small grace period before hiding overlay
      hoverTimer.current=setTimeout(()=>{
        setHoveredIdx(-1);
        if(selectedIdx<0) pausedRef.current=false;
      },120);
    }
  },[selectedIdx]);

  const handleSelect=useCallback((idx:number)=>{
    const next=selectedIdx===idx?-1:idx;
    setSelectedIdx(next);
    selectedRef.current=next;
    pausedRef.current=next>=0||hoverRef.current>=0;
  },[selectedIdx]);

  const handleClose=useCallback(()=>{
    setHoveredIdx(-1);setSelectedIdx(-1);
    hoverRef.current=-1;selectedRef.current=-1;pausedRef.current=false;
    document.body.style.cursor='';
  },[]);

  useEffect(()=>{const t=setTimeout(()=>setReady(true),200);return()=>clearTimeout(t);},[]);
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')handleClose();};
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[handleClose]);

  return(
    <div style={{position:'fixed',inset:0,background:'radial-gradient(ellipse at 40% 45%,#00091a 0%,#000000 75%)',opacity:ready?1:0,transition:'opacity 1.2s ease'}}>
      <div className="grain-overlay" aria-hidden/>

      <Canvas camera={{position:[0,0,7],fov:48}} gl={{antialias:true,alpha:true}}
        style={{position:'absolute',inset:0,pointerEvents:'auto',cursor:'grab'}} dpr={[1,2]}>
        <ambientLight intensity={0.15}/>
        <pointLight position={[10,10,10]}   intensity={0.4} color="#4488ff"/>
        <pointLight position={[-10,-5,-10]} intensity={0.2} color="#002244"/>
        <Stars radius={50} depth={50} count={4000} factor={3.5} fade speed={0.6}/>
        <GlobeGroup
          pausedRef={pausedRef}
          hoverRef={hoverRef}
          selectedRef={selectedRef}
          onHoverChange={handleHoverChange}
          onSelect={handleSelect}
        />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.06}
          minDistance={3.5} maxDistance={12} rotateSpeed={0.55} zoomSpeed={0.7}/>
        <EffectComposer>
          <Bloom intensity={1.6} luminanceThreshold={0.15} luminanceSmoothing={0.9}/>
          <Vignette darkness={0.55} offset={0.3}/>
        </EffectComposer>
      </Canvas>

      <PhotoOverlay
        hoveredIdx={hoveredIdx}
        selectedIdx={selectedIdx}
        onClose={handleClose}
        onSelect={handleSelect}
      />

      {hoveredIdx<0&&(
        <div style={{position:'fixed',bottom:'2.2rem',left:'50%',transform:'translateX(-50%)',fontFamily:'Inter,sans-serif',fontSize:'0.58rem',letterSpacing:'0.22em',color:'rgba(255,255,255,0.15)',textTransform:'uppercase',textAlign:'center',pointerEvents:'none',opacity:ready?1:0,transition:'opacity 2s ease 1.5s'}}>
          Hover a memory · Click to reveal connections · ESC to close
        </div>
      )}
    </div>
  );
}
