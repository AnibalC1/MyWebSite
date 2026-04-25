'use client';

/**
 * VideoTheater v3 — Per THEATER_PAGE_V2_SPEC.md
 *
 * You are seated. The room is dark. The screen is waiting.
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

  // Gate slam — high square wave transient
  const snap = ctx.createOscillator();
  const snapGain = ctx.createGain();
  snap.type = 'square'; snap.frequency.value = 800;
  snapGain.gain.setValueAtTime(0.08, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
  snap.connect(snapGain); snapGain.connect(ctx.destination);
  snap.start(now); snap.stop(now + 0.025);

  // Weight — low thud
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
    if (phase < 3) return; // wait until entrance step 3
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
        data[i + 3] = Math.random() * 46; // ~18% max opacity
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
  }, [value]);

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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VideoTheater({ clips }: Props) {
  const [current, setCurrent]   = useState(0);
  const [dir, setDir]           = useState<1 | -1>(1);
  const [muted, setMuted]       = useState(true);

  /**
   * Entrance phases:
   * 0 = black
   * 1 = floor lights (0.5s)
   * 2 = screen glow (1.0s)
   * 3 = film grain (1.5s)
   * 4 = video plays, screen brightens (2.0s → 2.3s)
   */
  const [phase, setPhase] = useState(0);

  /**
   * Transition state:
   * 'idle' | 'flicker' | 'black' | 'open'
   */
  const [transition, setTransition] = useState<'idle' | 'flicker' | 'black' | 'open'>('idle');

  const videoRef    = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopHumRef  = useRef<() => void>(() => {});
  const touchStartX = useRef<number | null>(null);
  const total       = clips.length;

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

  // Load video when phase ready
  useEffect(() => {
    if (phase < 4) return;
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [phase, current]);

  // ── Audio: boot on first click ────────────────────────────────────────────
  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }, []);

  const bootHum = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    if (stopHumRef.current.toString() !== '() => {}') return; // already running
    stopHumRef.current = startHum(ctx);
  }, [ensureAudio]);

  // First user gesture → start hum
  useEffect(() => {
    const handler = () => { bootHum(); document.removeEventListener('click', handler); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [bootHum]);

  // ── Projector advance sequence (650ms total) ──────────────────────────────
  const go = useCallback((delta: 1 | -1) => {
    if (transition !== 'idle') return;
    bootHum();

    const ctx = ensureAudio();

    // 1. Flicker (0–150ms)
    setTransition('flicker');

    setTimeout(() => {
      // 2. Cut to black (150ms) + play sound
      setTransition('black');
      if (ctx) playClunk(ctx);
    }, 150);

    setTimeout(() => {
      // 3. Flip to new clip (200ms)
      setDir(delta);
      setCurrent(c => (c + delta + total) % total);
    }, 200);

    setTimeout(() => {
      // 4. Screen opens from overexposure (350ms)
      setTransition('open');
    }, 350);

    setTimeout(() => {
      // 5. Settle to idle (650ms)
      setTransition('idle');
    }, 650);
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

  // ── Screen opacity based on transition ────────────────────────────────────
  const screenOpacity = (() => {
    if (phase < 4)         return 0;
    if (transition === 'flicker') return 0.4; // handled by animation
    if (transition === 'black')   return 0;
    if (transition === 'open')    return 1.05; // overexposure
    return 1;
  })();

  return (
    <main
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed', inset: 0,
        background: '#000',
        overflow: 'hidden',
        fontFamily: "'Courier New', monospace",
        cursor: 'default',
      }}
    >
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
          position: 'absolute', [side]: 0, top: 0, width: '8%', height: '100%',
          background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, rgba(0,0,0,0.65) 0%, transparent 100%)`,
          zIndex: 2, pointerEvents: 'none',
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
          padding: '1.2rem 2rem', zIndex: 20,
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

      {/* ── THE SCREEN ───────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        /* Slightly above center — you look up at it */
        top: '48%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(88vw, 1400px)',
        aspectRatio: '16 / 9',
        zIndex: 10,
      }}>
        {/* Outer glow — darkness pressing in */}
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

        {/* Projector gate border */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '1px solid rgba(201,168,76,0.08)',
          borderRadius: '2px', zIndex: 15, pointerEvents: 'none',
        }} />

        {/* Screen surface */}
        <div style={{
          position: 'absolute', inset: 0,
          overflow: 'hidden', borderRadius: '1px',
        }}>
          {/* Pre-video screen glow (before video plays) */}
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

          {/* VIDEO */}
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

          {/* Sound toggle — bottom right corner, ghost at rest */}
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
          {/* Left arrow */}
          <button
            onClick={() => go(-1)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(201,168,76,0.25)', fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: "'Courier New', monospace",
              letterSpacing: '0.1em', padding: '4px 8px',
              transition: 'color 0.2s, opacity 0.2s',
              opacity: 0.25,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c'; e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.25)'; e.currentTarget.style.opacity = '0.25'; }}
          >&lt;</button>

          {/* Mechanical film counter */}
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

          {/* Right arrow */}
          <button
            onClick={() => go(1)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(201,168,76,0.25)', fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: "'Courier New', monospace",
              letterSpacing: '0.1em', padding: '4px 8px',
              transition: 'color 0.2s, opacity 0.2s',
              opacity: 0.25,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c'; e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.25)'; e.currentTarget.style.opacity = '0.25'; }}
          >&gt;</button>
        </motion.div>

        {/* Clip title — below controls */}
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
