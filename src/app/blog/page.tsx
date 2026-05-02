'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Navigation from '@/components/layout/Navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

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

const POSTS = [
  {
    slug: 'systems-thinking',
    title: 'Why Systems Thinking Is the Only Competitive Advantage Left',
    date: '2026-04-15',
    excerpt: 'In a world where everyone has access to the same tools, the differentiator is how you combine them. Systems thinking is the multiplier.',
    tag: 'Strategy',
    readTime: '6 min',
  },
  {
    slug: 'bjj-startup',
    title: 'What Brazilian Jiu-Jitsu Taught Me About Building Companies',
    date: '2026-03-22',
    excerpt: 'The mat is a laboratory for decision-making under pressure. Every choke is a lesson in resource allocation.',
    tag: 'Leadership',
    readTime: '8 min',
  },
  {
    slug: 'ai-automation',
    title: 'The 10x Engineer Is Dead. Long Live the 10x System.',
    date: '2026-02-10',
    excerpt: 'Stop hiring for heroics. Start architecting for leverage. The best engineers today are systems architects, not code monkeys.',
    tag: 'Engineering',
    readTime: '5 min',
  },
  {
    slug: 'fatherhood-focus',
    title: 'Fatherhood Forced Me to Become Ruthless With My Time',
    date: '2026-01-05',
    excerpt: 'Kids do not negotiate. They demand presence. And that demand became the filter that transformed every decision I make.',
    tag: 'Life',
    readTime: '4 min',
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <div className="max-w-[720px] mx-auto px-6 pt-40 pb-32">
        <Reveal>
          <p className="text-[0.6875rem] tracking-[0.35em] uppercase mb-5" style={{ color: 'var(--gold-muted)', fontFamily: 'var(--font-body)' }}>
            Blog
          </p>
          <h1
            className="font-light leading-[0.9] tracking-[-0.03em] mb-8"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(3rem, 8vw, 6rem)' }}
          >
            Essays on systems, leadership and craft
          </h1>
          <p className="text-base leading-relaxed mb-20" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', maxWidth: '480px' }}>
            Writing forces clarity. These are the ideas that have survived the filter of execution.
          </p>
        </Reveal>

        <div className="flex flex-col gap-0">
          {POSTS.map((post, i) => (
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
                    {post.date} {post.readTime}
                  </span>
                </div>
                <h2
                  className="font-light leading-[1.1] tracking-[-0.02em] mb-3 transition-colors duration-300 group-hover:text-[var(--gold)]"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}
                >
                  {post.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', maxWidth: '560px' }}>
                  {post.excerpt}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
