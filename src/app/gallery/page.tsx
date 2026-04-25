'use client';

import dynamic from 'next/dynamic';
import Navigation from '@/components/layout/Navigation';
import { motion } from 'framer-motion';

const WorldAtlasGlobe = dynamic(
  () => import('@/components/constellation/WorldAtlasGlobe'),
  { ssr: false, loading: () => (
    <div style={{
      position: 'fixed', inset: 0, background: '#00010a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{
        fontFamily: 'Inter, sans-serif', fontSize: '0.6rem',
        letterSpacing: '0.3em', color: 'rgba(0,212,255,0.4)',
        textTransform: 'uppercase',
      }}>
        Mapping memories…
      </p>
    </div>
  )}
);

export default function GalleryPage() {
  return (
    <main style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#00010a' }}>
      {/* World atlas globe — handles its own fade-in, panel, grain */}
      <WorldAtlasGlobe />

      {/* Shared nav on top */}
      <Navigation />

      {/* Subtle title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
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
          fontSize: 'clamp(1rem, 2.2vw, 1.7rem)',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.08em',
          margin: 0,
          textShadow: '0 0 40px rgba(0,180,255,0.15)',
        }}>
          A life mapped across time and place.
        </p>
      </motion.div>
    </main>
  );
}
