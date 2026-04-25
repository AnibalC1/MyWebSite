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
const R            = 2.4;
const GOLDEN_ANGLE = Math.PI*(3-Math.sqrt(5));
const THIRTY_DAYS  = 30*24*3600;

// Reusable temporaries — never allocate in useFrame
const _gQ    = new THREE.Quaternion(); // globe world quat
const _cinQ  = new THREE.Quaternion(); // cinematic rotation quat
const _euler = new THREE.Euler();
const _wPos  = new THREE.Vector3();    // scratch world position
const _wSurf = new THREE.Vector3();    // scratch surface position
const _col   = new THREE.Color();
const _clusterTgt = new THREE.Vector3();  // scratch cluster target
const _screenCtr   = new THREE.Vector3();  // viewport center in world space
const _V6_LOCAL    = new THREE.Vector3(0, 0, -1.4); // 1.4 units in front of camera
const _tintCol  = new THREE.Color(0.55, 0.82, 1.0); // cyan holographic at rest
const _clearCol = new THREE.Color(1, 1, 1);          // full color on hover

// Shared PlaneGeometry — 4:3 ratio, created once
const SHARED_GEO = new THREE.PlaneGeometry(1.333, 1);
SHARED_GEO.computeBoundingSphere(); // ensure frustum culling works

// ─── Geo helpers ─────────────────────────────────────────────────────────────
function ll2v(lat:number,lon:number,r=R){
  const p=(90-lat)*Math.PI/180, t=(lon+180)*Math.PI/180;
  return new THREE.Vector3(-r*Math.sin(p)*Math.cos(t), r*Math.cos(p), r*Math.sin(p)*Math.sin(t));
}
function arcPts(a:[number,number],b:[number,number],elev=0.55,steps=72){
  const v0=ll2v(a[0],a[1]),v1=ll2v(b[0],b[1]);
  return new THREE.QuadraticBezierCurve3(v0,v0.clone().add(v1).normalize().multiplyScalar(R+elev),v1).getPoints(steps);
}
function tangentFrame(lat:number,lng:number):[THREE.Vector3,THREE.Vector3]{
  const n=ll2v(lat,lng,1),up=new THREE.Vector3(0,1,0);
  const t1=up.clone().sub(n.clone().multiplyScalar(up.dot(n))).normalize();
  return [t1, new THREE.Vector3().crossVectors(n,t1).normalize()];
}

// ─── Pre-compute positions ────────────────────────────────────────────────────
// ─── Fibonacci sphere distribution — evenly covers entire globe ───────────────
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

// ─── Connections ──────────────────────────────────────────────────────────────
interface Conn{toIdx:number;type:'ps'|'pw'|'ti'|'lo';}  // ps=people-strong, pw=people-weak, ti=time, lo=location
const LINE_COL  ={'ps':'#c9a84c','pw':'#c9a84c','ti':'#ff66cc','lo':'#00d2ff'} as const;
const LINE_OPA  ={'ps':0.80,'pw':0.45,'ti':0.32,'lo':0.24} as const;

const CONNS:Conn[][] = PHOTOS.map((p,i)=>{
  const res:Conn[]=[];
  for(let j=0;j<N&&res.length<12;j++){
    if(j===i)continue;const q=PHOTOS[j];
    const sh=p.people.filter(x=>q.people.includes(x)).length;
    if(sh>=2){res.push({toIdx:j,type:'ps'});continue;}
    if(sh===1){res.push({toIdx:j,type:'pw'});continue;}
    if(Math.abs(p.ts-q.ts)<=THIRTY_DAYS){res.push({toIdx:j,type:'ti'});continue;}
    if(p.cluster===q.cluster&&res.length<6)res.push({toIdx:j,type:'lo'});
  }
  return res.sort((a,b)=>({ps:0,pw:1,ti:2,lo:3}[a.type]-{ps:0,pw:1,ti:2,lo:3}[b.type])).slice(0,12);
});

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
  globalSelectRef:React.MutableRefObject<number>;
  onHoverChange:(i:number)=>void;
  onSelect:(i:number)=>void;
}

function FloatingHolograms({globeRef,globalHoverRef,globalSelectRef,onHoverChange,onSelect}:HoloProps){
  const meshRefs=useRef<(THREE.Mesh|null)[]>(PHOTOS.map(()=>null));
  const matRefs =useRef<(THREE.MeshBasicMaterial|null)[]>(PHOTOS.map(()=>null));

  // Per-photo animation state (all refs — no useState = no glitches)
  const scales  =useRef(new Float32Array(N).fill(0.12));
  const opacs   =useRef(new Float32Array(N).fill(0.48));
  const rotYs   =useRef(new Float32Array(N).fill(0));
  const rotZs   =useRef(new Float32Array(N).fill(0));
  const tintTs  =useRef(new Float32Array(N).fill(0));   // 0=tinted, 1=full color
  const bobs    =useRef(new Float32Array(N).map((_,i)=>Math.random()*Math.PI*2+i));
  // Cluster state — ring layout (no orbit drift, computed once per hover change)
  const ringAngles  =useRef(new Float32Array(N).fill(0));  // angle on ring per photo
  const ringRadii   =useRef(new Float32Array(N).fill(0));  // radius (0 = not in cluster)
  const prevHovRef  =useRef(-1);
  const prevSelRef  =useRef(-1);
  const tiIdxsRef   =useRef<number[]>([]);
  const tiSetRef    =useRef(new Set<number>());
  const connSetRef  =useRef(new Set<number>());

  // Texture loading
  useEffect(()=>{
    let idx=0,active=0;
    const next=()=>{ while(idx<N&&active<20){const i=idx++;active++;new THREE.TextureLoader().load(PHOTOS[i].src,t=>{t.colorSpace=THREE.SRGBColorSpace;active--;if(matRefs.current[i]){matRefs.current[i]!.map=t;matRefs.current[i]!.needsUpdate=true;}next();},undefined,()=>{active--;next();});} };
    next();
  },[]);

  // Connection lines pool (12 slots)
  const cMats=useMemo(()=>Array.from({length:12},()=>new THREE.LineBasicMaterial({color:'#c9a84c',transparent:true,opacity:0,depthTest:false})),[]);
  const cArrs=useMemo(()=>Array.from({length:12},()=>new Float32Array(6)),[]);
  const cGeos=useMemo(()=>cArrs.map(arr=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));return g;}),[cArrs]);
  const cLines=useMemo(()=>cGeos.map((g,i)=>new THREE.Line(g,cMats[i])),[cGeos,cMats]);

  // Pin line
  const pinMat=useMemo(()=>new THREE.LineBasicMaterial({color:'#c9a84c',transparent:true,opacity:0,depthTest:false}),[]);
  const pinArr=useMemo(()=>new Float32Array(6),[]);
  const pinGeo=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pinArr,3));return g;},[pinArr]);
  const pinLine=useMemo(()=>new THREE.Line(pinGeo,pinMat),[pinGeo,pinMat]);

  useFrame(({camera},delta) => {
    const h=globalHoverRef.current, s=globalSelectRef.current;
    const anyHov=h>=0, anySel=s>=0;

    // ── Recompute cluster targets when hover OR select changes — no allocations in hot path
    const effectivePivot=h>=0?h:s;
    if(h !== prevHovRef.current || s !== prevSelRef.current){
      prevHovRef.current=h;
      prevSelRef.current=s;
      tiIdxsRef.current=[];
      tiSetRef.current.clear();
      connSetRef.current.clear();
      if(s>=0) CONNS[s].forEach(c=>connSetRef.current.add(c.toIdx));
      if(effectivePivot>=0){
        const pivotTs=PHOTOS[effectivePivot].ts;
        const related:Array<{j:number;dt:number}>=[];
        for(let j=0;j<N;j++){
          if(j===effectivePivot)continue;
          const dt=Math.abs(PHOTOS[j].ts-pivotTs);
          if(dt<=THIRTY_DAYS)related.push({j,dt});
        }
        related.sort((a,b)=>a.dt-b.dt);
        const capped=related.slice(0,30);
        tiIdxsRef.current=capped.map(r=>r.j);
        capped.forEach(({j})=>tiSetRef.current.add(j));
        // Flat ring layout — inner ring (≤10), outer ring (overflow)
        const INNER_MAX=10;
        const inner=capped.slice(0,Math.min(capped.length,INNER_MAX));
        const outer=capped.slice(INNER_MAX,Math.min(capped.length,INNER_MAX+16));
        ringAngles.current.fill(0); ringRadii.current.fill(0);
        inner.forEach(({j},k)=>{
          ringAngles.current[j]=(k/inner.length)*Math.PI*2;
          ringRadii.current[j]=0.32;  // world units at ~1.4 from camera
        });
        const outerStep=outer.length>0?Math.PI/outer.length:0;
        outer.forEach(({j},k)=>{
          ringAngles.current[j]=(k/outer.length)*Math.PI*2+outerStep;
          ringRadii.current[j]=0.52;
        });
      }
    }

    const tiSet=tiSetRef.current;
    const anyActive=anyHov||anySel;
    const isClickedCluster=!anyHov&&anySel; // cluster persisting after click, mouse moved away
    const activeMesh=effectivePivot>=0?meshRefs.current[effectivePivot]:null;

    // Get globe world quaternion once
    if(globeRef.current) globeRef.current.getWorldQuaternion(_gQ);
    else _gQ.identity();

    const t=performance.now()/1000;

    // Screen-center world point — hovered photo flies here, cluster ring forms here
    _screenCtr.copy(_V6_LOCAL).applyMatrix4(camera.matrixWorld);

    for(let i=0;i<N;i++){
      const mesh=meshRefs.current[i];const mat=matRefs.current[i];
      if(!mesh||!mat)continue;

      const iAmHov=i===h, iAmSel=i===s, iAmConn=connSetRef.current.has(i);

      // ── Scale target
      const iAmTi=tiSet.has(i);
      let tSc:number;
      if(iAmHov||iAmSel) tSc=0.18;                           // 1.5× anchor
      else if(iAmConn) tSc=0.135;
      else if(iAmTi) tSc=isClickedCluster?0.156:0.096;       // click=1.3×, hover=0.8×
      else if(anyActive) tSc=0.12;                            // unrelated stay same size, just dim
      else tSc=0.12;
      scales.current[i]+=(tSc-scales.current[i])*Math.min(delta*9,1);

      // ── Opacity target
      const tOp=(iAmHov||iAmSel)?1.0:iAmConn?0.80:iAmTi?(isClickedCluster?1.0:0.88):anyActive?0.08:0.48;
      opacs.current[i]+=(tOp-opacs.current[i])*Math.min(delta*9,1);

      // ── Tint target (0=cyan holographic, 1=full color)
      const tTint=(iAmHov||iAmSel)?1:iAmConn?0.5:iAmTi?1:0;  // cluster always full color
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

      // ── Bob (only when nothing hovered/selected)
      if(!anyActive){
        bobs.current[i]+=delta*0.55;
        _wPos.y+=Math.sin(bobs.current[i])*0.009;
      }

      // ── Position: hovered → screen center; cluster → ring around screen center
      if(iAmHov||iAmSel){
        mesh.position.lerp(_screenCtr, Math.min(delta*6,1));
      } else if(anyActive && iAmTi && ringRadii.current[i]>0){
        const ang=ringAngles.current[i];
        const rad=ringRadii.current[i]*(isClickedCluster?0.60:1.0);
        _clusterTgt.set(
          _screenCtr.x+Math.cos(ang)*rad,
          _screenCtr.y+Math.sin(ang)*rad,
          _screenCtr.z
        );
        mesh.position.lerp(_clusterTgt, Math.min(delta*5,1));
      } else {
        mesh.position.lerp(_wPos, Math.min(delta*12,1));
      }
      mesh.scale.setScalar(scales.current[i]);

      // ── Billboard: face camera (world-space mesh, no parent transform)
      mesh.quaternion.copy(camera.quaternion);

      // ── Apply cinematic rotation on top of billboard
      if(rotYs.current[i]!==0||rotZs.current[i]!==0){
        _euler.set(rotZs.current[i],rotYs.current[i],0,'YXZ');
        _cinQ.setFromEuler(_euler);
        mesh.quaternion.multiply(_cinQ);
      }

      // ── Material opacity & color
      mat.opacity=opacs.current[i];
      _col.copy(_tintCol).lerp(_clearCol,tintTs.current[i]);
      mat.color.copy(_col);
    }

    // ── Connection lines
    const connData=anySel?CONNS[s]:[];
    connData.slice(0,12).forEach((c,li)=>{
      _wPos.copy(PPOS[s].base).applyQuaternion(_gQ);
      _wSurf.copy(PPOS[c.toIdx].base).applyQuaternion(_gQ);
      cArrs[li][0]=_wPos.x;cArrs[li][1]=_wPos.y;cArrs[li][2]=_wPos.z;
      cArrs[li][3]=_wSurf.x;cArrs[li][4]=_wSurf.y;cArrs[li][5]=_wSurf.z;
      cGeos[li].attributes.position.needsUpdate=true;
      cMats[li].color.set(LINE_COL[c.type]);
      cMats[li].opacity+=(LINE_OPA[c.type]-cMats[li].opacity)*0.12;
    });
    for(let li=connData.length;li<12;li++) cMats[li].opacity+=(0-cMats[li].opacity)*0.18;

    // ── Pin line (selected → earth surface)
    if(anySel){
      _wPos.copy(PPOS[s].base).applyQuaternion(_gQ);
      _wSurf.copy(PPOS[s].surf).applyQuaternion(_gQ);
      pinArr[0]=_wPos.x;pinArr[1]=_wPos.y;pinArr[2]=_wPos.z;
      pinArr[3]=_wSurf.x;pinArr[4]=_wSurf.y;pinArr[5]=_wSurf.z;
      pinGeo.attributes.position.needsUpdate=true;
      pinMat.opacity=0.28+0.28*Math.sin(t*3.5);
    } else { pinMat.opacity+=(0-pinMat.opacity)*0.18; }
  });

  // Debounce ref to prevent flicker on fast sweeps
  const debounceRef=useRef<ReturnType<typeof setTimeout>|null>(null);

  const handleOver=(i:number)=>(e:{stopPropagation:()=>void})=>{
    e.stopPropagation();
    if(debounceRef.current) clearTimeout(debounceRef.current);
    if(globalHoverRef.current===i) return;
    globalHoverRef.current=i;
    // Kick cinematic rotation — random direction and magnitude
    rotYs.current[i]=(Math.random()>0.5?1:-1)*(0.42+Math.random()*0.18);  // 24–34°
    rotZs.current[i]=(Math.random()>0.5?1:-1)*(0.08+Math.random()*0.11);  // 5–11°
    onHoverChange(i);
    document.body.style.cursor='pointer';
  };
  const handleOut=()=>{
    if(debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>{
      globalHoverRef.current=-1;
      onHoverChange(-1);
      document.body.style.cursor='';
    },100);
  };
  const handleClick=(i:number)=>(e:{stopPropagation:()=>void})=>{
    e.stopPropagation();
    onSelect(i);
  };

  return(
    <group>
      {PHOTOS.map((_,i)=>(
        <mesh key={i}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el:any)=>{meshRefs.current[i]=el;}}
          geometry={SHARED_GEO}
          position={PPOS[i].base}
          renderOrder={7}
          onPointerOver={handleOver(i)}
          onPointerOut={handleOut}
          onClick={handleClick(i)}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <meshBasicMaterial ref={(el:any)=>{matRefs.current[i]=el;}} color={_tintCol.clone()} transparent opacity={0.48} side={THREE.DoubleSide} depthTest={false}/>
        </mesh>
      ))}
      <primitive object={pinLine}/>
      {cLines.map((l,i)=><primitive key={i} object={l}/>)}
    </group>
  );
}

// ─── Hover overlay (centered, pointer-events:none, disappears on mouse-out) ───
function HoverOverlay({hoveredIdx,selectedIdx}:{hoveredIdx:number;selectedIdx:number}){
  const cardRef=useRef<HTMLDivElement>(null);
  const prevIdx=useRef(-1);
  // Show only when hovering and nothing is selected (selected overlay takes priority)
  const photo=hoveredIdx>=0&&selectedIdx<0?PHOTOS[hoveredIdx]:null;

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
    // Random cinematic spin entry — different direction each hover
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
          <p style={{fontFamily:'Inter,sans-serif',fontSize:'0.52rem',letterSpacing:'0.18em',color:'rgba(255,255,255,0.2)',textTransform:'uppercase',margin:'0.2rem 0 0'}}>{photo.date.slice(0,12)} · Click for connections</p>
        </div>
      )}
    </div>
  );
}

// ─── Photo overlay (click only) ───────────────────────────────────────────────
function PhotoOverlay({selectedIdx,onClose}:{selectedIdx:number;onClose:()=>void;}){
  const cardRef=useRef<HTMLDivElement>(null);
  const bdRef  =useRef<HTMLDivElement>(null);
  const prevSel=useRef(-1);

  const photo=selectedIdx>=0?PHOTOS[selectedIdx]:null;
  const conns=selectedIdx>=0?CONNS[selectedIdx]:[];
  const pCt=conns.filter(c=>c.type==='ps'||c.type==='pw').length;
  const tCt=conns.filter(c=>c.type==='ti').length;
  const lCt=conns.filter(c=>c.type==='lo').length;

  useEffect(()=>{
    const card=cardRef.current,bd=bdRef.current;
    if(!card||!bd)return;
    if(selectedIdx<0){
      card.style.transition='opacity 0.22s ease,transform 0.22s ease';
      card.style.opacity='0';card.style.transform='translate(-50%,-50%) scale(0.94)';
      bd.style.transition='opacity 0.22s ease';bd.style.opacity='0';bd.style.pointerEvents='none';
      prevSel.current=-1;return;
    }
    if(selectedIdx===prevSel.current)return;
    prevSel.current=selectedIdx;
    // Snap to hidden
    const ease='cubic-bezier(0.22,1,0.36,1)';
    card.style.transition='none';
    card.style.opacity='0';card.style.transform='translate(-50%,-50%) perspective(1000px) rotateY(12deg) scale(0.88)';
    bd.style.transition='none';bd.style.opacity='0';
    void card.getBoundingClientRect();
    // Animate to visible
    card.style.transition=`opacity 0.3s ease,transform 0.5s ${ease}`;
    card.style.opacity='1';card.style.transform='translate(-50%,-50%) perspective(1000px) rotateY(0deg) scale(1)';
    bd.style.transition='opacity 0.3s ease';bd.style.opacity='1';bd.style.pointerEvents='auto';
  },[selectedIdx]);

  return(
    <>
      <div ref={bdRef} onClick={onClose} style={{position:'fixed',inset:0,zIndex:90,background:'rgba(0,0,0,0.70)',backdropFilter:'blur(5px)',opacity:0,pointerEvents:'none'}}/>
      <div ref={cardRef} style={{position:'fixed',top:'50%',left:'50%',zIndex:100,opacity:0,transform:'translate(-50%,-50%) scale(0.94)',display:'flex',flexDirection:'column',alignItems:'center',maxWidth:'min(88vw,900px)',pointerEvents:'none'}}>
        <div style={{border:'1px solid rgba(201,168,76,0.45)',boxShadow:'0 0 60px rgba(201,168,76,0.14)',borderRadius:'4px',overflow:'hidden',background:'#000',maxHeight:'78vh',pointerEvents:'auto'}}>
          {photo&&<img src={photo.src} alt="" style={{display:'block',maxWidth:'100%',maxHeight:'78vh',objectFit:'contain'}}/>}
        </div>
        {photo&&(
          <div style={{marginTop:'0.75rem',textAlign:'center',display:'flex',flexDirection:'column',gap:'0.22rem',pointerEvents:'auto'}}>
            <p style={{fontFamily:'"Cormorant Garamond",serif',fontSize:'1.1rem',color:'rgba(255,255,255,0.88)',margin:0,letterSpacing:'0.05em'}}>{photo.label} · {photo.date.slice(0,12)}</p>
            {photo.people.length>0&&<p style={{fontFamily:'Inter,sans-serif',fontSize:'0.6rem',letterSpacing:'0.15em',color:'rgba(201,168,76,0.72)',textTransform:'uppercase',margin:0}}>{photo.people.join(' · ')}</p>}
            {conns.length>0&&<p style={{fontFamily:'Inter,sans-serif',fontSize:'0.55rem',letterSpacing:'0.12em',color:'rgba(0,210,255,0.55)',textTransform:'uppercase',margin:'0.15rem 0 0'}}>
              {pCt>0&&`${pCt} shared people`}{tCt>0&&` · ${tCt} same timeframe`}{lCt>0&&` · ${lCt} same place`}
            </p>}
          </div>
        )}
        <button onClick={onClose} style={{position:'absolute',top:'-10px',right:'-10px',background:'rgba(0,6,16,0.92)',border:'1px solid rgba(0,212,255,0.22)',color:'rgba(255,255,255,0.55)',borderRadius:'50%',width:'26px',height:'26px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',pointerEvents:'auto'}}>×</button>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WorldAtlasGlobe(){
  const[ready,setReady]=useState(false);
  const[hoveredIdx,setHoveredIdx]=useState(-1);
  const[selectedIdx,setSelectedIdx]=useState(-1);

  // Shared refs — written by Three.js, read by DOM
  const globeRef     =useRef<THREE.Group|null>(null);
  const pausedRef    =useRef(false);
  const globalHovRef =useRef(-1);
  const globalSelRef =useRef(-1);

  useEffect(()=>{globalSelRef.current=selectedIdx;},[selectedIdx]);

  const handleHoverChange=useCallback((i:number)=>{
    pausedRef.current=i>=0||globalSelRef.current>=0;
    setHoveredIdx(i);
  },[]);

  const handleSelect=useCallback((i:number)=>{
    const next=globalSelRef.current===i?-1:i;
    setSelectedIdx(next);
    globalSelRef.current=next;
    pausedRef.current=next>=0||globalHovRef.current>=0;
  },[]);

  const handleClose=useCallback(()=>{
    setHoveredIdx(-1);
    setSelectedIdx(-1);
    globalSelRef.current=-1;
    globalHovRef.current=-1;
    pausedRef.current=false;
    document.body.style.cursor='';
  },[]);

  useEffect(()=>{const t=setTimeout(()=>setReady(true),200);return()=>clearTimeout(t);},[]);
  useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Escape')handleClose();};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);},[handleClose]);

  return(
    <div style={{position:'fixed',inset:0,background:'radial-gradient(ellipse at 40% 45%,#00091a 0%,#000000 75%)',opacity:ready?1:0,transition:'opacity 1.2s ease'}}>
      <div className="grain-overlay" aria-hidden/>

      <Canvas camera={{position:[0,0,7],fov:48}} gl={{antialias:true,alpha:true}} style={{position:'absolute',inset:0,pointerEvents:'auto',cursor:'grab'}} dpr={[1,2]}>
        <ambientLight intensity={0.15}/>
        <pointLight position={[10,10,10]}   intensity={0.4} color="#4488ff"/>
        <pointLight position={[-10,-5,-10]} intensity={0.2} color="#002244"/>
        <Stars radius={50} depth={50} count={4000} factor={3.5} fade speed={0.6}/>

        {/* Globe (Earth + cage, rotates) */}
        <GlobeGroup globeRef={globeRef} pausedRef={pausedRef}/>

        {/* Photos — outside GlobeGroup, positions tracked via globeRef every frame */}
        <FloatingHolograms
          globeRef={globeRef}
          globalHoverRef={globalHovRef}
          globalSelectRef={globalSelRef}
          onHoverChange={handleHoverChange}
          onSelect={handleSelect}
        />

        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.06} minDistance={3.5} maxDistance={12} rotateSpeed={0.55} zoomSpeed={0.7}/>
        <EffectComposer>
          <Bloom intensity={1.6} luminanceThreshold={0.15} luminanceSmoothing={0.9}/>
          <Vignette darkness={0.55} offset={0.3}/>
        </EffectComposer>
      </Canvas>

      {/* Hover overlay — centered, pointer-events:none, spin-in animation */}
      <HoverOverlay hoveredIdx={hoveredIdx} selectedIdx={selectedIdx}/>

      {/* Click overlay — DOM */}
      <PhotoOverlay selectedIdx={selectedIdx} onClose={handleClose}/>

      {selectedIdx<0&&(
        <div style={{position:'fixed',bottom:'2.2rem',left:'50%',transform:'translateX(-50%)',fontFamily:'Inter,sans-serif',fontSize:'0.58rem',letterSpacing:'0.22em',color:'rgba(255,255,255,0.15)',textTransform:'uppercase',textAlign:'center',pointerEvents:'none',opacity:ready?1:0,transition:'opacity 2s ease 1.5s'}}>
          Hover a memory · Click to reveal connections · ESC to close
        </div>
      )}
    </div>
  );
}
