'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import LogoSpin from '@/components/LogoSpin';
import Footer from '@/components/layout/Footer';

const FIRST = 'ANIBAL';
const LAST = 'CABRAL';

const HERO_VIDEOS = [
  '/video/hero-1.mp4',
  '/video/hero-2.mp4',
  '/video/hero-3.mp4',
  '/video/hero-4.mp4',
  '/video/hero-5.mp4',
];

const LATEST_POSTS = [
  {
    slug: 'systems-thinking',
    title: 'Why Systems Thinking Is the Only Competitive Advantage Left',
    date: '2026-04-15',
    excerpt: 'In a world where everyone has access to the same tools, the differentiator is how you combine them.',
    tag: 'Strategy',
  },
  {
    slug: 'bjj-startup',
    title: 'What Brazilian Jiu-Jitsu Taught Me About Building Companies',
    date: '2026-03-22',
    excerpt: 'The mat is a laboratory for decision-making under pressure. Every choke is a lesson in resource allocation.',
    tag: 'Leadership',
  },
  {
    slug: 'ai-automation',
    title: 'The 10x Engineer Is Dead. Long Live the 10x System.',
    date: '2026-02-10',
    excerpt: 'Stop hiring for heroics. Start architecting for leverage.',
    tag: 'Engineering',
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
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

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

export default function Home() {
  const [ready, setReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoSrc(HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)]);
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* ── HERO SECTION ── */}
      <main
        style={{
          position: 'relative',
          height: '100vh',
          background: '#000',
          overflow: 'hidden',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      >
        {/* Video background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 2.5, ease: 'easeInOut' }}
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
              opacity: 0.38,
              filter: 'grayscale(20%) contrast(1.05)',
            }}
          >
            {videoSrc && <source src={videoSrc} type="video/mp4" />}
          </video>
        </motion.div>

        {/* Multi-layer dark overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: [
            'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
            'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.65) 100%)',
          ].join(', '),
        }} />

        {/* Grain */}
        <div className="grain-overlay" aria-hidden style={{ zIndex: 2 }} />

        {/* Scanlines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
          pointerEvents: 'none',
        }} />

        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6, duration: 1.0, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.6rem 2.8rem',
            pointerEvents: 'none',
          }}
        >
          <Link href="/" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', height: '180px', display: 'inline-block' }}>
              <img
                src="/logo.png"
                alt=""
                aria-hidden
                className="logo-inner-spin"
                style={{
                  position: 'absolute', top: 0, left: 0,
                  height: '180px', width: 'auto',
                  clipPath: 'circle(21% at 50% 46%)',
                  filter: 'drop-shadow(0 0 14px rgba(201,168,76,0.9))',
                }}
              />
              <img
                src="/logo.png"
                alt="Anibal Cabral"
                style={{
                  height: '180px', width: 'auto',
                  position: 'relative', zIndex: 1,
                  filter: 'drop-shadow(0 0 10px rgba(201,168,76,0.5))',
                  WebkitMaskImage: 'radial-gradient(circle 21% at 50% 46%, transparent 95%, black 100%)',
                  maskImage: 'radial-gradient(circle 21% at 50% 46%, transparent 95%, black 100%)',
                }}
              />
            </div>
          </Link>
          <div style={{ display: 'flex', gap: '2.4rem', pointerEvents: 'auto' }}>
            {[
              { label: 'Gallery', href: '/gallery' },
              { label: 'Videos', href: '/videos' },
              { label: 'About', href: '/about' },
              { label: 'Blog', href: '/blog' },
              { label: 'Fitness', href: '/fitness' },
              { label: 'Builds', href: '/builds' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.68rem',
                  letterSpacing: '0.22em',
                  color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  transition: 'color 0.3s ease',
                }}
                onMouseOver={e => (e.currentTarget.style.color = '#c9a84c')}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                {label}
              </Link>
            ))}
          </div>
        </motion.nav>

        {/* Hero center block */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 0,
          textAlign: 'center',
          padding: '170px 2rem 2rem',
          userSelect: 'none',
        }}>
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.6em' }}
            animate={{ opacity: 1, letterSpacing: '0.32em' }}
            transition={{ delay: 0.6, duration: 1.4, ease: 'easeOut' }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(0.55rem, 1.2vw, 0.72rem)',
              letterSpacing: '0.32em',
              color: '#c9a84c',
              textTransform: 'uppercase',
              marginBottom: '2.4rem',
              opacity: 0.85,
            }}
          >
            Father · Builder · Martial Artist
          </motion.p>

          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 300,
            fontSize: 'clamp(2.8rem, 7vw, 6.5rem)',
            lineHeight: 0.88,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            marginBottom: '0',
          }}>
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
              background: 'linear-gradient(to right, transparent, #c9a84c, transparent)',
              margin: '2.2rem 0 2.0rem',
              transformOrigin: 'center',
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(1rem, 2.2vw, 1.5rem)',
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.04em',
              lineHeight: 1.6,
              maxWidth: '560px',
              marginBottom: '3rem',
            }}
          >
            Every system I design, every discipline I build —<br />
            it is all for this table.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.0, duration: 1.0, ease: 'easeOut' }}
          >
            <Link
              href="#content"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.8rem',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.68rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                textDecoration: 'none',
                border: '1px solid rgba(201,168,76,0.3)',
                padding: '0.85rem 2.2rem',
                transition: 'all 0.4s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseOver={e => {
                e.currentTarget.style.color = '#c9a84c';
                e.currentTarget.style.borderColor = '#c9a84c';
                e.currentTarget.style.background = 'rgba(201,168,76,0.06)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Enter the Constellation
              <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>→</span>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ delay: 3.8, duration: 2.0, repeat: Infinity, repeatDelay: 1.5 }}
          style={{
            position: 'absolute',
            bottom: '2.4rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            width: '1px',
            height: '40px',
            background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.5))',
          }} />
        </motion.div>
      </main>

      {/* ── SCROLLABLE CONTENT BELOW ── */}
      <div id="content" style={{ background: 'var(--obsidian)', position: 'relative', zIndex: 5 }}>

        {/* Social Proof / Stats */}
        <section className="max-w-[1280px] mx-auto px-6 py-32">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            <Reveal>
              <div className="flex flex-col gap-3">
                <span className="font-light tracking-[-0.03em]" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--gold)' }}>
                  8+
                </span>
                <span className="text-[0.7rem] uppercase tracking-[0.2em]" style={{ color: 'var(--warm-white)', fontFamily: 'var(--font-body)' }}>
                  Years on the Mat
                </span>
                <p className="text-sm leading-relaxed max-w-[32ch]" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                  BJJ is the filter that makes every other discipline sharper.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex flex-col gap-3">
                <span className="font-light tracking-[-0.03em]" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--gold)' }}>
                  3
                </span>
                <span className="text-[0.7rem] uppercase tracking-[0.2em]" style={{ color: 'var(--warm-white)', fontFamily: 'var(--font-body)' }}>
                  Systems Live
                </span>
                <p className="text-sm leading-relaxed max-w-[32ch]" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                  Production-grade arbitrage bots, memory systems, and path validators.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex flex-col gap-3">
                <span className="font-light tracking-[-0.03em]" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--gold)' }}>
                  ∞
                </span>
                <span className="text-[0.7rem] uppercase tracking-[0.2em]" style={{ color: 'var(--warm-white)', fontFamily: 'var(--font-body)' }}>
                  Iterations
                </span>
                <p className="text-sm leading-relaxed max-w-[32ch]" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                  Every failure is a data point. Every system is a hypothesis tested under pressure.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-[1280px] mx-auto px-6">
          <div style={{ height: '1px', background: 'rgba(201,168,76,0.1)' }} />
        </div>

        {/* Latest Writing */}
        <section className="max-w-[860px] mx-auto px-6 py-32">
          <Reveal>
            <p className="text-[0.6875rem] tracking-[0.35em] uppercase mb-5" style={{ color: 'var(--gold-subtle)', fontFamily: 'var(--font-body)' }}>
              Latest Writing
            </p>
            <h2
              className="font-light leading-[0.9] tracking-[-0.03em] mb-16"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
            >
              Ideas that survived execution
            </h2>
          </Reveal>

          <div className="flex flex-col gap-0">
            {LATEST_POSTS.map((post, i) => (
              <Reveal key={post.slug} delay={i * 0.08}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block py-10 border-t"
                  style={{ borderColor: 'rgba(201,168,76,0.1)' }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className="text-[0.6rem] uppercase tracking-[0.2em] px-3 py-1"
                      style={{
                        background: 'rgba(201,168,76,0.08)',
                        color: 'var(--gold)',
                        fontFamily: 'var(--font-body)',
                        borderRadius: '2px',
                      }}
                    >
                      {post.tag}
                    </span>
                    <span className="text-[0.65rem] tracking-[0.15em] uppercase" style={{ color: 'var(--steel)', fontFamily: 'var(--font-body)' }}>
                      {post.date}
                    </span>
                  </div>
                  <h3
                    className="font-light leading-[1.1] tracking-[-0.02em] mb-3 transition-colors duration-300 group-hover:text-[var(--gold)]"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)' }}
                  >
                    {post.title}
                  </h3>
                  <p className="text-sm leading-relaxed max-w-[55ch]" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                    {post.excerpt}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="mt-12">
              <Link
                href="/blog"
                className="inline-flex items-center gap-3 text-sm transition-colors duration-200 border-b border-transparent hover:border-[var(--gold)] pb-0.5"
                style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--warm-white-muted)')}
              >
                Read all essays
                <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Newsletter CTA */}
        <section className="max-w-[1280px] mx-auto px-6 py-32">
          <Reveal>
            <div
              className="max-w-[720px] mx-auto text-center py-24 px-8"
              style={{
                background: 'var(--graphite)',
                border: '1px solid var(--steel)',
              }}
            >
              <p
                className="text-[0.6875rem] tracking-[0.35em] uppercase mb-6"
                style={{ color: 'var(--gold-subtle)', fontFamily: 'var(--font-body)' }}
              >
                Newsletter
              </p>
              <h2
                className="font-light leading-[1.1] tracking-[-0.02em] mb-6"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
              >
                Systems, not hype
              </h2>
              <p
                className="text-base leading-relaxed mb-10 max-w-[50ch] mx-auto"
                style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}
              >
                No growth hacks. No frameworks. Just what I am learning about building systems that hold up under real pressure.
              </p>
              <form
                action="https://buttondown.email/api/emails/embed-subscribe/anibalcabral"
                method="post"
                target="_blank"
                className="flex flex-col sm:flex-row gap-3 justify-center max-w-[440px] mx-auto"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="flex-1"
                  style={{
                    background: 'var(--obsidian)',
                    border: '1px solid var(--steel)',
                    color: 'var(--warm-white)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.85rem',
                    padding: '12px 14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="text-[0.65rem] uppercase tracking-[0.15em] px-6 py-3 transition-all duration-200"
                  style={{
                    background: 'var(--gold)',
                    color: 'var(--obsidian)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Subscribe
                </button>
              </form>
            </div>
          </Reveal>
        </section>

        <Footer />
      </div>
    </>
  );
}
