'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/layout/Navigation';

const PHOTOS = [
  { src: '/vital-edge/ve-gym-interior.jpg',    caption: 'The Facility',        category: 'gym'       },
  { src: '/vital-edge/ve-gym-review.jpg',      caption: 'The Standard',        category: 'gym'       },
  { src: '/vital-edge/ve-thin-blue-line.jpg',  caption: 'The Community',       category: 'community' },
  { src: '/vital-edge/ve-kids-class.jpg',      caption: 'Next Generation',     category: 'community' },
  { src: '/vital-edge/ve-women-class-1.jpg',   caption: "Women's Program",     category: 'training'  },
  { src: '/vital-edge/ve-women-class-2.jpg',   caption: 'After the Roll',      category: 'training'  },
  { src: '/vital-edge/ve-women-class-3.jpg',   caption: 'The Team',            category: 'training'  },
  { src: '/vital-edge/ve-women-class-4.jpg',   caption: 'On the Mats',         category: 'training'  },
  { src: '/vital-edge/ve-mat-rolling.jpg',     caption: 'Live Training',       category: 'training'  },
];

const CATEGORIES = ['all', 'gym', 'training', 'community'] as const;
type Category = typeof CATEGORIES[number];

export default function PhotosPage() {
  const [active, setActive] = useState<Category>('all');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = active === 'all' ? PHOTOS : PHOTOS.filter(p => p.category === active);

  return (
    <main style={{ minHeight: '100vh', background: '#06060a', color: '#fff' }}>
      <Navigation />

      <div style={{ paddingTop: '140px', paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto', padding: '140px 2rem 80px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.62rem',
            letterSpacing: '0.4em',
            color: '#c9a84c',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            Vital Edge Training Center
          </p>
          <h1 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 300,
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            lineHeight: 1.0,
            color: '#fff',
            margin: 0,
          }}>
            The Gym
          </h1>
          <div style={{
            width: '60px',
            height: '1px',
            background: 'linear-gradient(to right, transparent, #c9a84c, transparent)',
            margin: '1.6rem auto',
          }} />
          <p style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.45)',
            maxWidth: '480px',
            margin: '0 auto',
          }}>
            Where the work gets done.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '3rem', flexWrap: 'wrap' }}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.6rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                padding: '0.55rem 1.4rem',
                border: '1px solid',
                borderColor: active === cat ? '#c9a84c' : 'rgba(255,255,255,0.12)',
                background: active === cat ? 'rgba(201,168,76,0.08)' : 'transparent',
                color: active === cat ? '#c9a84c' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Photo grid */}
        <motion.div
          layout
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.2rem',
          }}
        >
          {filtered.map((photo, i) => (
            <motion.div
              key={photo.src}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setLightbox(photo.src)}
              style={{
                position: 'relative',
                aspectRatio: '4/3',
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#111',
              }}
            >
              <img
                src={photo.src}
                alt={photo.caption}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s ease',
                  display: 'block',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1.0)')}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                pointerEvents: 'none',
              }} />
              <p style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1.2rem',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.6rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.7)',
              }}>
                {photo.caption}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'zoom-out',
              padding: '2rem',
            }}
          >
            <motion.img
              src={lightbox}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                maxWidth: '90vw',
                maxHeight: '88vh',
                objectFit: 'contain',
                boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
              }}
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(null)}
              style={{
                position: 'fixed',
                top: '1.5rem',
                right: '2rem',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '1.8rem',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
