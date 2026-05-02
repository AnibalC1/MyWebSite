'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';

const POSTS = [
  {
    slug: 'systems-over-goals',
    title: 'Systems Over Goals',
    date: 'Apr 2026',
    excerpt: 'Goals are for planning. Systems are for living. The difference is what separates people who dream from people who build.',
    readTime: '6 min',
    featured: true,
  },
  {
    slug: 'what-bjj-taught-me',
    title: 'What BJJ Taught Me About Systems',
    date: 'Mar 2026',
    excerpt: 'On the mat, you cannot fake competence. The same is true in business, in relationships, and in the systems you build.',
    readTime: '8 min',
    featured: false,
  },
  {
    slug: 'raising-builders',
    title: 'Raising Builders, Not Consumers',
    date: 'Feb 2026',
    excerpt: 'My children will inherit the systems I build. Not just the money I make. That changes how I think about everything.',
    readTime: '5 min',
    featured: false,
  },
  {
    slug: 'the-cost-of-indecision',
    title: 'The Cost of Indecision',
    date: 'Jan 2026',
    excerpt: 'Every day you wait is a day someone else moves. The gap between intention and action is where most people live.',
    readTime: '4 min',
    featured: false,
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

export default function BlogPage() {
  const featured = POSTS.find(p => p.featured);
  const others = POSTS.filter(p => !p.featured);

  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <div className="max-w-[1280px] mx-auto px-6 pt-40 pb-32">
        <Reveal>
          <p className="text-[0.6875rem] tracking-[0.35em] uppercase mb-5" style={{ color: '#4a4845', fontFamily: 'var(--font-body)' }}>
            Writing
          </p>
          <h1
            className="font-light leading-[0.9] tracking-[-0.03em] mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(3rem, 8vw, 6rem)' }}
          >
            Thoughts on<br />Systems & Discipline
          </h1>
          <p className="text-base max-w-[55ch] leading-relaxed mb-16" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
            I write about what I am learning — not what I have mastered. These are working notes from someone building in public.
          </p>
        </Reveal>

        {featured && (
          <Reveal className="mb-16">
            <div
              className="relative overflow-hidden transition-all duration-500"
              style={{
                border: '1px solid var(--steel)',
                padding: '3rem',
                background: 'linear-gradient(135deg, rgba(201,168,76,0.03) 0%, transparent 60%)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-[0.55rem] uppercase tracking-widest px-2 py-0.5"
                  style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', fontFamily: 'var(--font-body)' }}
                >
                  Featured
                </span>
                <span className="text-xs" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                  {featured.date} · {featured.readTime} read
                </span>
              </div>
              <h2
                className="text-3xl font-light italic mb-4"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)' }}
              >
                {featured.title}
              </h2>
              <p className="text-sm leading-relaxed max-w-[60ch]" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                {featured.excerpt}
              </p>
            </div>
          </Reveal>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {others.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.08}>
              <div
                className="h-full"
                style={{
                  border: '1px solid var(--steel)',
                  padding: '2rem',
                  background: 'var(--graphite)',
                }}
              >
                <span className="text-xs mb-4 block" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                  {post.date} · {post.readTime}
                </span>
                <h3
                  className="text-xl font-light italic mb-3"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)' }}
                >
                  {post.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                  {post.excerpt}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
