'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';
import { MemoryNode, NodeCategory, CATEGORY_COLORS, deriveConnections } from '@/lib/nodes';
import rawNodes from '@/data/nodes.json';

const nodes = rawNodes as MemoryNode[];

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  systems:    'Systems',
  family:     'Family',
  bjj:        'BJJ',
  business:   'Business',
  reflection: 'Reflection',
  builds:     'Builds',
  fitness:    'Fitness',
  writing:    'Writing',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as NodeCategory[];

function NodeCard({ node, onClick }: { node: MemoryNode; onClick: () => void }) {
  const color = CATEGORY_COLORS[node.category] ?? '#c9a96e';
  const date = new Date(node.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short',
  });

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="text-left w-full group h-full"
      style={{
        background: 'var(--obsidian)',
        padding: '2rem 1.75rem',
        cursor: 'pointer',
        transition: 'background 300ms var(--ease-luxury)',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--graphite)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--obsidian)'; }}
    >
      <div style={{ height: '1px', background: color, marginBottom: '20px', opacity: 0.7, width: '32px' }} />

      <div className="flex items-center justify-between mb-5">
        <span
          className="caption"
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color,
          }}
        >
          {CATEGORY_LABELS[node.category]}
        </span>
        <span className="caption" style={{ fontSize: '0.62rem', letterSpacing: '0.14em' }}>
          {date}
        </span>
      </div>

      <h3
        className="h3 mb-3"
        style={{
          fontSize: '1.3rem',
          fontStyle: 'italic',
          lineHeight: 1.22,
        }}
      >
        {node.title}
      </h3>

      <p className="body" style={{ fontSize: '0.92rem' }}>{node.excerpt}</p>

      {node.emotionalTag && (
        <div className="mt-6">
          <span
            className="caption"
            style={{
              fontSize: '0.58rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              border: `1px solid ${color}40`,
              color: `${color}cc`,
              padding: '0.22rem 0.55rem',
            }}
          >
            {node.emotionalTag}
          </span>
        </div>
      )}
    </motion.button>
  );
}

function DetailPanel({
  node,
  related,
  onClose,
  onSelect,
}: {
  node: MemoryNode;
  related: MemoryNode[];
  onClose: () => void;
  onSelect: (n: MemoryNode) => void;
}) {
  const color = CATEGORY_COLORS[node.category] ?? '#c9a96e';
  const date = new Date(node.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: 'rgba(10,10,11,0.7)', backdropFilter: 'blur(6px)' }}
      />
      <motion.div
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg flex flex-col overflow-y-auto"
        style={{ background: 'var(--graphite)', borderLeft: '1px solid var(--border-strong)' }}
      >
        <div style={{ height: '2px', background: color, flexShrink: 0 }} />

        <div style={{ padding: '2.5rem clamp(1.75rem, 4vw, 2.5rem)' }} className="flex-1">
          <button
            onClick={onClose}
            className="caption mb-10 inline-flex items-center gap-2 link-inline"
            style={{ letterSpacing: '0.24em', textTransform: 'uppercase' }}
          >
            <span aria-hidden>←</span> Close
          </button>

          <Eyebrow plain>
            <span style={{ color }}>{CATEGORY_LABELS[node.category]}</span>
          </Eyebrow>

          <h2 className="h2 mt-6 mb-3" style={{ fontStyle: 'italic' }}>{node.title}</h2>

          <p className="caption mb-8" style={{ letterSpacing: '0.14em' }}>
            {date}{node.location ? ` · ${node.location}` : ''}
          </p>

          <div className="hairline mb-8" />

          <p className="body-lg mb-10">{node.excerpt}</p>

          {node.emotionalTag && (
            <span
              className="caption"
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                border: `1px solid ${color}40`,
                color: `${color}cc`,
                padding: '0.35rem 0.7rem',
              }}
            >
              {node.emotionalTag}
            </span>
          )}

          {related.length > 0 && (
            <div className="mt-12">
              <div className="hairline mb-6" />
              <Eyebrow plain>Connected</Eyebrow>
              <div className="flex flex-col gap-2 mt-5">
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
                      fontSize: '1rem',
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
  );
}

export default function MemoryAtlasPage() {
  const [activeCategory, setActiveCategory] = useState<NodeCategory | 'all'>('all');
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const connections = useMemo(() => deriveConnections(nodes), []);

  const filtered = useMemo(() =>
    activeCategory === 'all' ? nodes : nodes.filter(n => n.category === activeCategory),
    [activeCategory]
  );

  const relatedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const ids = connections.get(selectedNode.id) ?? [];
    return nodes.filter(n => ids.includes(n.id));
  }, [selectedNode, connections]);

  const categories = ALL_CATEGORIES.filter(c => nodes.some(n => n.category === c));

  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <PageHero
        eyebrow="Memory Atlas"
        eyebrowIndex="·"
        title="The constellation."
        lede="Every node is a moment, decision, or discipline that shaped the system. Click any to go deeper."
      />

      {/* Filters */}
      <div className="container-wide pb-12">
        <Reveal>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className="caption transition-all duration-200"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.62rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                padding: '0.6rem 1.1rem',
                background: activeCategory === 'all' ? 'var(--gold)' : 'transparent',
                color: activeCategory === 'all' ? 'var(--obsidian)' : 'var(--warm-white-muted)',
                border: `1px solid ${activeCategory === 'all' ? 'var(--gold)' : 'var(--border)'}`,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              All
            </button>
            {categories.map(cat => {
              const color = CATEGORY_COLORS[cat];
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="caption transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.62rem',
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    padding: '0.6rem 1.1rem',
                    background: active ? color : 'transparent',
                    color: active ? 'var(--obsidian)' : color,
                    border: `1px solid ${active ? color : color + '40'}`,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>

      {/* Node grid */}
      <div className="container-wide" style={{ paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}>
        <motion.div
          layout
          className="grid gap-px"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', background: 'var(--border)' }}
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
          <div className="py-24 text-center body" style={{ color: 'var(--warm-white-muted)' }}>
            No nodes in this category yet.
          </div>
        )}
      </div>

      {selectedNode && (
        <DetailPanel
          node={selectedNode}
          related={relatedNodes}
          onClose={() => setSelectedNode(null)}
          onSelect={setSelectedNode}
        />
      )}
      <div className="relative z-10">
        <Footer />
      </div>
    </main>
  );
}
