'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';

const BUILDS = [
  {
    id: 'arb-liquidation-bot',
    name: 'Arb Liquidation Bot',
    tagline: 'On-chain liquidation engine for Aave V3 on Arbitrum.',
    status: 'live' as const,
    year: '2026',
    tags: ['DeFi', 'Solidity', 'Node.js', 'Arbitrum'],
    description: 'Automated liquidation system monitoring health factors across Aave V3 positions. Executes flash-loan liquidations with sub-block latency.',
    repoUrl: 'https://github.com/AnibalC1',
    demoUrl: null as string | null,
  },
  {
    id: 'relational-memory-system',
    name: 'Relational Memory System',
    tagline: 'AI-powered memory and context engine across conversations.',
    status: 'live' as const,
    year: '2026',
    tags: ['AI', 'NLP', 'PostgreSQL', 'Claude'],
    description: 'Context-aware memory layer built on top of Claude. Distills, indexes, and retrieves personal and operational knowledge across long-running agent sessions.',
    repoUrl: 'https://github.com/AnibalC1',
    demoUrl: null as string | null,
  },
  {
    id: 'path-bridge',
    name: 'Path Bridge',
    tagline: 'Real-time DEX arbitrage path validator.',
    status: 'live' as const,
    year: '2025',
    tags: ['DeFi', 'MEV', 'Node.js', 'Kafka'],
    description: 'High-frequency path validation service sitting between quote aggregation and execution. Filters phantom arb paths before capital hits the chain.',
    repoUrl: 'https://github.com/AnibalC1',
    demoUrl: null as string | null,
  },
];

const STATUS_COLOR = {
  live: '#7ec9b8',
  building: '#c9a84c',
  archived: '#7a7875',
};

export default function BuildsPage() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <PageHero
        eyebrow="Builds"
        eyebrowIndex="06"
        title="What I ship."
        lede="Not demos. Not concepts. Systems that run, execute, and hold up under pressure."
      />

      <section className="container-wide" style={{ paddingBottom: 'clamp(4rem, 8vw, 6rem)' }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: '1fr 140px 80px',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-strong)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.62rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--gold-subtle)',
          }}
        >
          <span>Project</span>
          <span className="hidden md:block">Stack</span>
          <span className="text-right">Year</span>
        </div>

        {BUILDS.map((build, i) => (
          <Reveal key={build.id} delay={i * 0.05}>
            <div
              onMouseEnter={() => setHovered(build.id)}
              onMouseLeave={() => setHovered(null)}
              className="grid py-10 transition-all duration-300"
              style={{
                gridTemplateColumns: '1fr 140px 80px',
                borderBottom: '1px solid var(--border)',
                opacity: hovered && hovered !== build.id ? 0.35 : 1,
              }}
            >
              <div className="pr-6 md:pr-10">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <Eyebrow plain>
                    <span style={{ color: 'var(--gold-subtle)' }}>0{i + 1}</span>
                  </Eyebrow>
                  <span
                    className="caption"
                    style={{
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: STATUS_COLOR[build.status],
                      border: `1px solid ${STATUS_COLOR[build.status]}40`,
                      padding: '0.18rem 0.5rem',
                      fontSize: '0.58rem',
                    }}
                  >
                    {build.status}
                  </span>
                </div>
                <h2 className="h2 mb-3" style={{ fontStyle: 'italic' }}>{build.name}</h2>
                <p className="body" style={{ fontSize: '0.92rem', maxWidth: '60ch' }}>
                  {build.description}
                </p>
                <div className="flex gap-6 mt-5 flex-wrap">
                  {build.repoUrl && (
                    <a
                      href={build.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="caption link-inline"
                      style={{ letterSpacing: '0.22em', textTransform: 'uppercase' }}
                    >
                      View on GitHub ↗
                    </a>
                  )}
                  {build.demoUrl && (
                    <a
                      href={build.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="caption link-inline"
                      style={{ letterSpacing: '0.22em', textTransform: 'uppercase' }}
                    >
                      Live demo ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="hidden md:flex flex-wrap gap-1 content-start pt-1">
                {build.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.58rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--warm-white-muted)',
                      padding: '0.18rem 0.5rem',
                      border: '1px solid var(--steel)',
                      background: 'var(--graphite-mid)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-right">
                <span className="caption" style={{ color: 'var(--warm-white-muted)', fontSize: '0.92rem' }}>
                  {build.year}
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="container-wide section-tight">
        <div className="hairline mb-10" />
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
          <p className="body" style={{ maxWidth: '46ch' }}>
            More coming. I build continuously. If you want to build something, reach out.
          </p>
          <Link href="/contact" className="btn btn-secondary">
            Start a conversation <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
