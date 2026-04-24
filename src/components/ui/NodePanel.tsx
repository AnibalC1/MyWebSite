'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { MemoryNode, CATEGORY_COLORS } from '@/lib/nodes';

interface NodePanelProps {
  node: MemoryNode | null;
  relatedNodes: MemoryNode[];
  onClose: () => void;
  onSelectRelated: (node: MemoryNode) => void;
}

export default function NodePanel({ node, relatedNodes, onClose, onSelectRelated }: NodePanelProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!node) return null;

  const color = CATEGORY_COLORS[node.category] ?? '#c9a96e';
  const date = new Date(node.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: 'rgba(10,10,11,0.4)', backdropFilter: 'blur(2px)' }}
      />

      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col"
        style={{
          background: 'var(--graphite)',
          borderLeft: '1px solid var(--steel)',
          animation: 'slideIn 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div style={{ height: '2px', background: color, flexShrink: 0 }} />

        <div className="flex items-start justify-between p-8 pb-4" style={{ flexShrink: 0 }}>
          <div>
            <div
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color, fontFamily: 'var(--font-body)', letterSpacing: '0.2em' }}
            >
              {node.category.replace('-', ' ')}
            </div>
            <h2
              className="text-3xl font-light italic leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)' }}
            >
              {node.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--warm-white-muted)] hover:text-[var(--warm-white)] transition-colors ml-4 mt-1 flex-shrink-0"
            style={{ background: 'var(--steel)' }}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {/* Real photo */}
          {node.media && (
            <div className="w-full mb-6 relative overflow-hidden" style={{ height: '240px' }}>
              <Image
                src={node.media.src}
                alt={node.media.alt ?? node.title}
                fill
                className="object-cover"
                style={{ filter: 'brightness(0.85)' }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(10,10,11,0.5) 0%, transparent 50%)' }}
              />
            </div>
          )}

          <p
            className="text-lg leading-relaxed mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white-muted)', fontStyle: 'italic' }}
          >
            {node.excerpt}
          </p>

          <div className="flex flex-wrap gap-4 mb-8 text-xs" style={{ color: 'var(--warm-white-muted)', letterSpacing: '0.1em' }}>
            <span>{date}</span>
            {node.location && <span>{node.location}</span>}
            {node.emotionalTag && (
              <span style={{ color, textTransform: 'uppercase' }}>#{node.emotionalTag}</span>
            )}
          </div>

          {relatedNodes.length > 0 && (
            <div>
              <div
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: 'var(--warm-white-muted)', letterSpacing: '0.15em' }}
              >
                Connected
              </div>
              <div className="flex flex-col gap-3">
                {relatedNodes.slice(0, 4).map(related => {
                  const relColor = CATEGORY_COLORS[related.category] ?? '#c9a96e';
                  return (
                    <button
                      key={related.id}
                      onClick={() => onSelectRelated(related)}
                      className="text-left p-4 rounded-sm hover:bg-[var(--steel)] transition-colors duration-200"
                      style={{ background: 'var(--graphite-mid)', border: '1px solid var(--steel)' }}
                    >
                      <div className="text-xs mb-1" style={{ color: relColor, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        {related.category}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: '16px', fontStyle: 'italic' }}>
                        {related.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
