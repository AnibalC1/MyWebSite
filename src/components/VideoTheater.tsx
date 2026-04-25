'use client';

/**
 * VideoTheater v4 — Hologram Carousel
 *
 * You are seated. The room is dark. The screen is waiting.
 * Side panels glow as holograms — cyan-tinted, scan-lined, ghostly.
 * All 3 video elements live in the DOM simultaneously.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Clip data ────────────────────────────────────────────────────────────────
export interface VideoClip {
  src: string;
  title: string;
}

interface Props { clips: VideoClip[] }

// ─── Audio engine ─────────────────────────────────────────────────────────────
function createAudioCtx(): AudioContext | null {
  try { return new AudioContext(); } catch { return null; }
}

/** Start persistent 40Hz projector hum. Returns stop fn. */
function startHum(ctx: AudioContext): () => void {
  try {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine'; osc1.frequency.value = 40;
    osc2.type = 'sine'; osc2.frequency.value = 80;
    gain.gain.value = 0.015;
    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc1.start(); osc2.start();
    return () => { try { osc1.stop(); osc2.stop(); } catch {} };
  } catch { return () => {}; }
}

/** Mechanical projector clunk: 800Hz snap + 60Hz thud */
function playClunk(ctx: AudioContext) {
  const now = ctx.currentTime;

  const snap = ctx.createOscillator();
  const snapGain = ctx.createGain();
  snap.type = 'square'; snap.frequency.value = 800;
  snapGain.gain.setValueAtTime(0.08, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
  snap.connect(snapGain); snapGain.connect(ctx.destination);
  snap.start(now); snap.stop(now + 0.025);

  const thud = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thud.type = 'sine'; thud.frequency.value = 60;
  thudGain.gain.setValueAtTime(0.0, now + 0.02);
  thudGain.gain.linearRampToValueAtTime(0.1, now + 0.03);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  thud.connect(thudGain); thudGain.connect(ctx.destination);
  thud.start(now + 0.02); thud.stop(now + 0.13);
}

// ─── Film grain canvas ────────────────────────────────────────────────────────
function FilmGrain({ phase }: { phase: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (phase < 3) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d')!;

    const tick = () => {
      const { width: W, height: H } = canvas;
      const imageData = ctx.createImageData(W, H);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = Math.random() * 46;
      }
      ctx.putImageData(imageData, 0, 0);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        pointerEvents: 'none',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 0.6s ease',
        mixBlendMode: 'screen',
      }}
    />
  );
}

// ─── Floor guide lights ───────────────────────────────────────────────────────
function FloorLights({ phase }: { phase: number }) {
  const N = 14;
  return (
    <div style={{
      position: 'absolute', bottom: '20px', left: '10%', right: '10%',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      zIndex: 6, pointerEvents: 'none',
    }}>
      {Array.from({ length: N }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 0.18 : 0 }}
          transition={{ duration: 0.4, delay: phase >= 1 ? i * 0.06 : 0 }}
          style={{
            width: '3px', height: '3px', borderRadius: '50%',
            background: '#c9a84c',
            boxShadow: '0 0 4px 1px rgba(201,168,76,0.4)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Flipboard number ─────────────────────────────────────────────────────────
function FlipNumber({ value, pad = 2 }: { value: number; pad?: number }) {
  const [displayed, setDisplayed] = useState(value);
  const [flipping, setFlipping]   = useState(false);

  useEffect(() => {
    if (value === displayed) return;
    setFlipping(true);
    setTimeout(() => { setDisplayed(value); setFlipping(false); }, 180);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span style={{
      display: 'inline-block',
      transform: flipping ? 'rotateX(90deg)' : 'rotateX(0deg)',
      transition: 'transform 0.18s ease-in',
      transformStyle: 'preserve-3d',
    }}>
      {String(displayed).padStart(pad, '0')}
    </span>
  );
}

// ─── Hologram side clip ────────────────────────────────────────────────────────
/**
 * Positioned relative to the center screen container which sits at
 * left: 50%, transform: translateX(-50%). This component lives inside
 * that container (which has overflow:visible) so it escapes to the side.
 *
 * side='left'  → appears to the LEFT of the center screen
 * side='right' → appears to the RIGHT of the center screen
 */
function HologramClip({
  src,
  side,
  phase,
  onClick,
}: {
  src: string;
  side: 'left' | 'right';
  phase: number;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [src]);

  const isLeft = side === 'left';

  return (
    <div
      onClick={onClick}
      style={{
        // Anchored to the left or right edge of the center-screen container,
        // then pushed outward so the hologram appears beside the center screen.
        position: 'absolute',
        top: '50%',
        // left: 0% = left edge of center screen; left: 100% = right edge
        ...(isLeft ? { left: '0%' } : { left: '100%' }),
        // translateX(-85%) pushes the left hologram leftward (85% of its width)
        // translateX(-15%) pushes the right hologram rightward
        // scale(0.62) shrinks it to 62% of the center screen's size
        transform: isLeft
          ? 'translateY(-50%) translateX(-85%) scale(0.62) rotateY(8deg)'
          : 'translateY(-50%) translateX(-15%) scale(0.62) rotateY(-8deg)',
        transformOrigin: isLeft ? '85% 50%' : '15% 50%',
        width: 'min(88vw, 1400px)',
        aspectRatio: '16 / 9',
        zIndex: 5,
        cursor: 'pointer',
        opacity: phase >= 4 ? 0.72 : 0,
        transition: 'opacity 0.6s ease',
        pointerEvents: phase >= 4 ? 'auto' : 'none',
      }}
    >
      {/* Hologram glow border */}
      <div style={{
        position: 'absolute', inset: '-2px',
        borderRadius: '3px',
        boxShadow: '0 0 32px 8px rgba(0,210,255,0.4), 0 0 80px 16px rgba(0,180,255,0.15)',
        border: '1px solid rgba(0,210,255,0.3)',
        zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Video — hologram-filtered */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        autoPlay
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: 'block',
          borderRadius: '2px',
          filter: 'hue-rotate(185deg) saturate(1.5) brightness(0.6) contrast(1.1)',
        }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Cyan scan lines */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        borderRadius: '2px',
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,220,255,0.07) 2px, rgba(0,220,255,0.07) 3px)',
      }} />

      {/* Side vignette — fades toward center screen edge */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
        borderRadius: '2px',
        background: isLeft
          ? 'radial-gradient(ellipse 110% 100% at 20% 50%, transparent 25%, rgba(0,15,30,0.75) 100%)'
          : 'radial-gradient(ellipse 110% 100% at 80% 50%, transparent 25%, rgba(0,15,30,0.75) 100%)',
      }} />

      {/* Subtle animated cyan overlay */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        borderRadius: '2px',
        background: 'rgba(0,210,255,0.04)',
        animation: 'holoFlicker 5s infinite',
      }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VideoTheater({ clips }: Props) {
  const [current, setCurrent]   = useState(0);
  const [muted, setMuted]       = useState(true);
  const [phase, setPhase]       = useState(0);
  const [transition, setTransition] = useState<'idle' | 'flicker' | 'black' | 'open'>('idle');

  const videoRef    = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopHumRef  = useRef<() => void>(() => {});
  const touchStartX = useRef<number | null>(null);
  const total       = clips.length;

  const prevIdx = (current - 1 + total) % total;
  const nextIdx = (current + 1) % total;

  // ── Entrance sequence ──────────────────────────────────────────────────────
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Load center video when phase ready or clip changes
  useEffect(() => {
    if (phase < 4) return;
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [phase, current]);

  // ── Audio ─────────────────────────────────────────────────────────────────
  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx();
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }, []);

  const bootHum = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    if (stopHumRef.current.toString() !== '() => {}') return;
    stopHumRef.current = startHum(ctx);
  }, [ensureAudio]);

  useEffect(() => {
    const handler = () => { bootHum(); document.removeEventListener('click', handler); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [bootHum]);

  // ── Projector advance (650ms) ─────────────────────────────────────────────
  const go = useCallback((delta: 1 | -1) => {
    if (transition !== 'idle') return;
    bootHum();
    const ctx = ensureAudio();

    setTransition('flicker');
    setTimeout(() => { setTransition('black'); if (ctx) playClunk(ctx); }, 150);
    setTimeout(() => { setCurrent(c => (c + delta + total) % total); }, 200);
    setTimeout(() => { setTransition('open'); }, 350);
    setTimeout(() => { setTransition('idle'); }, 650);
  }, [transition, total, ensureAudio, bootHum]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === ' ') { e.preventDefault(); setMuted(m => !m); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  // ── Swipe ─────────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) >= 60) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const clip = clips[current];

  const screenOpacity = (() => {
    if (phase < 4)                    return 0;
    if (transition === 'flicker')     return 0.4;
    if (transition === 'black')       return 0;
    if (transition === 'open')        return 1.05;
    return 1;
  })();

  return (
    <main
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed', inset: 0,
        background: '#000',
        // overflow:visible so side holograms are not clipped
        overflow: 'visible',
        fontFamily: "'Courier New', monospace",
        cursor: 'default',
      }}
    >
      {/* Hologram flicker keyframes */}
      <style>{`
        @keyframes holoFlicker {
          0%,100% { opacity: 1; }
          91%      { opacity: 1; }
          92%      { opacity: 0.55; }
          93%      { opacity: 1; }
          96%      { opacity: 0.8; }
          97%      { opacity: 1; }
        }
      `}</style>

      {/* ── Room ambient warm bloom ──────────────────────── */}
      <motion.div
        aria-hidden
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 1.2 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse 70% 50% at 50% 55%, #0e0b07 0%, #000 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Side curtain shadows ─────────────────────────── */}
      {(['left', 'right'] as const).map(side => (
        <div key={side} aria-hidden style={{
          position: 'absolute', [side]: 0, top: 0, width: '6%', height: '100%',
          background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, rgba(0,0,0,0.75) 0%, transparent 100%)`,
          zIndex: 25, pointerEvents: 'none',
        }} />
      ))}

      {/* ── Floor guide lights ───────────────────────────── */}
      <FloorLights phase={phase} />

      {/* ── Film grain canvas ────────────────────────────── */}
      <FilmGrain phase={phase} />

      {/* ── Nav (minimal, top) ───────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 4 ? 0.6 : 0 }}
        transition={{ duration: 1 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.2rem 2rem', zIndex: 30,
        }}
      >
        <a href="/" style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '0.95rem', letterSpacing: '0.22em',
          color: 'rgba(201,168,76,0.7)', textDecoration: 'none',
          textTransform: 'uppercase',
        }}>AC</a>
        <div style={{ display: 'flex', gap: '1.8rem' }}>
          {[
            { href: '/',        label: 'Home'    },
            { href: '/gallery', label: 'Gallery' },
            { href: '/about',   label: 'About'   },
            { href: '/builds',  label: 'Builds'  },
          ].map(n => (
            <a key={n.href} href={n.href} style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '0.62rem', letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.28)', textDecoration: 'none', textTransform: 'uppercase',
              transition: 'color 0.3s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.75)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
            >{n.label}</a>
          ))}
        </div>
      </motion.nav>

      {/* ══════════════════════════════════════════════════════
          THE CAROUSEL STAGE
          Center screen is the anchor. Side holograms are
          children of the center container with overflow:visible
          so they escape to the left/right edges of the screen.
         ══════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        top: '48%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(88vw, 1400px)',
        aspectRatio: '16 / 9',
        zIndex: 10,
        // CRITICAL: overflow:visible so holograms render outside this box
        overflow: 'visible',
      }}>

        {/* ── PREV hologram — appears left of center screen ── */}
        <HologramClip
          src={clips[prevIdx].src}
          side="left"
          phase={phase}
          onClick={() => go(-1)}
        />

        {/* ── NEXT hologram — appears right of center screen ── */}
        <HologramClip
          src={clips[nextIdx].src}
          side="right"
          phase={phase}
          onClick={() => go(1)}
        />

        {/* ── Outer glow — darkness pressing in ─────────── */}
        <motion.div
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            boxShadow: phase >= 2
              ? '0 0 160px 60px rgba(0,0,0,0.95), 0 0 300px 120px rgba(0,0,0,0.8)'
              : '0 0 0 0 transparent',
          }}
          transition={{ duration: 1.5 }}
          style={{
            position: 'absolute', inset: '-40px',
            zIndex: 0, pointerEvents: 'none', borderRadius: '4px',
          }}
        />

        {/* ── Projector gate border ─────────────────────── */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '1px solid rgba(201,168,76,0.08)',
          borderRadius: '2px', zIndex: 15, pointerEvents: 'none',
        }} />

        {/* ── Screen surface ────────────────────────────── */}
        <div style={{
          position: 'absolute', inset: 0,
          overflow: 'hidden', borderRadius: '1px',
          zIndex: 10,
        }}>
          {/* Pre-video screen glow */}
          {phase < 4 && (
            <motion.div
              animate={{ opacity: phase >= 2 ? 1 : 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse 60% 60% at 50% 50%, #0d0d0d, #000)',
                zIndex: 1,
              }}
            />
          )}

          {/* CENTER VIDEO — full color, main screen */}
          <motion.div
            animate={{
              opacity: screenOpacity,
              filter: transition === 'open'
                ? 'brightness(1.35) contrast(0.9)'
                : 'brightness(1) contrast(1)',
            }}
            transition={{
              opacity: transition === 'flicker'
                ? { duration: 0.05, repeat: 3, repeatType: 'mirror' }
                : { duration: transition === 'open' ? 0.3 : 0.12 },
              filter: { duration: 0.3 },
            }}
            style={{ position: 'absolute', inset: 0, zIndex: 2 }}
          >
            <video
              ref={videoRef}
              autoPlay={phase >= 4}
              muted={muted}
              loop
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            >
              <source src={clip.src} type="video/mp4" />
            </video>
          </motion.div>

          {/* Scan lines */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
          }} />

          {/* Vignette */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, rgba(0,0,0,0.5) 100%)',
          }} />

          {/* Sound toggle */}
          <button
            onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
            style={{
              position: 'absolute', bottom: '10px', right: '10px', zIndex: 10,
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.12)',
              borderRadius: '50%', width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '0.65rem',
              color: muted ? 'rgba(255,255,255,0.25)' : 'rgba(201,168,76,0.7)',
              opacity: 0.4, transition: 'opacity 0.3s, color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
            title="Toggle sound (Space)"
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* ── Controls: counter + arrows ─────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 4 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            position: 'absolute',
            top: 'calc(100% + 22px)',
            left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '16px',
            zIndex: 20,
          }}
        >
          <button
            onClick={() => go(-1)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(201,168,76,0.25)', fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: "'Courier New', monospace",
              letterSpacing: '0.1em', padding: '4px 8px',
              transition: 'color 0.2s, opacity 0.2s', opacity: 0.25,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c'; e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.25)'; e.currentTarget.style.opacity = '0.25'; }}
          >&lt;</button>

          <div style={{
            border: '1px solid rgba(201,168,76,0.2)',
            background: 'rgba(0,0,0,0.8)',
            padding: '5px 16px',
            display: 'flex', alignItems: 'center', gap: '4px',
            letterSpacing: '0.3em', fontSize: '0.62rem',
            color: '#c9a84c',
            perspective: '400px',
          }}>
            <span>CLIP&nbsp;</span>
            <FlipNumber value={current + 1} />
            <span style={{ opacity: 0.35 }}>&nbsp;/&nbsp;</span>
            <span style={{ opacity: 0.5 }}>{String(total).padStart(2, '0')}</span>
          </div>

          <button
            onClick={() => go(1)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(201,168,76,0.25)', fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: "'Courier New', monospace",
              letterSpacing: '0.1em', padding: '4px 8px',
              transition: 'color 0.2s, opacity 0.2s', opacity: 0.25,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c'; e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.25)'; e.currentTarget.style.opacity = '0.25'; }}
          >&gt;</button>
        </motion.div>

        {/* Clip title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: phase >= 4 ? 1 : 0, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.45, delay: 0.35 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 62px)',
              left: '50%', transform: 'translateX(-50%)',
              whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none',
            }}
          >
            <span style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic', fontSize: '0.8rem',
              color: 'rgba(201,168,76,0.6)', letterSpacing: '0.08em',
            }}>{clip.title}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
