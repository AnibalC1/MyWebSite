'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/layout/Navigation';
import PhotoLightbox from '@/components/gallery/PhotoLightbox';
import { CLUSTER_ANCHORS, type GalleryPhoto } from '@/lib/gallery';

const PhotoConstellation = dynamic(
  () => import('@/components/gallery/PhotoConstellation'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, #0c0c10 0%, #050507 65%, #020203 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.62rem',
            letterSpacing: '0.32em',
            color: 'rgba(201,169,110,0.5)',
            textTransform: 'uppercase',
          }}
        >
          Mapping the constellation…
        </p>
      </div>
    ),
  }
);

export default function GalleryPage() {
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [focusCluster, setFocusCluster] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [hintHidden, setHintHidden] = useState(false);

  const handleSelectCluster = (id: string) => {
    setHintHidden(true);
    if (activeCluster === id) {
      setActiveCluster(null);
      setFocusCluster(null);
    } else {
      setActiveCluster(id);
      setFocusCluster(id);
    }
  };

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#050507',
      }}
    >
      <PhotoConstellation
        activeCluster={activeCluster}
        focusCluster={focusCluster}
        onSelectPhoto={(p) => { setHintHidden(true); setSelectedPhoto(p); }}
        onSelectCluster={handleSelectCluster}
      />

      {/* Subtle grain on top of the canvas for warmth */}
      <div className="grain-overlay" aria-hidden style={{ zIndex: 5, opacity: 0.04 }} />

      <Navigation />

      {/* Top-left header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 'clamp(7rem, 11vw, 9rem)',
          left: 'clamp(1.25rem, 4vw, 2.5rem)',
          zIndex: 10,
          pointerEvents: 'none',
          maxWidth: '32ch',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: '#8a6f3e',
            marginBottom: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          <span style={{ width: '28px', height: '1px', background: '#c9a96e', opacity: 0.5 }} />
          The Constellation
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color: 'rgba(241,237,230,0.96)',
            textShadow: '0 0 30px rgba(5,5,7,0.9)',
          }}
        >
          A life, scattered<br />across rooms.
        </h1>
      </motion.div>

      {/* Cluster filter — bottom center */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          bottom: 'clamp(1.5rem, 4vw, 2.6rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          background: 'rgba(10,10,11,0.5)',
          border: '1px solid rgba(201,169,110,0.14)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          maxWidth: 'min(900px, 92vw)',
        }}
      >
        <button
          onClick={() => { setActiveCluster(null); setFocusCluster(null); setHintHidden(true); }}
          style={chipStyle(activeCluster === null)}
        >
          All
        </button>
        {CLUSTER_ANCHORS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelectCluster(c.id)}
            style={chipStyle(activeCluster === c.id)}
          >
            {c.label}
          </button>
        ))}
      </motion.div>

      {/* Hint */}
      <AnimatePresence>
        {!hintHidden && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2.5, duration: 1.4, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: 'clamp(5rem, 9vw, 6.5rem)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              pointerEvents: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: '0.62rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(241,237,230,0.65)',
              whiteSpace: 'nowrap',
            }}
          >
            Move · Click a photograph
          </motion.p>
        )}
      </AnimatePresence>

      <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </main>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    fontFamily: 'var(--font-body)',
    fontSize: '0.62rem',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    padding: '0.55rem 1rem',
    background: active ? '#c9a96e' : 'transparent',
    color: active ? '#0a0a0b' : 'rgba(241,237,230,0.7)',
    border: `1px solid ${active ? '#c9a96e' : 'rgba(201,169,110,0.18)'}`,
    cursor: 'pointer',
    transition: 'all 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  };
}
