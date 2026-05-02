'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';

const STATS = [
  { value: '7+', label: 'Years Training' },
  { value: '4x', label: 'Weekly Sessions' },
  { value: 'BJJ', label: 'Primary Art' },
  { value: '∞', label: 'Lessons Learned' },
];

const PRINCIPLES = [
  {
    title: 'You Cannot Fake It',
    body: 'On the mat, there is no room for performance. You either know the technique or you do not. You are either calm under pressure or you are not. This honesty is rare in life — and that is why I keep coming back.',
  },
  {
    title: 'Tap Early, Tap Often',
    body: 'The ego wants to fight through bad positions. The wise practitioner recognizes when they are beaten and resets. This is not weakness — it is the fastest path to growth. The same applies to business and relationships.',
  },
  {
    title: 'The Best Position Is the One You Are In',
    body: 'You do not always get to choose where the roll starts. What matters is what you do from there. Complaining about circumstances is wasted energy. Solving problems from where you stand is the only discipline that matters.',
  },
  {
    title: 'Pressure Is a Privilege',
    body: 'When someone puts pressure on you, they are giving you information. How you respond under that pressure reveals who you are becoming. Most people avoid pressure. I seek it out.',
  },
];

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.9, ease: [0.0, 0.0, 0.2, 1.0], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function FitnessPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: 'min(70vh, 700px)' }}>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(10,10,11,0.8) 0%, rgba(20,15,10,0.6) 50%, rgba(10,10,11,0.9) 100%)',
          }}
        />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1280px] mx-auto px-6 pb-16 w-full">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.0, 0.0, 0.2, 1.0] }}
            >
              <p className="text-[0.6875rem] tracking-[0.35em] uppercase text-[#4a4845] mb-5">
                Discipline
              </p>
              <h1
                className="font-light leading-[0.9] tracking-[-0.03em]"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(3rem, 8vw, 7rem)' }}
              >
                The Mat<br />Does Not Lie
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-32">
        {/* Stats row */}
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16" style={{ borderBottom: '1px solid var(--steel)' }}>
            {STATS.map((stat, i) => (
              <div key={i} className="text-center md:text-left">
                <p
                  className="text-4xl md:text-5xl font-light mb-2"
                  style={{ fontFamily: 'var(--font-display)', color: '#c9a84c' }}
                >
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Principles */}
        <div className="py-20">
          <Reveal>
            <p className="text-[0.6875rem] tracking-[0.35em] uppercase mb-12" style={{ color: '#4a4845', fontFamily: 'var(--font-body)' }}>
              What the Mat Teaches
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div
                  className="h-full p-8"
                  style={{
                    border: '1px solid var(--steel)',
                    background: 'var(--graphite)',
                  }}
                >
                  <h3
                    className="text-xl font-light italic mb-4"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)' }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Philosophy */}
        <Reveal className="py-20">
          <div className="max-w-[70ch] mx-auto text-center">
            <p
              className="font-light italic leading-[1.3] tracking-[-0.01em] mb-8"
              style={{ fontFamily: 'var(--font-display)', color: '#c9a84c', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}
            >
              "The goal is not to be better than anyone else. The goal is to be better than the person you were yesterday."
            </p>
            <p className="text-sm" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
              — Jigoro Kano, founder of Judo
            </p>
          </div>
        </Reveal>
      </div>

      <Footer />
    </main>
  );
}
