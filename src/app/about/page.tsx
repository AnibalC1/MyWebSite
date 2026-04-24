'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Navigation from '@/components/layout/Navigation'

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
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

function Divider() {
  return (
    <div
      className="w-full"
      style={{ height: '1px', background: 'rgba(201,168,76,0.2)', margin: '0' }}
    />
  )
}

const SECTIONS = [
  {
    paragraphs: [
      'I am not a finished thing.',
      'I am a man in the middle of becoming — building systems, raising children, training my body, and learning, slowly, to align how I live with who I actually am.',
      'That work is never finished. That is the point.',
    ],
  },
  {
    paragraphs: [
      'There was a point where I had to look at myself honestly — not as a man with intentions, but as a father with a record.',
      'I saw what my reactions were doing. I saw the gap between who I thought I was and how I was actually showing up. Intention was not enough. Awareness without change is just self-flattery.',
      'So I started the work. Not because I had it figured out — but because I could not pretend I did not see it anymore.',
      'That moment changed everything.',
    ],
  },
  {
    paragraphs: [
      'My son made decisions I did not agree with. Choices I would not have made. A path I did not choose for him.',
      'For a long time, I thought that meant something was wrong.',
      'Looking back, I understand it differently. He did not need me to control his path. He needed me to respect it. To trust that who he is matters more than who I imagined he should be.',
      'That is a harder lesson than anything I have learned in a room.',
    ],
  },
  {
    paragraphs: [
      'By the time my daughter was born, I was not the same man.',
      'I had already started the work — learning how to listen without defending, how to be present without performing, how to create stability instead of reacting to chaos.',
      'She did not get the version of me that was still figuring it out. She got the version that had already started to change.',
      'That matters to me more than I can explain.',
    ],
  },
  {
    paragraphs: [
      'I train jiu-jitsu. Have for years.',
      'Most things in life can be faked — status, confidence, knowledge. On the mat, none of that holds. You either know the technique or you do not. You are either calm under pressure or you are not. Your ego either gets in the way or it does not.',
      'Jiu-jitsu is one of the few places where nothing performs. It forces honesty — about your limits, your reactions, and your mind under pressure.',
      'That is why I keep coming back.',
    ],
  },
  {
    paragraphs: [
      'I have spent years working in technology — infrastructure, systems, operations. But over time I realized that what I was actually doing was not technical.',
      'I was seeing patterns.',
      'The same broken dynamics that exist in a failing IT system exist in a failing organization. In a relationship. In a person who will not examine themselves. Once you learn to see the structure underneath the surface, you cannot unsee it.',
      'That is how I approach most things now. Not as problems to fix — but as systems to understand.',
    ],
  },
  {
    paragraphs: [
      'Right now I am building — AI systems, digital experiences, a book, a life that actually connects.',
      'Not to prove something. Not to perform.',
      'To understand and refine who I am becoming. To leave something behind that reflects how I actually think, not just what I accomplished.',
      'The projects matter. The work matters. But underneath all of it is one question I keep asking:',
    ],
    closing: 'Am I becoming the person I want my children to have known?',
    closingNote: 'That is the standard. Everything else is details.',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b]">
      <Navigation />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: 'min(70vh, 700px)' }}>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #111113 0%, #0d0d0f 40%, #111113 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(240,237,232,1) 1px, transparent 1px), linear-gradient(90deg, rgba(240,237,232,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 60% 40%, rgba(201,168,76,0.06) 0%, transparent 55%), linear-gradient(to bottom, transparent 50%, #0a0a0b 100%)',
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 z-10 max-w-[1280px] mx-auto px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.0, 0.0, 0.2, 1.0] }}
          >
            <p className="text-[0.6875rem] tracking-[0.35em] uppercase text-[#4a4845] mb-5">
              About
            </p>
            <h1
              className="font-[var(--font-display)] font-light leading-[0.9] tracking-[-0.03em] text-[#f0ede8]"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)' }}
            >
              Anibal
              <br />
              Cabral
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Prose */}
      <div className="max-w-[860px] mx-auto px-6 pb-40 mt-20">

        {SECTIONS.map((section, i) => (
          <div key={i}>
            <Reveal className="py-16">
              <div className="flex flex-col gap-6 max-w-[70ch]">
                {section.paragraphs.map((para, j) => (
                  <p
                    key={j}
                    className="text-[#7a7875] text-base leading-[1.95]"
                  >
                    {para}
                  </p>
                ))}
                {section.closing && (
                  <p
                    className="font-[var(--font-display)] text-[#f0ede8] leading-[1.3] tracking-[-0.01em] mt-4"
                    style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)' }}
                  >
                    {section.closing}
                  </p>
                )}
                {section.closingNote && (
                  <p className="text-[#7a7875] text-base leading-[1.95]">
                    {section.closingNote}
                  </p>
                )}
              </div>
            </Reveal>
            {i < SECTIONS.length - 1 && <Divider />}
          </div>
        ))}

        {/* Pull quote */}
        <Reveal className="py-24 flex justify-center">
          <p
            className="font-[var(--font-display)] text-[#c9a84c] italic leading-[1.15] tracking-[-0.01em] text-center"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
          >
            I become precise.
          </p>
        </Reveal>

        {/* Footer */}
        <div
          style={{ height: '1px', background: 'rgba(201,168,76,0.2)', marginBottom: '4rem' }}
        />
        <Reveal>
          <div className="flex flex-col sm:flex-row gap-8 sm:items-center justify-between">
            <p className="text-[#7a7875] text-sm leading-relaxed max-w-[40ch]">
              I read everything. I reply to what matters.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 text-sm text-[#7a7875] hover:text-[#c9a84c] transition-colors duration-200 border-b border-transparent hover:border-[#c9a84c] pb-0.5 w-fit"
            >
              Get in touch
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  )
}
