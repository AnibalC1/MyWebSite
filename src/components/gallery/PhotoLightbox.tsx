'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { GalleryPhoto } from '@/lib/gallery';
import { CLUSTER_BY_ID } from '@/lib/gallery';

type Props = {
  photo: GalleryPhoto | null;
  onClose: () => void;
};

export default function PhotoLightbox({ photo, onClose }: Props) {
  useEffect(() => {
    if (!photo) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [photo, onClose]);

  const dateStr = photo
    ? (() => {
        try {
          return new Date(photo.ts * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          });
        } catch { return photo.date; }
      })()
    : '';

  const placeLabel = photo ? CLUSTER_BY_ID[photo.cluster]?.label ?? photo.label : '';

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(5,5,7,0.92)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(1rem, 5vw, 4rem)',
            cursor: 'zoom-out',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: 'min(1100px, 92vw)',
              maxHeight: '88vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              cursor: 'auto',
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '-2.6rem',
                right: 0,
                background: 'transparent',
                border: 'none',
                color: 'rgba(241,237,230,0.7)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.65rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '0.4rem 0',
                transition: 'color 200ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#c9a96e')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(241,237,230,0.7)')}
            >
              Close <span style={{ marginLeft: '0.4rem' }}>✕</span>
            </button>

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 'min(70vh, 720px)',
                background: '#0a0a0b',
                border: '1px solid rgba(201,169,110,0.18)',
                overflow: 'hidden',
              }}
            >
              <Image
                src={photo.src}
                alt={photo.label || photo.file}
                fill
                sizes="(min-width: 1100px) 1100px, 92vw"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.62rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: '#8a6f3e',
                    marginBottom: '0.45rem',
                  }}
                >
                  {placeLabel}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: 'clamp(1.4rem, 2.2vw, 1.9rem)',
                    color: 'rgba(241,237,230,0.92)',
                    letterSpacing: '-0.005em',
                    lineHeight: 1.25,
                  }}
                >
                  {dateStr}
                </p>
              </div>

              {photo.people?.length > 0 && (
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.78rem',
                    color: 'rgba(180,175,166,0.85)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {photo.people.join(' · ')}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
