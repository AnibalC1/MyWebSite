'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Reveal from '@/components/ui/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';
import StatsRow from '@/components/ui/StatsRow';

const FIRST = 'ANIBAL';
const LAST = 'CABRAL';

const HERO_VIDEOS = [
  '/video/hero-1.mp4',
  '/video/hero-2.mp4',
  '/video/hero-3.mp4',
  '/video/hero-4.mp4',
  '/video/hero-5.mp4',
];

const STATS = [
  { value: '8+', label: 'Years on the Mat', desc: 'BJJ is the filter that makes every other discipline sharper.' },
  { value: '3', label: 'Systems Live', desc: 'Production-grade arbitrage bots, memory systems, path validators.' },
  { value: '∞', label: 'Iterations', desc: 'Every failure is a data point. Every system is a hypothesis tested under pressure.' },
];

const LATEST_POSTS = [
  {
    slug: 'systems-thinking',
    title: 'Why Systems Thinking Is the Only Competitive Advantage Left',
    date: '2026 — 04',
    excerpt: 'In a world where everyone has access to the same tools, the differentiator is how you combine them.',
    tag: 'Strategy',
  },
  {
    slug: 'bjj-startup',
    title: 'What Brazilian Jiu-Jitsu Taught Me About Building Companies',
    date: '2026 — 03',
    excerpt: 'The mat is a laboratory for decision-making under pressure. Every choke is a lesson in resource allocation.',
    tag: 'Leadership',
  },
  {
    slug: 'ai-automation',
    title: 'The 10x Engineer Is Dead. Long Live the 10x System.',
    date: '2026 — 02',
    excerpt: 'Stop hiring for heroics. Start architecting for leverage.',
    tag: 'Engineering',
  },
];

const DISCIPLINES = [
  {
    eyebrow: '01',
    title: 'Builds',
    href: '/builds',
    body: 'On-chain liquidation engines, memory layers, arbitrage validators. Production systems running under real pressure.',
  },
  {
    eyebrow: '02',
    title: 'Writing',
    href: '/blog',
    body: 'Essays on systems, leadership, and craft. Ideas that have survived the filter of execution.',
  },
  {
    eyebrow: '03',
    title: 'The Mat',
    href: '/fitness',
    body: 'Eight years of Brazilian Jiu-Jitsu. A laboratory for honesty, pressure, and decision-making.',
  },
  {
    eyebrow: '04',
    title: 'Memory Atlas',
    href: '/memory-atlas',
    body: 'A constellation of moments, decisions, and disciplines that shaped the system underneath.',
  },
];

function SplitWord({ word, delay }: { word: string; delay: number }) {
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', lineHeight: 1 }}>
      {word.split('').map((ch, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', willChange: 'transform' }}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          transition={{
            delay: delay + i * 0.055,
            duration: 1.0,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Random video must be selected client-side to avoid SSR hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVideoSrc(HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)]);
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Navigation transparent large />

      {/* ── HERO ── */}
      <main
        style={{
          position: 'relative',
          height: '100vh',
          background: '#000',
          overflow: 'hidden',
          opacity: ready ? 1 : 0,
          transition: 'opacity 800ms ease',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.42,
              filter: 'grayscale(15%) contrast(1.08)',
            }}
          >
            {videoSrc && <source src={videoSrc} type="video/mp4" />}
          </video>
        </motion.div>

        {/* Multi-layer overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: [
              'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)',
              'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 70%, var(--obsidian) 100%)',
            ].join(', '),
          }}
        />
        <div className="grain-overlay" aria-hidden style={{ zIndex: 2 }} />
        <div className="scanlines absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} />

        {/* Hero center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '6rem 1.5rem 2rem',
            userSelect: 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: '2.2rem' }}
          >
            <Eyebrow plain>Father · Builder · Martial Artist</Eyebrow>
          </motion.div>

          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 'clamp(3rem, 9vw, 7.5rem)',
              lineHeight: 0.88,
              color: '#ffffff',
              letterSpacing: '-0.025em',
            }}
          >
            <div><SplitWord word={FIRST} delay={0.9} /></div>
            <div><SplitWord word={LAST} delay={1.3} /></div>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 2.2, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 'clamp(80px, 18vw, 220px)',
              height: '1px',
              background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
              margin: '2.4rem 0 2.2rem',
              transformOrigin: 'center',
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="lede"
            style={{
              color: 'rgba(241,237,230,0.7)',
              maxWidth: '560px',
              marginBottom: '2.5rem',
            }}
          >
            Every system I design, every discipline I build —<br />
            it is all for this table.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.0, duration: 1.0, ease: 'easeOut' }}
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <Link href="#content" className="btn btn-secondary">
              Enter the work <span aria-hidden>→</span>
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Get in touch
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0] }}
          transition={{ delay: 3.8, duration: 2.0, repeat: Infinity, repeatDelay: 1.5 }}
          style={{
            position: 'absolute',
            bottom: '2.4rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            width: '1px',
            height: '44px',
            background: 'linear-gradient(to bottom, transparent, var(--gold))',
          }} />
        </motion.div>
      </main>

      {/* ── CONTENT ── */}
      <div id="content" style={{ background: 'var(--obsidian)', position: 'relative', zIndex: 5 }}>

        {/* Stats */}
        <StatsRow stats={STATS} />

        {/* Disciplines grid */}
        <section className="container-wide section-tight">
          <div className="hairline-strong mb-16" />
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
              <div>
                <Eyebrow index="·">Four disciplines</Eyebrow>
                <h2 className="h2 mt-6" style={{ maxWidth: '18ch' }}>
                  One mind, examined from four angles.
                </h2>
              </div>
              <p className="body max-w-[42ch]">
                Code, prose, the mat, memory — each is a different room in the same house. Walk through any door.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--border)' }}>
            {DISCIPLINES.map((d, i) => (
              <Reveal key={d.title} delay={i * 0.06}>
                <Link
                  href={d.href}
                  className="group relative block h-full"
                  style={{
                    background: 'var(--obsidian)',
                    padding: '2.4rem 2rem 2.6rem',
                    transition: 'background 400ms var(--ease-luxury)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--graphite)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--obsidian)'; }}
                >
                  <span className="caption" style={{ letterSpacing: '0.3em', color: 'var(--gold-subtle)' }}>
                    {d.eyebrow}
                  </span>
                  <h3 className="h3 mt-6 mb-4" style={{ transition: 'color 300ms' }}>
                    {d.title}
                  </h3>
                  <p className="body" style={{ fontSize: '0.92rem' }}>{d.body}</p>
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      bottom: '1.6rem',
                      right: '1.6rem',
                      color: 'var(--gold)',
                      opacity: 0.55,
                      fontSize: '1.1rem',
                      transition: 'transform 400ms var(--ease-luxury), opacity 300ms',
                    }}
                    className="group-hover:opacity-100"
                  >
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Latest writing */}
        <section className="container-content section">
          <Reveal>
            <Eyebrow index="—">Latest writing</Eyebrow>
            <h2 className="h2 mt-6 mb-12" style={{ maxWidth: '16ch' }}>
              Ideas that survived execution.
            </h2>
          </Reveal>

          <div className="flex flex-col">
            {LATEST_POSTS.map((post, i) => (
              <Reveal key={post.slug} delay={i * 0.06}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block py-10"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <span className="tag">{post.tag}</span>
                    <span className="caption" style={{ letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                      {post.date}
                    </span>
                  </div>
                  <h3 className="h3 mb-3" style={{ transition: 'color 300ms', maxWidth: '24ch' }}>
                    <span className="group-hover:text-[var(--gold)] transition-colors duration-300">
                      {post.title}
                    </span>
                  </h3>
                  <p className="body" style={{ fontSize: '0.95rem', maxWidth: '60ch' }}>{post.excerpt}</p>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-14">
              <Link href="/blog" className="btn btn-secondary">
                Read all essays <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Newsletter */}
        <section className="container-wide section">
          <Reveal>
            <div
              className="mx-auto text-center"
              style={{
                maxWidth: '780px',
                padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 4rem)',
                background: 'linear-gradient(180deg, var(--graphite) 0%, var(--graphite-mid) 100%)',
                border: '1px solid var(--border)',
                position: 'relative',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0, left: '50%', transform: 'translateX(-50%)',
                  height: '1px', width: '120px',
                  background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
                }}
              />
              <Eyebrow plain>Newsletter</Eyebrow>
              <h2 className="h2 mt-6 mb-6" style={{ maxWidth: '20ch', marginInline: 'auto' }}>
                A letter when it is worth your time.
              </h2>
              <p className="body mb-10" style={{ maxWidth: '52ch', marginInline: 'auto' }}>
                No growth hacks. No frameworks. Just what I am learning about building systems that hold up under real pressure.
              </p>
              <form
                action="https://buttondown.email/api/emails/embed-subscribe/anibalcabral"
                method="post"
                target="_blank"
                className="flex flex-col sm:flex-row gap-3 justify-center"
                style={{ maxWidth: '460px', marginInline: 'auto' }}
              >
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="field"
                  style={{ flex: 1, background: 'var(--obsidian)' }}
                />
                <button type="submit" className="btn btn-primary">Subscribe</button>
              </form>
            </div>
          </Reveal>
        </section>

        <Footer />
      </div>
    </>
  );
}
