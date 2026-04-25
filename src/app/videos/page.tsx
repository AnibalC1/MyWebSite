'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import Link from 'next/link';
import LogoSpin from '@/components/LogoSpin';

const CLIPS = [
  { src: '/video/hero-1.mp4', title: 'The Discipline' },
  { src: '/video/hero-2.mp4', title: 'The Roll'       },
  { src: '/video/hero-3.mp4', title: 'The Ground'     },
  { src: '/video/hero-4.mp4', title: 'The Work'       },
  { src: '/video/hero-5.mp4', title: 'The Gym'        },
] as const;
const N = CLIPS.length;

// ─── Audio ───────────────────────────────────────────────────────────────────
function projectorClunk() {
  try {
    const ctx = new AudioContext();
    void ctx.resume();
    const t = ctx.currentTime;
    const s = ctx.createOscillator(); const sg = ctx.createGain();
    s.type = 'square'; s.frequency.value = 800;
    sg.gain.setValueAtTime(0.12, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    s.connect(sg); sg.connect(ctx.destination); s.start(t); s.stop(t + 0.025);
    const h = ctx.createOscillator(); const hg = ctx.createGain();
    h.type = 'sine'; h.frequency.value = 60;
    hg.gain.setValueAtTime(0.22, t + 0.015);
    hg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    h.connect(hg); hg.connect(ctx.destination); h.start(t + 0.015); h.stop(t + 0.1);
    setTimeout(() => void ctx.close(), 600);
  } catch { /**/ }
}

let _hum: AudioContext | null = null;
function startHum() {
  if (_hum) return;
  try {
    _hum = new AudioContext();
    void _hum.resume();
    const g = _hum.createGain(); g.gain.value = 0.012;
    [40, 80, 120].forEach(f => {
      const o = _hum!.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o.connect(g); o.start();
    });
    g.connect(_hum.destination);
  } catch { /**/ }
}

// ─── Canvas film grain ───────────────────────────────────────────────────────
function FilmGrain({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!visible) return;
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = 640, H = 360;
    canvas.width = W; canvas.height = H;
    const img = ctx.createImageData(W, H); const d = img.data;
    let raf = 0;
    const tick = () => {
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 88) | 0;
        d[i] = d[i+1] = d[i+2] = v;
        d[i+3] = (Math.random() * 36) | 0;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [visible]);
  return (
    <canvas ref={ref} style={{
      position: 'fixed', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 55,
      opacity: visible ? 0.8 : 0, transition: 'opacity 0.8s',
      mixBlendMode: 'overlay', imageRendering: 'pixelated',
    }} />
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function VideosPage() {
  const [idx,      setIdx]      = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [muted,    setMuted]    = useState(true);
  const [floorsIn, setFloorsIn] = useState(false);
  const [screenIn, setScreenIn] = useState(false);
  const [grainIn,  setGrainIn]  = useState(false);
  const [xOff,     setXOff]     = useState(580);

  const overlayCtrl = useAnimationControls();
  const videoRefs   = useRef<(HTMLVideoElement | null)[]>(Array(N).fill(null));
  const busy        = useRef(false);
  const touchX      = useRef<number | null>(null);

  // Responsive X offset
  useEffect(() => {
    const calc = () => setXOff(Math.min(window.innerWidth * 0.54, 860));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // Entrance
  useEffect(() => {
    const t1 = setTimeout(() => setFloorsIn(true),   500);
    const t2 = setTimeout(() => setScreenIn(true),  1000);
    const t3 = setTimeout(() => setGrainIn(true),   1500);
    const t4 = setTimeout(() => { videoRefs.current[0]?.play(); }, 2300);
    return () => [t1,t2,t3,t4].forEach(clearTimeout);
  }, []);

  // Play + reset active clip on change
  useEffect(() => {
    const v = videoRefs.current[idx];
    if (v) { v.currentTime = 0; void v.play(); }
  }, [idx]);

  // ── 3-part projector advance ──────────────────────────────────────────────
  const advance = useCallback(async (delta: 1 | -1) => {
    if (busy.current) return;
    busy.current = true;
    startHum();

    await overlayCtrl.start({
      opacity: [0, 0.72, 0.08, 0.72, 1],
      transition: { duration: 0.35, times: [0, 0.14, 0.30, 0.44, 1], ease: 'linear' },
    });

    projectorClunk();
    setFlipping(true);
    setIdx(i => (i + delta + N) % N);
    await new Promise<void>(r => setTimeout(r, 150));
    setFlipping(false);

    await overlayCtrl.start({
      opacity: [1, 0.06, 0],
      transition: { duration: 0.3, times: [0, 0.35, 1], ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
    });

    busy.current = false;
  }, [overlayCtrl]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  void advance(-1);
      if (e.key === 'ArrowRight') void advance(1);
      if (e.key === ' ')          { e.preventDefault(); setMuted(m => !m); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [advance]);

  const clip    = CLIPS[idx];
  const counter = String(idx + 1).padStart(2, '0');

  return (
    <div
      onClick={() => startHum()}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) >= 60) void advance(dx < 0 ? 1 : -1);
      }}
      style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* Room ambient bloom */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 55%, #0e0b07 0%, #000 100%)',
      }} />

      {/* Curtain edges */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 16, pointerEvents: 'none',
        background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.85) 100%)',
      }} />

      <FilmGrain visible={grainIn} />

      {/* Floor lights */}
      <div style={{
        position: 'absolute', bottom: '1.4rem', left: '12%', right: '12%',
        display: 'flex', justifyContent: 'space-evenly', zIndex: 20, pointerEvents: 'none',
      }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: floorsIn ? 0.2 : 0 }}
            transition={{ delay: 0.5 + i * 0.055, duration: 0.7 }}
            style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#c9a84c', boxShadow: '0 0 5px rgba(201,168,76,0.4)', flexShrink: 0 }}
          />
        ))}
      </div>

      {/* NAV */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: screenIn ? 1 : 0 }}
        transition={{ duration: 1 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 70,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.4rem 2.4rem',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
          pointerEvents: screenIn ? 'auto' : 'none',
        }}
      >
        <LogoSpin height={120} />
        <div style={{ display: 'flex', gap: '2.2rem' }}>
          {[['Gallery','/gallery'],['Videos','/videos'],['About','/about'],['Builds','/builds'],['Contact','/contact']].map(([label, href]) => (
            <Link key={href} href={href} style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', letterSpacing: '0.22em',
              color: href === '/videos' ? '#c9a84c' : 'rgba(255,255,255,0.35)',
              textDecoration: 'none', textTransform: 'uppercase',
            }}>{label}</Link>
          ))}
        </div>
      </motion.nav>

      {/* ── CAROUSEL ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: screenIn ? 1 : 0 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        style={{
          flex: 1, minHeight: 0,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingTop: '72px', paddingBottom: '20px',
          position: 'relative', overflow: 'hidden',
          zIndex: 10,
        }}
      >
        {/* Carousel container — same size as active video, perspective for 3D */}
        <div style={{
          position: 'relative',
          width: 'min(66vw, 950px)',
          aspectRatio: '16 / 9',
          overflow: 'visible',
          perspective: '1600px',
          perspectiveOrigin: '50% 50%',
          flexShrink: 0,
        }}>
          {CLIPS.map((c, i) => {
            const raw  = ((i - idx + N) % N);
            const norm = raw > N / 2 ? raw - N : raw;   // -2…+2
            const isActive = norm === 0;
            const isSide   = Math.abs(norm) === 1;
            if (Math.abs(norm) > 1) return null;

            return (
              <motion.div
                key={i}
                animate={{
                  x: norm * xOff,
                  rotateY: norm < 0 ? 22 : norm > 0 ? -22 : 0,
                  scale: isActive ? 1 : 0.68,
                  zIndex: isActive ? 10 : 2,
                }}
                transition={{ type: 'spring', stiffness: 270, damping: 28, mass: 0.7 }}
                onClick={() => { if (isSide) void advance(norm > 0 ? 1 : -1); }}
                style={{
                  position: 'absolute', inset: 0,
                  cursor: isSide ? 'pointer' : 'default',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  // Active: gold hairline + deep shadow
                  // Hologram: cyan hairline
                  border: isActive
                    ? '1px solid rgba(201,168,76,0.1)'
                    : '1px solid rgba(80,200,255,0.18)',
                  boxShadow: isActive
                    ? '0 0 130px 50px rgba(0,0,0,0.94)'
                    : '0 0 40px rgba(80,200,255,0.06)',
                }}
              >
                {/* Video */}
                <video
                  ref={el => { videoRefs.current[i] = el; }}
                  loop playsInline autoPlay
                  muted={i !== idx ? true : muted}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    filter: isActive
                      ? 'none'
                      : 'saturate(0.04) brightness(1.6) hue-rotate(188deg)',
                    transition: 'filter 0.5s ease',
                  }}
                >
                  <source src={c.src} type="video/mp4" />
                </video>

                {/* ── HOLOGRAM overlays (side only) ── */}
                {isSide && (
                  <>
                    {/* Cyan scanlines */}
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                      background: 'repeating-linear-gradient(0deg, rgba(80,210,255,0.07) 0px, rgba(80,210,255,0.07) 1px, transparent 1px, transparent 3px)',
                    }} />
                    {/* Inner edge glow */}
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
                      boxShadow: 'inset 0 0 50px rgba(80,200,255,0.1), inset 0 0 20px rgba(80,200,255,0.08)',
                    }} />
                    {/* Opacity + slow flicker */}
                    <motion.div
                      aria-hidden
                      animate={{ opacity: [0.45, 0.35, 0.42, 0.38, 0.45] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
                      style={{
                        position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
                        background: 'rgba(0,0,0,0.55)',
                      }}
                    />
                    {/* Hologram horizontal sweep line */}
                    <motion.div
                      aria-hidden
                      animate={{ top: ['-5%', '105%'] }}
                      transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: 'linear', delay: i * 1.1 }}
                      style={{
                        position: 'absolute', left: 0, right: 0, height: '2px',
                        background: 'linear-gradient(to right, transparent, rgba(80,210,255,0.35), transparent)',
                        zIndex: 5, pointerEvents: 'none',
                      }}
                    />
                  </>
                )}

                {/* ── ACTIVE overlays ── */}
                {isActive && (
                  <>
                    {/* Scan lines */}
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                      background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
                    }} />
                    {/* Vignette */}
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
                      background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 52%, rgba(0,0,0,0.6) 100%)',
                    }} />
                    {/* Transition overlay */}
                    <motion.div animate={overlayCtrl} initial={{ opacity: 0 }}
                      style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 8, pointerEvents: 'none' }} />
                    {/* Sound toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
                      style={{
                        position: 'absolute', bottom: '10px', right: '10px', zIndex: 10,
                        background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(201,168,76,0.18)',
                        borderRadius: '50%', width: '26px', height: '26px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: '0.65rem',
                        color: muted ? 'rgba(255,255,255,0.5)' : '#c9a84c',
                        opacity: 0.35, transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.35'; }}
                    >{muted ? '🔇' : '🔊'}</button>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Controls ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: screenIn ? 1 : 0 }}
        transition={{ duration: 0.9, delay: 0.5 }}
        style={{
          flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem',
          paddingBottom: '2.2rem', paddingTop: '0.4rem', zIndex: 30,
        }}
      >
        {/* Clip title */}
        <motion.p key={idx + '-t'} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 0.55, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
            fontSize: '0.8rem', color: '#c9a84c', letterSpacing: '0.08em', margin: 0 }}
        >{clip.title}</motion.p>

        {/* Counter + arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <button onClick={() => void advance(-1)}
            style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,0.22)',
              cursor: 'pointer', fontSize: '1.1rem', opacity: 0.22, padding: '0 0.4rem',
              transition: 'opacity 0.18s, color 0.18s', lineHeight: 1 }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.opacity='0.9'; el.style.color='#c9a84c'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.opacity='0.22'; el.style.color='rgba(201,168,76,0.22)'; }}
          >‹</button>

          <div style={{
            background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(201,168,76,0.2)',
            padding: '5px 18px', display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontFamily: '"Courier New", Courier, monospace', fontSize: '0.64rem', letterSpacing: '0.32em',
            color: '#c9a84c', minWidth: '130px', justifyContent: 'center', userSelect: 'none',
          }}>
            <span style={{ opacity: 0.5 }}>CLIP</span>
            <span style={{ display: 'inline-block', overflow: 'hidden', height: '1em', perspective: '200px' }}>
              <motion.span key={counter}
                initial={{ rotateX: flipping ? -90 : 0, opacity: flipping ? 0 : 1 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ display: 'block', transformOrigin: 'center bottom' }}
              >{counter}</motion.span>
            </span>
            <span style={{ opacity: 0.28, fontSize: '0.55rem' }}>/</span>
            <span style={{ opacity: 0.42 }}>0{N}</span>
          </div>

          <button onClick={() => void advance(1)}
            style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,0.22)',
              cursor: 'pointer', fontSize: '1.1rem', opacity: 0.22, padding: '0 0.4rem',
              transition: 'opacity 0.18s, color 0.18s', lineHeight: 1 }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.opacity='0.9'; el.style.color='#c9a84c'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.opacity='0.22'; el.style.color='rgba(201,168,76,0.22)'; }}
          >›</button>
        </div>
      </motion.div>
    </div>
  );
}
