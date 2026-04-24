'use client';

import { useState, useMemo, Suspense, lazy } from 'react';
import Navigation from '@/components/layout/Navigation';
import NodePanel from '@/components/ui/NodePanel';
import { MemoryNode, deriveConnections } from '@/lib/nodes';
import rawNodes from '@/data/nodes.json';

// Lazy-load 3D scene
const ConstellationScene = lazy(() => import('@/components/constellation/ConstellationScene'));

const nodes = rawNodes as MemoryNode[];

// Fallback for devices without WebGL / low-end
function ConstellationFallback({ nodes, onSelect }: { nodes: MemoryNode[]; onSelect: (n: MemoryNode) => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center flex-wrap gap-3 p-8">
      {nodes.map(node => (
        <button
          key={node.id}
          onClick={() => onSelect(node)}
          className="px-4 py-2 rounded-sm text-sm transition-all duration-200 hover:scale-105"
          style={{
            background: 'var(--graphite-mid)',
            border: '1px solid var(--steel)',
            color: 'var(--warm-white)',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
          }}
        >
          {node.title}
        </button>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [activeNode, setActiveNode] = useState<MemoryNode | null>(null);
  const connections = useMemo(() => deriveConnections(nodes), []);

  const relatedNodes = useMemo(() => {
    if (!activeNode) return [];
    const relatedIds = connections.get(activeNode.id) ?? [];
    return nodes.filter(n => relatedIds.includes(n.id));
  }, [activeNode, connections]);

  return (
    <main className="relative w-screen h-screen overflow-hidden" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      {/* 3D Constellation — full viewport */}
      <div className="absolute inset-0">
        <Suspense fallback={<ConstellationFallback nodes={nodes} onSelect={setActiveNode} />}>
          <ConstellationScene
            nodes={nodes}
            onNodeSelect={setActiveNode}
            activeNodeId={activeNode?.id ?? null}
          />
        </Suspense>
      </div>

      {/* Identity anchor — bottom left */}
      <div
        className="absolute bottom-12 left-8 md:left-16 z-10"
        style={{ pointerEvents: 'none' }}
      >
        <h1
          className="text-5xl md:text-7xl font-light italic leading-none mb-3"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--warm-white)',
            textShadow: '0 2px 40px rgba(10,10,11,0.8)',
          }}
        >
          Anibal Cabral
        </h1>
        <p
          className="text-sm tracking-widest uppercase"
          style={{
            color: 'var(--warm-white-muted)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.25em',
          }}
        >
          Systems · Discipline · Legacy
        </p>
      </div>

      {/* Scroll hint */}
      {!activeNode && (
        <div
          className="absolute bottom-12 right-8 md:right-16 z-10 text-xs uppercase tracking-widest"
          style={{
            color: 'var(--warm-white-muted)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.2em',
            pointerEvents: 'none',
            animation: 'pulse 3s ease-in-out infinite',
          }}
        >
          Click a node
        </div>
      )}

      {/* Node detail panel */}
      <NodePanel
        node={activeNode}
        relatedNodes={relatedNodes}
        onClose={() => setActiveNode(null)}
        onSelectRelated={setActiveNode}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
