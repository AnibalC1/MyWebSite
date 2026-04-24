'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navigation from '@/components/layout/Navigation'
import { MemoryNode, NodeCategory, CATEGORY_COLORS, deriveConnections } from '@/lib/nodes'
import rawNodes from '@/data/nodes.json'

const nodes = rawNodes as MemoryNode[]

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  systems:    'Systems',
  family:     'Family',
  bjj:        'BJJ',
  business:   'Business',
  reflection: 'Reflection',
  builds:     'Builds',
  fitness:    'Fitness',
  writing:    'Writing',
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as NodeCategory[]

function NodeCard({ node, onClick }: { node: MemoryNode; onClick: () => void }) {
  const color = CATEGORY_COLORS[node.category] ?? '#c9a96e'
  const date = new Date(node.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short',
  })

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="text-left w-full group"
      style={{
        background: 'var(--graphite)',
        border: '1px solid var(--steel)',
        padding: '28px',
        cursor: 'pointer',
        transition: 'border-color 300ms',
      }}
      whileHover={{ borderColor: color }}
    >
      {/* Color bar */}
      <div style={{ height: '2px', background: color, marginBottom: '20px', opacity: 0.8 }} />

      {/* Category + date */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[0.65rem] uppercase tracking-[0.2em]"
          style={{ color, fontFamily: 'var(--font-body)' }}
        >
          {CATEGORY_LABELS[node.category]}
        </span>
        <span
          className="text-[0.65rem] tracking-wide"
          style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}
        >
          {date}
        </span>
      </div>

      {/* Title */}
      <h3
        className="text-xl font-light italic leading-tight mb-3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)' }}
      >
        {node.title}
      </h3>

      {/* Excerpt */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}
      >
        {node.excerpt}
      </p>

      {/* Emotional tag */}
      {node.emotionalTag && (
        <div className="mt-5">
          <span
            className="text-[0.6rem] uppercase tracking-widest px-2 py-1"
            style={{
              border: `1px solid ${color}40`,
              color: `${color}cc`,
              fontFamily: 'var(--font-body)',
            }}
          >
            {node.emotionalTag}
          </span>
        </div>
      )}
    </motion.button>
  )
}

function DetailPanel({
  node,
  related,
  onClose,
  onSelect,
}: {
  node: MemoryNode
  related: MemoryNode[]
  onClose: () => void
  onSelect: (n: MemoryNode) => void
}) {
  const color = CATEGORY_COLORS[node.category] ?? '#c9a96e'
  const date = new Date(node.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: 'rgba(10,10,11,0.6)', backdropFilter: 'blur(4px)' }}
      />
      <motion.div
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col overflow-y-auto"
        style={{ background: 'var(--graphite)', borderLeft: '1px solid var(--steel)' }}
      >
        <div style={{ height: '2px', background: color, flexShrink: 0 }} />

        <div className="p-8 flex-1">
          <button
            onClick={onClose}
            className="mb-8 text-xs uppercase tracking-widest hover:opacity-100 transition-opacity"
            style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', opacity: 0.5 }}
          >
            ← Close
          </button>

          <div className="text-xs uppercase tracking-widest mb-3" style={{ color, fontFamily: 'var(--font-body)' }}>
            {CATEGORY_LABELS[node.category]}
          </div>

          <h2
            className="text-3xl font-light italic leading-tight mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)' }}
          >
            {node.title}
          </h2>

          <p className="text-sm mb-6" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
            {date}{node.location ? ` · ${node.location}` : ''}
          </p>

          <div style={{ height: '1px', background: 'var(--steel)', marginBottom: '24px' }} />

          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
            {node.excerpt}
          </p>

          {node.emotionalTag && (
            <span
              className="text-xs uppercase tracking-widest px-3 py-1.5"
              style={{ border: `1px solid ${color}40`, color: `${color}cc`, fontFamily: 'var(--font-body)' }}
            >
              {node.emotionalTag}
            </span>
          )}

          {related.length > 0 && (
            <div className="mt-10">
              <div style={{ height: '1px', background: 'var(--steel)', marginBottom: '20px' }} />
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
                Connected
              </p>
              <div className="flex flex-col gap-2">
                {related.slice(0, 4).map(r => (
                  <button
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className="text-left px-4 py-3 transition-colors"
                    style={{
                      background: 'var(--graphite-mid)',
                      border: '1px solid var(--steel)',
                      color: 'var(--warm-white)',
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                    }}
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function MemoryAtlasPage() {
  const [activeCategory, setActiveCategory] = useState<NodeCategory | 'all'>('all')
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null)
  const connections = useMemo(() => deriveConnections(nodes), [])

  const filtered = useMemo(() =>
    activeCategory === 'all' ? nodes : nodes.filter(n => n.category === activeCategory),
    [activeCategory]
  )

  const relatedNodes = useMemo(() => {
    if (!selectedNode) return []
    const ids = connections.get(selectedNode.id) ?? []
    return nodes.filter(n => ids.includes(n.id))
  }, [selectedNode, connections])

  const categories = ALL_CATEGORIES.filter(c => nodes.some(n => n.category === c))

  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      {/* Header */}
      <div className="max-w-[1280px] mx-auto px-6 pt-40 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[0.6875rem] tracking-[0.35em] uppercase mb-5" style={{ color: '#4a4845', fontFamily: 'var(--font-body)' }}>
            Memory Atlas
          </p>
          <h1
            className="font-light leading-[0.9] tracking-[-0.03em] mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(3rem, 8vw, 7rem)' }}
          >
            The Constellation
          </h1>
          <p className="text-base max-w-[55ch] leading-relaxed" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
            Every node is a moment, decision, or discipline that shaped the system. Click any to go deeper.
          </p>
        </motion.div>
      </div>

      {/* Category filters */}
      <div className="max-w-[1280px] mx-auto px-6 pb-12">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className="text-xs uppercase tracking-widest px-4 py-2 transition-all duration-200"
            style={{
              fontFamily: 'var(--font-body)',
              background: activeCategory === 'all' ? 'var(--gold)' : 'transparent',
              color: activeCategory === 'all' ? 'var(--obsidian)' : 'var(--warm-white-muted)',
              border: `1px solid ${activeCategory === 'all' ? 'var(--gold)' : 'var(--steel)'}`,
            }}
          >
            All
          </button>
          {categories.map(cat => {
            const color = CATEGORY_COLORS[cat]
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="text-xs uppercase tracking-widest px-4 py-2 transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: active ? color : 'transparent',
                  color: active ? 'var(--obsidian)' : color,
                  border: `1px solid ${active ? color : color + '50'}`,
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Node grid */}
      <div className="max-w-[1280px] mx-auto px-6 pb-32">
        <motion.div
          layout
          className="grid gap-px"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1px', background: 'var(--steel)' }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map(node => (
              <div key={node.id} style={{ background: 'var(--obsidian)' }}>
                <NodeCard node={node} onClick={() => setSelectedNode(node)} />
              </div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="py-24 text-center" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
            No nodes in this category yet.
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <DetailPanel
          node={selectedNode}
          related={relatedNodes}
          onClose={() => setSelectedNode(null)}
          onSelect={setSelectedNode}
        />
      )}
    </main>
  )
}
