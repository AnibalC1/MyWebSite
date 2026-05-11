'use client';

import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';

const POSTS = [
  {
    slug: 'systems-thinking',
    title: 'Why Systems Thinking Is the Only Competitive Advantage Left',
    date: '2026 — 04 — 15',
    excerpt: 'In a world where everyone has access to the same tools, the differentiator is how you combine them. Systems thinking is the multiplier.',
    tag: 'Strategy',
    readTime: '6 min read',
  },
  {
    slug: 'bjj-startup',
    title: 'What Brazilian Jiu-Jitsu Taught Me About Building Companies',
    date: '2026 — 03 — 22',
    excerpt: 'The mat is a laboratory for decision-making under pressure. Every choke is a lesson in resource allocation.',
    tag: 'Leadership',
    readTime: '8 min read',
  },
  {
    slug: 'ai-automation',
    title: 'The 10x Engineer Is Dead. Long Live the 10x System.',
    date: '2026 — 02 — 10',
    excerpt: 'Stop hiring for heroics. Start architecting for leverage. The best engineers today are systems architects, not code monkeys.',
    tag: 'Engineering',
    readTime: '5 min read',
  },
  {
    slug: 'fatherhood-focus',
    title: 'Fatherhood Forced Me to Become Ruthless With My Time',
    date: '2026 — 01 — 05',
    excerpt: 'Kids do not negotiate. They demand presence. And that demand became the filter that transformed every decision I make.',
    tag: 'Life',
    readTime: '4 min read',
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <PageHero
        eyebrow="The Journal"
        eyebrowIndex="04"
        title="Essays on systems, leadership and craft."
        lede="Writing forces clarity. These are the ideas that have survived the filter of execution."
      />

      <section className="container-content" style={{ paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}>
        <div className="flex flex-col">
          {POSTS.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.06}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block py-12"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">
                  <div className="md:col-span-3 flex flex-col gap-2">
                    <span className="caption" style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-subtle)' }}>
                      {post.date}
                    </span>
                    <span className="caption" style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      {post.readTime}
                    </span>
                    <span className="tag mt-3 self-start">{post.tag}</span>
                  </div>

                  <div className="md:col-span-9">
                    <h2 className="h2 mb-4" style={{ maxWidth: '24ch', transition: 'color 300ms' }}>
                      <span className="group-hover:text-[var(--gold)] transition-colors duration-300">
                        {post.title}
                      </span>
                    </h2>
                    <p className="body-lg" style={{ maxWidth: '64ch' }}>{post.excerpt}</p>
                    <span
                      className="caption mt-6 inline-flex items-center gap-2"
                      style={{ letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.7 }}
                    >
                      Read essay <span aria-hidden>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
          <div style={{ borderTop: '1px solid var(--border)' }} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
