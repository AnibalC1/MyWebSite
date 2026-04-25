'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const FIRST = 'ANIBAL';
const LAST  = 'CABRAL';

const HERO_VIDEOS = [
  '/video/hero-1.mp4',
  '/video/hero-2.mp4',
  '/video/hero-3.mp4',
  '/video/hero-4.mp4',
  '/video/hero-5.mp4',
];

function SplitWord({ word, delay }: { word: string; delay: number }) {
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', lineHeight: 1 }}>
      {word.split('').map((ch, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', willChange: 'transform' }}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          transition={{
            delay: delay + i * 0.055,
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Pick a random clip on every page load
    setVideoSrc(HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)]);
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}
    >
      {/* ── Video background ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 2.5, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.38,
            filter: 'grayscale(20%) contrast(1.05)',
          }}
        >
          {videoSrc && <source src={videoSrc} type="video/mp4" />}
        </video>
      </motion.div>

      {/* ── Multi-layer dark overlay ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: [
          'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
          'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.65) 100%)',
        ].join(', '),
      }} />

      {/* ── Grain ── */}
      <div className="grain-overlay" aria-hidden style={{ zIndex: 2 }} />

      {/* ── Scanlines (futuristic) ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 3,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
        pointerEvents: 'none',
      }} />

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 1.0, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.6rem 2.8rem',
          pointerEvents: 'none',
        }}
      >
        <Link href="/" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
          {/* Logo: static outer + 3D spinning AR monogram inside */}
          <div style={{ position: 'relative', height: '180px', display: 'inline-block' }}>
            {/* Spinning inner — clipped to the AR circle */}
            <img
              src="/logo.png"
              alt=""
              aria-hidden
              className="logo-inner-spin"
              style={{
                position: 'absolute', top: 0, left: 0,
                height: '180px', width: 'auto',
                clipPath: 'circle(21% at 50% 46%)',
                filter: 'drop-shadow(0 0 14px rgba(201,168,76,0.9))',
              }}
            />
            {/* Static outer — mask hides the center so spin shows through */}
            <img
              src="/logo.png"
              alt="Anibal Cabral"
              style={{
                height: '180px', width: 'auto',
                position: 'relative', zIndex: 1,
                filter: 'drop-shadow(0 0 10px rgba(201,168,76,0.5))',
                WebkitMaskImage: 'radial-gradient(circle 21% at 50% 46%, transparent 95%, black 100%)',
                maskImage: 'radial-gradient(circle 21% at 50% 46%, transparent 95%, black 100%)',
              }}
            />
          </div>
        </Link>
        <div style={{ display: 'flex', gap: '2.4rem', pointerEvents: 'auto' }}>
          {[
            { label: 'Gallery', href: '/gallery' },
            { label: 'Videos',  href: '/videos'  },
            { label: 'About',   href: '/about'   },
            { label: 'Builds',  href: '/builds'  },
            { label: 'Contact', href: '/contact' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.68rem',
                letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'color 0.3s ease',
              }}
              onMouseOver={e => (e.currentTarget.style.color = '#c9a84c')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              {label}
            </Link>
          ))}
        </div>
      </motion.nav>

      {/* ── Hero center block ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        textAlign: 'center',
        padding: '0 2rem',
        userSelect: 'none',
      }}>

        {/* Identity tags */}
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.6em' }}
          animate={{ opacity: 1, letterSpacing: '0.32em' }}
          transition={{ delay: 0.6, duration: 1.4, ease: 'easeOut' }}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(0.55rem, 1.2vw, 0.72rem)',
            letterSpacing: '0.32em',
            color: '#c9a84c',
            textTransform: 'uppercase',
            marginBottom: '2.4rem',
            opacity: 0.85,
          }}
        >
          Father · Builder · Martial Artist
        </motion.p>

        {/* Name — massive display */}
        <div style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 300,
          fontSize: 'clamp(5rem, 15vw, 14rem)',
          lineHeight: 0.88,
          color: '#ffffff',
          letterSpacing: '-0.01em',
          marginBottom: '0',
        }}>
          <div><SplitWord word={FIRST} delay={0.9} /></div>
          <div><SplitWord word={LAST}  delay={1.3} /></div>
        </div>

        {/* Gold divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2.2, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 'clamp(80px, 18vw, 220px)',
            height: '1px',
            background: 'linear-gradient(to right, transparent, #c9a84c, transparent)',
            margin: '2.2rem 0 2.0rem',
            transformOrigin: 'center',
          }}
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 'clamp(1rem, 2.2vw, 1.5rem)',
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.04em',
            lineHeight: 1.6,
            maxWidth: '560px',
            marginBottom: '3rem',
          }}
        >
          Every system I design, every discipline I build —<br />
          it is all for this table.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.0, duration: 1.0, ease: 'easeOut' }}
        >
          <Link
            href="/gallery"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.8rem',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.68rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              border: '1px solid rgba(201,168,76,0.3)',
              padding: '0.85rem 2.2rem',
              transition: 'all 0.4s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = '#c9a84c';
              e.currentTarget.style.borderColor = '#c9a84c';
              e.currentTarget.style.background = 'rgba(201,168,76,0.06)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Enter the Constellation
            <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>→</span>
          </Link>
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ delay: 3.8, duration: 2.0, repeat: Infinity, repeatDelay: 1.5 }}
        style={{
          position: 'absolute',
          bottom: '2.4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          width: '1px',
          height: '40px',
          background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.5))',
        }} />
      </motion.div>

    </main>
  );
}
