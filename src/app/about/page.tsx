'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
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
      style={{ height: '1px', background: 'rgba(201,168,76,0.2)' }}
    />
  )
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b]">
      <Navigation />

      {/* Hero — portrait */}
      <div className="relative overflow-hidden" style={{ height: 'min(85vh, 820px)' }}>
        <Image
          src="/images/photo-oq31-family-selfie.jpg"
          alt="Anibal Cabral"
          fill
          priority
          className="object-cover object-top"
          style={{ filter: 'brightness(0.55)' }}
        />
        {/* Gold gradient overlay */}
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

        {/* Section 1 — Opening */}
        <Reveal className="py-16">
          <div className="flex flex-col gap-6 max-w-[70ch]">
            <p className="text-[#7a7875] text-base leading-[1.95]">I am not a finished thing.</p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              I am a man in the middle of becoming — building systems, raising children, training my body, and learning, slowly, to align how I live with who I actually am.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">That work is never finished. That is the point.</p>
          </div>
        </Reveal>

        <Divider />

        {/* Section 2 — Fatherhood */}
        <Reveal className="py-16">
          <div className="flex flex-col gap-6 max-w-[70ch]">
            <p className="text-[#7a7875] text-base leading-[1.95]">
              There was a point where I had to look at myself honestly — not as a man with intentions, but as a father with a record.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              I saw what my reactions were doing. I saw the gap between who I thought I was and how I was actually showing up. Intention was not enough. Awareness without change is just self-flattery.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              So I started the work. Not because I had it figured out — but because I could not pretend I did not see it anymore. That moment changed everything.
            </p>
          </div>
        </Reveal>

        {/* Family photo */}
        <Reveal className="pb-16">
          <div className="relative overflow-hidden" style={{ height: '400px' }}>
            <Image
              src="/images/photo-0afl-birthday-family.jpg"
              alt="Anibal with family at a celebration"
              fill
              className="object-cover"
              style={{ filter: 'brightness(0.8)' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,10,11,0.4) 0%, transparent 60%)' }}
            />
          </div>
        </Reveal>

        <Divider />

        {/* Section 3 — Son */}
        <Reveal className="py-16">
          <div className="flex flex-col gap-6 max-w-[70ch]">
            <p className="text-[#7a7875] text-base leading-[1.95]">
              My son made decisions I did not agree with. Choices I would not have made. A path I did not choose for him.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">For a long time, I thought that meant something was wrong.</p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              Looking back, I understand it differently. He did not need me to control his path. He needed me to respect it. To trust that who he is matters more than who I imagined he should be.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">That is a harder lesson than anything I have learned in a room.</p>
          </div>
        </Reveal>

        <Divider />

        {/* Section 4 — Daughter */}
        <Reveal className="py-16">
          <div className="flex flex-col gap-6 max-w-[70ch]">
            <p className="text-[#7a7875] text-base leading-[1.95]">By the time my daughter was born, I was not the same man.</p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              I had already started the work — learning how to listen without defending, how to be present without performing, how to create stability instead of reacting to chaos.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              She did not get the version of me that was still figuring it out. She got the version that had already started to change. That matters to me more than I can explain.
            </p>
          </div>
        </Reveal>

        <Divider />

        {/* Section 5 — BJJ */}
        <Reveal className="py-16">
          <div className="flex flex-col gap-6 max-w-[70ch]">
            <p className="text-[#7a7875] text-base leading-[1.95]">I train jiu-jitsu. Have for years.</p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              Most things in life can be faked — status, confidence, knowledge. On the mat, none of that holds. You either know the technique or you do not. You are either calm under pressure or you are not.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              Jiu-jitsu is one of the few places where nothing performs. It forces honesty — about your limits, your reactions, and your mind under pressure. That is why I keep coming back.
            </p>
          </div>
        </Reveal>

        {/* BJJ photo */}
        <Reveal className="pb-16">
          <div className="relative overflow-hidden" style={{ height: '480px' }}>
            <Image
              src="/images/photo-3wun-BJJ.jpg"
              alt="Anibal training jiu-jitsu"
              fill
              className="object-cover object-center"
              style={{ filter: 'brightness(0.85)' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,10,11,0.5) 0%, transparent 50%)' }}
            />
          </div>
        </Reveal>

        <Divider />

        {/* Section 6 — Work */}
        <Reveal className="py-16">
          <div className="flex flex-col gap-6 max-w-[70ch]">
            <p className="text-[#7a7875] text-base leading-[1.95]">
              I have spent years working in technology — infrastructure, systems, operations. But over time I realized that what I was actually doing was not technical.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">I was seeing patterns.</p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              The same broken dynamics that exist in a failing IT system exist in a failing organization. In a relationship. In a person who will not examine themselves. Once you learn to see the structure underneath the surface, you cannot unsee it.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              That is how I approach most things now. Not as problems to fix — but as systems to understand.
            </p>
          </div>
        </Reveal>

        <Divider />

        {/* Section 7 — Present */}
        <Reveal className="py-16">
          <div className="flex flex-col gap-6 max-w-[70ch]">
            <p className="text-[#7a7875] text-base leading-[1.95]">
              Right now I am building — AI systems, digital experiences, a book, a life that actually connects. Not to prove something. Not to perform.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              To understand and refine who I am becoming. To leave something behind that reflects how I actually think, not just what I accomplished.
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">
              The projects matter. The work matters. But underneath all of it is one question I keep asking:
            </p>
            <p
              className="font-[var(--font-display)] text-[#f0ede8] leading-[1.3] tracking-[-0.01em] mt-4"
              style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)' }}
            >
              Am I becoming the person I want my children to have known?
            </p>
            <p className="text-[#7a7875] text-base leading-[1.95]">That is the standard. Everything else is details.</p>
          </div>
        </Reveal>

        {/* Pull quote */}
        <Reveal className="py-24 flex justify-center">
          <p
            className="font-[var(--font-display)] text-[#c9a84c] italic leading-[1.15] tracking-[-0.01em] text-center"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
          >
            I become precise.
          </p>
        </Reveal>

        <div style={{ height: '1px', background: 'rgba(201,168,76,0.2)', marginBottom: '4rem' }} />

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
