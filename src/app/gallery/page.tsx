'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { Memory } from '@/data/memories';
import Navigation from '@/components/layout/Navigation';

const GlobeScene = dynamic(
  () => import('@/components/constellation/GlobeScene').then(m => ({ default: m.GlobeScene })),
  { ssr: false }
);

export default function Home() {
  const [selected, setSelected] = useState<Memory | null>(null);
  const [ready, setReady] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 60%, #0a0806 0%, #000000 100%)',
        overflow: 'hidden',
        opacity: ready ? 1 : 0,
        transition: 'opacity 1.2s ease',
      }}
    >
      {/* Film grain */}
      <div className="grain-overlay" aria-hidden />

      {/* 3D scene — full bleed */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <GlobeScene onSelect={setSelected} />
      </div>

      {/* Shared nav */}
      <Navigation />

      {/* Hero tagline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          textAlign: 'center',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <p style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 'clamp(1.1rem, 2.4vw, 1.9rem)',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.08em',
          margin: 0,
          textShadow: '0 0 30px rgba(201,168,76,0.2)',
        }}>
          I build systems, discipline, and legacy.
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.6rem',
          letterSpacing: '0.35em',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
          marginTop: '0.9rem',
        }}>
          Hover a globe · Click a photo
        </p>
      </motion.div>

      {/* Expanded memory overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.82)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              cursor: 'pointer',
            }}
          >
            <motion.div
              initial={{ scale: 0.82, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 20, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '640px',
                width: '90vw',
                cursor: 'default',
                background: 'rgba(10,8,6,0.55)',
                border: '1px solid rgba(201,168,76,0.18)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              {/* Photo */}
              <div style={{ position: 'relative', width: '100%', paddingBottom: '66%', overflow: 'hidden' }}>
                <img
                  src={selected.img}
                  alt={selected.title}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {/* Gold gradient overlay at bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '55%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                }} />
              </div>

              {/* Text panel */}
              <div style={{ padding: '1.6rem 2rem 2rem' }}>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.62rem',
                  letterSpacing: '0.3em',
                  color: '#c9a84c',
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                }}>
                  {selected.category}
                </p>
                <h2 style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  color: '#fff',
                  margin: '0 0 0.9rem',
                  lineHeight: 1.1,
                }}>
                  {selected.title}
                </h2>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {selected.caption}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '50%',
                  width: '2rem',
                  height: '2rem',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = '#c9a84c')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
