'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
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
  )
}

const STATS = [
  { value: '8+', label: 'Years Training', desc: 'Consistent mat time across multiple academies' },
  { value: '4x', label: 'Per Week', desc: 'Minimum training frequency, injuries notwithstanding' },
  { value: '∞', label: 'Lessons Learned', desc: 'Every roll is a diagnostic. Every tap is data.' },
]

const PRINCIPLES = [
  {
    title: 'Pressure is information',
    body: 'In jiu-jitsu, where you feel pressure tells you where you are weak. In life, the same principle applies — discomfort is a signal, not a threat.',
  },
  {
    title: 'Position before submission',
    body: 'The most common mistake is attacking before control is established. In business, in relationships, in personal growth — the ones who rush the finish line rarely win.',
  },
  {
    title: 'You cannot fake cardio',
    body: 'Technical knowledge without conditioning fails under stress. Mental models without execution fail under pressure. Fitness is the foundation that makes everything else work.',
  },
  {
    title: 'The tap resets everything',
    body: 'There is no ego on the mat. Acknowledging a mistake instantly, learning from it, and re-engaging — this is the skill that separates growth from stagnation.',
  },
]

export default function FitnessPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: 'min(85vh, 820px)' }}>
        <Image
          src="/images/photo-3wun-BJJ.jpg"
          alt="Anibal training Brazilian Jiu-Jitsu"
          fill
          priority
          className="object-cover object-center"
          style={{ filter: 'brightness(0.45)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.08) 0%, transparent 60%), linear-gradient(to bottom, transparent 40%, #0a0a0b 100%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 z-10 max-w-[1280px] mx-auto px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.0, 0.0, 0.2, 1.0] }}
          >
            <p className="text-[0.6875rem] tracking-[0.35em] uppercase mb-5" style={{ color: 'var(--gold-subtle)', fontFamily: 'var(--font-body)' }}>
              Fitness
            </p>
            <h1
              className="font-light leading-[0.9] tracking-[-0.03em] text-[var(--warm-white)]"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)', fontFamily: 'var(--font-display)' }}
            >
              The Mat Is
              <br />
              A Laboratory
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-[1280px] mx-auto px-6 py-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.1}>
              <div className="flex flex-col gap-3">
                <span
                  className="font-light tracking-[-0.03em]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    color: 'var(--gold)',
                  }}
                >
                  {stat.value}
                </span>
                <span
                  className="text-[0.7rem] uppercase tracking-[0.2em]"
                  style={{ color: 'var(--warm-white)', fontFamily: 'var(--font-body)' }}
                >
                  {stat.label}
                </span>
                <p
                  className="text-sm leading-relaxed max-w-[32ch]"
                  style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}
                >
                  {stat.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-[1280px] mx-auto px-6">
        <div style={{ height: '1px', background: 'rgba(201,168,76,0.1)' }} />
      </div>

      {/* Principles */}
      <div className="max-w-[860px] mx-auto px-6 py-24">
        <Reveal>
          <p
            className="text-[0.6875rem] tracking-[0.35em] uppercase mb-12"
            style={{ color: 'var(--gold-subtle)', fontFamily: 'var(--font-body)' }}
          >
            Principles
          </p>
        </Reveal>

        <div className="flex flex-col gap-16">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="flex flex-col gap-4">
                <h2
                  className="font-light tracking-[-0.02em] leading-[1.2]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                    color: 'var(--warm-white)',
                  }}
                >
                  {p.title}
                </h2>
                <p
                  className="text-base leading-[1.95] max-w-[65ch]"
                  style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}
                >
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Pull quote */}
      <div className="max-w-[860px] mx-auto px-6 py-24">
        <Reveal className="flex justify-center">
          <p
            className="italic leading-[1.15] tracking-[-0.01em] text-center"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              color: 'var(--gold)',
            }}
          >
            "The body is the bow. The mind is the arrow."
          </p>
        </Reveal>
      </div>

      <Footer />
    </main>
  )
}
