'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VideoClip {
  src: string;    // e.g. /video/hero-1.mp4
  title: string;
  date?: string;
}

interface Props {
  clips: VideoClip[];
}

// ─── Mechanical projector click (square wave, 80Hz) ──────────────────────────
function playClick() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

// ─── Sprocket strip ───────────────────────────────────────────────────────────
function Sprockets() {
  return (
    <>
      {(['top', 'bottom'] as const).map((side) => (
        <div
          key={side}
          style={{
            position: 'absolute',
            [side]: 0,
            left: 0,
            right: 0,
            height: '14px',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            padding: '0 8px',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '9px',
                height: '6px',
                borderRadius: '1px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.11)',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function VideoTheater({ clips }: Props) {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const dragStartX = useRef<number | null>(null);
  const total = clips.length;

  const go = useCallback(
    (delta: 1 | -1) => {
      playClick();
      setDir(delta);
      setCurrent((c) => (c + delta + total) % total);
    },
    [total],
  );

  // Reset + play on clip change
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [current]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  // Mouse drag on active frame
  const onDragStart = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
  };
  const onDragEnd = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    dragStartX.current = null;
  };

  const clip = clips[current];

  // Slide variants — mechanical snap
  const variants = {
    enter: (d: number) => ({
      x: d * window.innerWidth * 0.9,
      rotateY: d * -18,
      scale: 0.6,
      opacity: 0,
    }),
    center: {
      x: 0,
      rotateY: 0,
      scale: 1,
      opacity: 1,
    },
    exit: (d: number) => ({
      x: d * -window.innerWidth * 0.9,
      rotateY: d * 18,
      scale: 0.6,
      opacity: 0,
    }),
  };

  const spring = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
    mass: 0.6,
  };

  return (
    <main
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050404',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        perspective: '1400px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* ── Projector beam ────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          right: '25%',
          height: '100%',
          background:
            'linear-gradient(to bottom, rgba(255,248,210,0.07) 0%, rgba(255,248,210,0.02) 45%, transparent 72%)',
          clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Floating dust */}
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          aria-hidden
          style={{
            position: 'absolute',
            width: '1.5px',
            height: '1.5px',
            borderRadius: '50%',
            background: 'rgba(255,248,200,0.5)',
            left: `${36 + i * 4}%`,
            top: `${12 + (i % 4) * 10}%`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
          animate={{
            y: [0, -20, 10, -14, 0],
            x: [0, 5, -4, 7, 0],
            opacity: [0.15, 0.55, 0.1, 0.45, 0.15],
          }}
          transition={{
            duration: 5.5 + i * 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.6,
          }}
        />
      ))}

      {/* Film grain */}
      <div className="grain-overlay" aria-hidden style={{ zIndex: 3 }} />

      {/* Curtains */}
      {(['left', 'right'] as const).map((side) => (
        <div
          key={side}
          aria-hidden
          style={{
            position: 'absolute',
            [side]: 0,
            top: 0,
            width: '9%',
            height: '100%',
            background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, rgba(5,4,4,0.98) 0%, rgba(5,4,4,0.6) 55%, transparent 100%)`,
            zIndex: 14,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── Nav ───────────────────────────────────────────── */}
      <nav
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.4rem 2.4rem',
          zIndex: 20,
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            letterSpacing: '0.22em',
            color: '#c9a84c',
            textDecoration: 'none',
            textShadow: '0 0 20px rgba(201,168,76,0.45)',
            textTransform: 'uppercase',
          }}
        >
          AC
        </a>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[
            { href: '/gallery', label: 'Gallery' },
            { href: '/about', label: 'About' },
            { href: '/builds', label: 'Builds' },
            { href: '/contact', label: 'Contact' },
          ].map((n) => (
            <a
              key={n.href}
              href={n.href}
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.35)',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#c9a84c')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Side slides ───────────────────────────────────── */}
      {/* Prev */}
      <div
        onClick={() => go(-1)}
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translate(-8%, -54%) scale(0.62) rotateY(8deg)',
          transformOrigin: 'right center',
          width: 'min(72vw, 960px)',
          aspectRatio: '16/9',
          opacity: 0.75,
          cursor: 'pointer',
          zIndex: 5,
          filter: 'brightness(1.4) saturate(0.15) hue-rotate(185deg) contrast(1.2) drop-shadow(0 0 28px rgba(0,210,255,0.5))',
          transition: 'opacity 0.2s, filter 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.filter = 'brightness(1.6) saturate(0.2) hue-rotate(185deg) contrast(1.2) drop-shadow(0 0 40px rgba(0,210,255,0.7))'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.filter = 'brightness(1.4) saturate(0.15) hue-rotate(185deg) contrast(1.2) drop-shadow(0 0 28px rgba(0,210,255,0.5))'; }}
      >
        <video
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={clips[(current - 1 + total) % total].src} type="video/mp4" />
        </video>
        <Sprockets />
        {/* Holographic scan lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,210,255,0.07) 3px, rgba(0,210,255,0.08) 4px)',
          mixBlendMode: 'screen',
        }} />
        {/* Holographic tint */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'rgba(0,190,255,0.08)',
          mixBlendMode: 'screen',
        }} />
      </div>

      {/* Next */}
      <div
        onClick={() => go(1)}
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translate(8%, -54%) scale(0.62) rotateY(-8deg)',
          transformOrigin: 'left center',
          width: 'min(72vw, 960px)',
          aspectRatio: '16/9',
          opacity: 0.75,
          cursor: 'pointer',
          zIndex: 5,
          filter: 'brightness(1.4) saturate(0.15) hue-rotate(185deg) contrast(1.2) drop-shadow(0 0 28px rgba(0,210,255,0.5))',
          transition: 'opacity 0.2s, filter 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.filter = 'brightness(1.6) saturate(0.2) hue-rotate(185deg) contrast(1.2) drop-shadow(0 0 40px rgba(0,210,255,0.7))'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.filter = 'brightness(1.4) saturate(0.15) hue-rotate(185deg) contrast(1.2) drop-shadow(0 0 28px rgba(0,210,255,0.5))'; }}
      >
        <video
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={clips[(current + 1) % total].src} type="video/mp4" />
        </video>
        <Sprockets />
        {/* Holographic scan lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,210,255,0.07) 3px, rgba(0,210,255,0.08) 4px)',
          mixBlendMode: 'screen',
        }} />
        {/* Holographic tint */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'rgba(0,190,255,0.08)',
          mixBlendMode: 'screen',
        }} />
      </div>

      {/* ── Active slide ──────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          width: 'min(75vw, 1020px)',
          aspectRatio: '16/9',
          zIndex: 10,
        }}
        onMouseDown={onDragStart}
        onMouseUp={onDragEnd}
      >
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={current}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={spring}
            style={{
              position: 'absolute',
              inset: 0,
              border: '1px solid rgba(201,168,76,0.4)',
              boxShadow:
                '0 0 120px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04)',
              cursor: 'grab',
              overflow: 'hidden',
            }}
          >
            {/* Video */}
            <video
              ref={videoRef}
              autoPlay
              muted={muted}
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            >
              <source src={clip.src} type="video/mp4" />
            </video>

            {/* Letterbox bars */}
            {(['top', 'bottom'] as const).map((side) => (
              <div
                key={side}
                style={{
                  position: 'absolute',
                  [side]: 0,
                  left: 0,
                  right: 0,
                  height: '10%',
                  background: 'rgba(0,0,0,0.88)',
                  zIndex: 3,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Vignette */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />

            {/* Sprockets */}
            <Sprockets />

            {/* Sound toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMuted((m) => !m);
              }}
              style={{
                position: 'absolute',
                top: '18px',
                right: '12px',
                zIndex: 8,
                background: 'rgba(0,0,0,0.55)',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: muted ? 'rgba(255,255,255,0.35)' : '#c9a84c',
                fontSize: '0.75rem',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Title below frame */}
        <motion.div
          key={`label-${current}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          style={{
            position: 'absolute',
            bottom: '-2.8rem',
            left: 0,
            right: 0,
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(0.85rem, 1.6vw, 1.2rem)',
              color: 'rgba(240,237,232,0.65)',
              letterSpacing: '0.05em',
            }}
          >
            {clip.title}
          </span>
        </motion.div>
      </div>

      {/* ── Arrows ────────────────────────────────────────── */}
      {[
        { side: 'left' as const, delta: -1 as const, symbol: '←' },
        { side: 'right' as const, delta: 1 as const, symbol: '→' },
      ].map(({ side, delta, symbol }) => (
        <button
          key={side}
          onClick={() => go(delta)}
          style={{
            position: 'absolute',
            [side]: '4.5%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            background: 'none',
            border: '1px solid rgba(201,168,76,0.22)',
            color: 'rgba(201,168,76,0.5)',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.75)';
            e.currentTarget.style.color = '#c9a84c';
            e.currentTarget.style.background = 'rgba(201,168,76,0.07)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.22)';
            e.currentTarget.style.color = 'rgba(201,168,76,0.5)';
            e.currentTarget.style.background = 'none';
          }}
        >
          {symbol}
        </button>
      ))}

      {/* ── Dots — bottom center ───────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        {clips.map((_, i) => (
          <div
            key={i}
            onClick={() => {
              if (i !== current) {
                playClick();
                setDir(i > current ? 1 : -1);
                setCurrent(i);
              }
            }}
            style={{
              width: i === current ? '22px' : '7px',
              height: '3px',
              borderRadius: '1.5px',
              background:
                i === current
                  ? '#c9a84c'
                  : 'rgba(201,168,76,0.22)',
              border: i === current ? 'none' : '1px solid rgba(201,168,76,0.3)',
              transition: 'width 0.3s ease, background 0.3s ease',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* ── Counter — bottom right ─────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          right: '2.5rem',
          zIndex: 20,
          fontFamily: 'var(--font-display)',
          fontSize: '0.85rem',
          letterSpacing: '0.15em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ color: '#c9a84c' }}>
          {String(current + 1).padStart(2, '0')}
        </span>
        <span style={{ color: 'rgba(201,168,76,0.3)', fontSize: '0.7rem' }}>/</span>
        <span style={{ color: 'rgba(201,168,76,0.4)' }}>
          {String(total).padStart(2, '0')}
        </span>
      </div>
    </main>
  );
}
