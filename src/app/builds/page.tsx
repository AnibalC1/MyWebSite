'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

const BUILDS = [
  {
    id: 'arb-liquidation-bot',
    name: 'Arb Liquidation Bot',
    tagline: 'On-chain liquidation engine for Aave V3 on Arbitrum.',
    status: 'live' as const,
    year: '2026',
    tags: ['DeFi', 'Solidity', 'Node.js', 'Arbitrum'],
    description: 'Automated liquidation system monitoring health factors across Aave V3 positions. Executes flash-loan liquidations with sub-block latency.',
    stack: ['Solidity', 'Node.js', 'Redpanda', 'Docker', 'Arbitrum One'],
    repoUrl: 'https://github.com/AnibalC1',
    demoUrl: null,
  },
  {
    id: 'relational-memory-system',
    name: 'Relational Memory System',
    tagline: 'AI-powered memory and context engine across conversations.',
    status: 'live' as const,
    year: '2026',
    tags: ['AI', 'NLP', 'PostgreSQL', 'Claude'],
    description: 'Context-aware memory layer built on top of Claude. Distills, indexes, and retrieves personal and operational knowledge across long-running agent sessions.',
    stack: ['Claude API', 'PostgreSQL', 'Node.js', 'Vector Embeddings'],
    repoUrl: 'https://github.com/AnibalC1',
    demoUrl: null,
  },
  {
    id: 'path-bridge',
    name: 'Path Bridge',
    tagline: 'Real-time DEX arbitrage path validator.',
    status: 'live' as const,
    year: '2025',
    tags: ['DeFi', 'MEV', 'Node.js', 'Kafka'],
    description: 'High-frequency path validation service sitting between quote aggregation and execution. Filters phantom arb paths before capital hits the chain.',
    stack: ['Node.js', 'Redpanda/Kafka', 'Alchemy RPC', 'Docker'],
    repoUrl: 'https://github.com/AnibalC1',
    demoUrl: null,
  },
]

const STATUS_COLOR = {
  live: '#7ec9b8',
  building: '#c9a84c',
  archived: '#7a7875',
}

export default function BuildsPage() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <div className="max-w-[1280px] mx-auto px-6 pt-40 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[0.6875rem] tracking-[0.35em] uppercase mb-5" style={{ color: '#4a4845', fontFamily: 'var(--font-body)' }}>
            Builds
          </p>
          <h1
            className="font-light leading-[0.9] tracking-[-0.03em] mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(3rem, 8vw, 7rem)' }}
          >
            What I Ship
          </h1>
          <p className="text-base max-w-[55ch] leading-relaxed" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
            Not demos. Not concepts. Systems that run, execute, and hold up under pressure.
          </p>
        </motion.div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-32">
        {/* Table header */}
        <div
          className="grid text-[0.6rem] uppercase tracking-widest pb-4 mb-1"
          style={{
            gridTemplateColumns: '1fr 120px 80px',
            color: 'var(--warm-white-muted)',
            fontFamily: 'var(--font-body)',
            borderBottom: '1px solid var(--steel)',
          }}
        >
          <span>Project</span>
          <span>Stack</span>
          <span className="text-right">Year</span>
        </div>

        {BUILDS.map((build, i) => (
          <motion.div
            key={build.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setHovered(build.id)}
            onMouseLeave={() => setHovered(null)}
            className="grid py-8 cursor-pointer transition-all duration-300"
            style={{
              gridTemplateColumns: '1fr 120px 80px',
              borderBottom: '1px solid var(--steel)',
              opacity: hovered && hovered !== build.id ? 0.4 : 1,
            }}
          >
            <div className="pr-8">
              <div className="flex items-center gap-3 mb-2">
                <h2
                  className="text-2xl font-light italic"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)' }}
                >
                  {build.name}
                </h2>
                <span
                  className="text-[0.55rem] uppercase tracking-widest px-2 py-0.5"
                  style={{
                    border: `1px solid ${STATUS_COLOR[build.status]}50`,
                    color: STATUS_COLOR[build.status],
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {build.status}
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-[60ch]" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                {build.description}
              </p>
              <div className="flex gap-4 mt-4">
                {build.repoUrl && (
                  <a
                    href={build.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.65rem] uppercase tracking-[0.15em] transition-colors duration-200"
                    style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--warm-white-muted)')}
                  >
                    View on GitHub ↗
                  </a>
                )}
                {build.demoUrl && (
                  <a
                    href={build.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.65rem] uppercase tracking-[0.15em] transition-colors duration-200"
                    style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--warm-white-muted)')}
                  >
                    Live Demo ↗
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 content-start pt-1">
              {build.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[0.6rem] uppercase tracking-wide px-2 py-0.5"
                  style={{
                    background: 'var(--graphite-mid)',
                    border: '1px solid var(--steel)',
                    color: 'var(--warm-white-muted)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="text-right">
              <span
                className="text-sm"
                style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}
              >
                {build.year}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-24">
        <div style={{ height: '1px', background: 'rgba(201,168,76,0.2)', marginBottom: '32px' }} />
        <p className="text-sm" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
          More coming. I build continuously.{' '}
          <Link href="/contact" className="underline hover:opacity-80 transition-opacity">
            If you want to build something, reach out.
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  )
}
