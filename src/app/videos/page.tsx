'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import Link from 'next/link';

// ─── Clip data ───────────────────────────────────────────────────────────────
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
    // 800 Hz gate slam — sharp square
    const s = ctx.createOscillator(); const sg = ctx.createGain();
    s.type = 'square'; s.frequency.value = 800;
    sg.gain.setValueAtTime(0.12, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    s.connect(sg); sg.connect(ctx.destination); s.start(t); s.stop(t + 0.025);
    // 60 Hz thud — sine weight
    const h = ctx.createOscillator(); const hg = ctx.createGain();
    h.type = 'sine'; h.frequency.value = 60;
    hg.gain.setValueAtTime(0.22, t + 0.015);
    hg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    h.connect(hg); hg.connect(ctx.destination); h.start(t + 0.015); h.stop(t + 0.1);
    setTimeout(() => void ctx.close(), 600);
  } catch { /* silent */ }
}

let _humCtx: AudioContext | null = null;
function startHum() {
  if (_humCtx) return;
  try {
    _humCtx = new AudioContext();
    void _humCtx.resume();
    const ctx = _humCtx;
    const g = ctx.createGain(); g.gain.value = 0.012;
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 40;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 80;
    const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = 120;
    [o1, o2, o3].forEach(o => { o.connect(g); o.start(); });
    g.connect(ctx.destination);
  } catch { /* silent */ }
}

// ─── Canvas film grain ───────────────────────────────────────────────────────
function FilmGrain({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 640; const H = 360;
    canvas.width = W; canvas.height = H;
    const img = ctx.createImageData(W, H);
    const d = img.data;
    let raf = 0;

    const tick = () => {
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 88) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = (Math.random() * 36) | 0;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 55,
        opacity: visible ? 0.85 : 0,
        transition: 'opacity 0.8s',
        mixBlendMode: 'overlay',
        imageRendering: 'pixelated',
      }}
    />
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function VideosPage() {
  const [idx,          setIdx]          = useState(0);
  const [flipping,     setFlipping]     = useState(false);
  const [muted,        setMuted]        = useState(true);
  const [floorsIn,     setFloorsIn]     = useState(false);
  const [screenIn,     setScreenIn]     = useState(false);
  const [grainIn,      setGrainIn]      = useState(false);

  const overlayCtrl = useAnimationControls();
  const videoRef    = useRef<HTMLVideoElement>(null);
  const busy        = useRef(false);
  const touchX      = useRef<number | null>(null);

  // ── Entrance sequence ─────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setFloorsIn(true),   500);
    const t2 = setTimeout(() => setScreenIn(true),  1000);
    const t3 = setTimeout(() => setGrainIn(true),   1500);
    const t4 = setTimeout(() => {
      const v = videoRef.current;
      if (v) { v.load(); void v.play(); }
    }, 2300);
    return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
  }, []);

  // Reload on clip change
  useEffect(() => {
    const v = videoRef.current;
    if (v) { v.load(); void v.play(); }
  }, [idx]);

  // ── 3-part projector advance ──────────────────────────────────────────────
  const advance = useCallback(async (delta: 1 | -1) => {
    if (busy.current) return;
    busy.current = true;
    startHum();

    // Phase 1 — flicker (350 ms)
    await overlayCtrl.start({
      opacity: [0, 0.72, 0.08, 0.72, 1],
      transition: { duration: 0.35, times: [0, 0.14, 0.30, 0.44, 1], ease: 'linear' },
    });

    // Phase 2 — slam + advance (150 ms)
    projectorClunk();
    setFlipping(true);
    setIdx(i => (i + delta + N) % N);
    await new Promise<void>(r => setTimeout(r, 150));
    setFlipping(false);

    // Phase 3 — new frame opens, slight overexposure then settle
    await overlayCtrl.start({
      opacity: [1, 0.08, 0],
      transition: { duration: 0.3, times: [0, 0.35, 1], ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
    });

    busy.current = false;
  }, [overlayCtrl]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  void advance(-1);
      if (e.key === 'ArrowRight') void advance(1);
      if (e.key === ' ')          { e.preventDefault(); setMuted(m => !m); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [advance]);

  const clip = CLIPS[idx];
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
      {/* ── Room ambient bloom ── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 55%, #0e0b07 0%, #000 100%)',
      }} />

      {/* ── Curtain edges ── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 16, pointerEvents: 'none',
        background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 9%, transparent 91%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* ── Film grain ── */}
      <FilmGrain visible={grainIn} />

      {/* ── Floor guide lights ── */}
      <div style={{
        position: 'absolute', bottom: '1.6rem', left: '12%', right: '12%',
        display: 'flex', justifyContent: 'space-evenly', alignItems: 'center',
        zIndex: 20, pointerEvents: 'none',
      }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: floorsIn ? 0.2 : 0 }}
            transition={{ delay: 0.5 + i * 0.055, duration: 0.7 }}
            style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#c9a84c', boxShadow: '0 0 5px rgba(201,168,76,0.4)', flexShrink: 0 }}
          />
        ))}
      </div>

      {/* ── NAV ── */}
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
        <Link href="/">
          <img src="/logo.png" alt="Anibal Cabral" style={{ height: '68px', width: 'auto', filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.4))' }} />
        </Link>
        <div style={{ display: 'flex', gap: '2.2rem' }}>
          {[['Gallery','/gallery'],['Videos','/videos'],['About','/about'],['Builds','/builds']].map(([label, href]) => (
            <Link key={href} href={href} style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', letterSpacing: '0.22em',
              color: href === '/videos' ? '#c9a84c' : 'rgba(255,255,255,0.35)',
              textDecoration: 'none', textTransform: 'uppercase',
            }}>{label}</Link>
          ))}
        </div>
      </motion.nav>

      {/* ── Screen area (flex-1, screen sits at bottom of this region → you look up) ── */}
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingTop: '72px', paddingBottom: '24px',
        paddingLeft: '4vw', paddingRight: '4vw',
        position: 'relative', zIndex: 10,
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: screenIn ? 1 : 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{
            // Width capped so height never exceeds ~70vh
            width: 'min(88vw, calc(70vh * 1.7778), 1380px)',
            aspectRatio: '16 / 9',
            position: 'relative',
            border: '1px solid rgba(201,168,76,0.08)',
            borderRadius: '2px',
            boxShadow: '0 0 120px 40px rgba(0,0,0,0.92)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Video */}
          <video
            ref={videoRef}
            loop muted={muted} playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          >
            <source src={clip.src} type="video/mp4" />
          </video>

          {/* Scan lines */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
          }} />

          {/* Corner vignette */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 52%, rgba(0,0,0,0.6) 100%)',
          }} />

          {/* Transition overlay */}
          <motion.div
            animate={overlayCtrl}
            initial={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 8, pointerEvents: 'none' }}
          />

          {/* Sound toggle */}
          <button
            onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
            style={{
              position: 'absolute', bottom: '10px', right: '10px', zIndex: 10,
              background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(201,168,76,0.18)',
              borderRadius: '50%', width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '0.65rem', opacity: 0.35, transition: 'opacity 0.2s',
              color: muted ? 'rgba(255,255,255,0.5)' : '#c9a84c',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.35'; }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </motion.div>
      </div>

      {/* ── Controls ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: screenIn ? 1 : 0 }}
        transition={{ duration: 0.9, delay: 0.5 }}
        style={{
          flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem',
          paddingBottom: '2.2rem', paddingTop: '0.4rem',
          zIndex: 30,
        }}
      >
        {/* Clip title */}
        <motion.p
          key={idx + '-title'}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 0.55, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          style={{
            fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
            fontSize: '0.8rem', color: '#c9a84c', letterSpacing: '0.08em', margin: 0,
          }}
        >
          {clip.title}
        </motion.p>

        {/* Counter + arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <button
            onClick={() => void advance(-1)}
            style={{
              background: 'none', border: 'none', color: 'rgba(201,168,76,0.22)',
              cursor: 'pointer', fontSize: '1.1rem', opacity: 0.22, padding: '0 0.4rem',
              transition: 'opacity 0.18s, color 0.18s', lineHeight: 1,
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.opacity = '0.9'; el.style.color = '#c9a84c'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.opacity = '0.22'; el.style.color = 'rgba(201,168,76,0.22)'; }}
          >‹</button>

          {/* Mechanical flipboard counter */}
          <div style={{
            background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(201,168,76,0.2)',
            padding: '5px 18px', display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontFamily: '"Courier New", Courier, monospace', fontSize: '0.64rem', letterSpacing: '0.32em',
            color: '#c9a84c', minWidth: '130px', justifyContent: 'center', userSelect: 'none',
          }}>
            <span style={{ opacity: 0.5 }}>CLIP</span>
            <span style={{ display: 'inline-block', overflow: 'hidden', height: '1em', perspective: '200px' }}>
              <motion.span
                key={counter}
                initial={{ rotateX: flipping ? -90 : 0, opacity: flipping ? 0 : 1 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ display: 'block', transformOrigin: 'center bottom' }}
              >
                {counter}
              </motion.span>
            </span>
            <span style={{ opacity: 0.28, fontSize: '0.55rem' }}>/</span>
            <span style={{ opacity: 0.42 }}>0{N}</span>
          </div>

          <button
            onClick={() => void advance(1)}
            style={{
              background: 'none', border: 'none', color: 'rgba(201,168,76,0.22)',
              cursor: 'pointer', fontSize: '1.1rem', opacity: 0.22, padding: '0 0.4rem',
              transition: 'opacity 0.18s, color 0.18s', lineHeight: 1,
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.opacity = '0.9'; el.style.color = '#c9a84c'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.opacity = '0.22'; el.style.color = 'rgba(201,168,76,0.22)'; }}
          >›</button>
        </div>
      </motion.div>
    </div>
  );
}
