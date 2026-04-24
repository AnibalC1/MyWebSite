'use client';

import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Memory } from '@/data/memories';

const ConstellationScene = lazy(() => import('@/components/constellation/ConstellationScene'));

const NAV = [
  { href: '/about',        label: 'About' },
  { href: '/memory-atlas', label: 'Atlas' },
  { href: '/builds',       label: 'Builds' },
  { href: '/contact',      label: 'Contact' },
];

export default function HomePage() {
  const [selected, setSelected] = useState<Memory | null>(null);
  const [ready, setReady]       = useState(false);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: '#08080a' }}
    >
      {/* Film grain */}
      <div className="grain-overlay" aria-hidden />

      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,0.045) 0%, transparent 65%)',
        }}
      />

      {/* Globe */}
      <motion.div
        className="absolute inset-0 z-[2]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, ease: 'easeOut' }}
        onAnimationComplete={() => setReady(true)}
      >
        <Suspense fallback={null}>
          <ConstellationScene onSelect={setSelected} />
        </Suspense>
      </motion.div>

      {/* Hero text — bottom left */}
      <motion.div
        className="absolute bottom-12 left-8 md:left-14 z-10 pointer-events-none"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1
          className="font-light italic leading-[1.1] mb-4"
          style={{
            fontFamily:   'var(--font-display)',
            color:        'var(--warm-white)',
            fontSize:     'clamp(1.7rem, 3.5vw, 3.2rem)',
            textShadow:   '0 2px 60px rgba(8,8,10,0.95)',
            letterSpacing: '-0.02em',
          }}
        >
          I build systems,
          <br />
          discipline, and legacy.
        </h1>
        <p
          className="text-[0.6rem] uppercase tracking-[0.32em]"
          style={{ color: 'rgba(240,237,232,0.35)', fontFamily: 'var(--font-body)' }}
        >
          Anibal Cabral
        </p>
      </motion.div>

      {/* Ghost nav — top right */}
      <motion.nav
        className="absolute top-8 right-8 md:right-14 z-10 flex gap-7 items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 2.2 }}
      >
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-[0.6rem] uppercase tracking-[0.22em] transition-colors duration-400"
            style={{ color: 'rgba(240,237,232,0.28)', fontFamily: 'var(--font-body)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(201,168,76,0.9)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240,237,232,0.28)'; }}
          >
            {label}
          </Link>
        ))}
      </motion.nav>

      {/* Explore hint */}
      {ready && !selected && (
        <motion.p
          className="absolute bottom-14 right-8 md:right-14 z-10 pointer-events-none text-[0.55rem] uppercase tracking-[0.3em]"
          style={{ color: 'rgba(240,237,232,0.2)', fontFamily: 'var(--font-body)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 4, delay: 3, repeat: 1, ease: 'easeInOut' }}
        >
          Touch a memory
        </motion.p>
      )}

      {/* Expanded memory view */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              onClick={() => setSelected(null)}
              style={{ background: 'rgba(8,8,10,0.88)', backdropFilter: 'blur(20px)' }}
            />

            {/* Memory panel */}
            <motion.div
              key="panel"
              className="fixed inset-0 z-30 flex items-center justify-center p-6 md:p-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                initial={{ scale: 0.88, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 12, opacity: 0 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[680px]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Photo */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: '4/3' }}
                >
                  <Image
                    src={selected.img}
                    alt={selected.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="680px"
                  />
                  {/* Vignette */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(8,8,10,0.8) 0%, rgba(8,8,10,0.1) 50%, transparent 100%)',
                    }}
                  />
                  {/* Category badge */}
                  <div className="absolute top-5 left-5">
                    <span
                      className="text-[0.6rem] uppercase tracking-[0.22em] px-3 py-1.5"
                      style={{
                        background: 'rgba(8,8,10,0.6)',
                        border:     '1px solid rgba(201,168,76,0.4)',
                        color:      '#c9a84c',
                        fontFamily: 'var(--font-body)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {selected.category}
                    </span>
                  </div>
                </div>

                {/* Text */}
                <div className="mt-7 px-1">
                  <h2
                    className="font-light italic mb-3 leading-[1.1]"
                    style={{
                      fontFamily:    'var(--font-display)',
                      color:         'var(--warm-white)',
                      fontSize:      'clamp(1.9rem, 3vw, 2.8rem)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {selected.title}
                  </h2>
                  <p
                    className="text-[0.95rem] leading-relaxed"
                    style={{
                      color:      'rgba(240,237,232,0.55)',
                      fontFamily: 'var(--font-body)',
                      maxWidth:   '52ch',
                    }}
                  >
                    {selected.caption}
                  </p>
                </div>

                {/* Close */}
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center"
                  style={{
                    background:     'rgba(8,8,10,0.65)',
                    border:         '1px solid rgba(240,237,232,0.1)',
                    color:          'rgba(240,237,232,0.5)',
                    fontSize:       '1.1rem',
                    backdropFilter: 'blur(8px)',
                    transition:     'all 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color  = '#f0ede8';
                    e.currentTarget.style.border = '1px solid rgba(201,168,76,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color  = 'rgba(240,237,232,0.5)';
                    e.currentTarget.style.border = '1px solid rgba(240,237,232,0.1)';
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
