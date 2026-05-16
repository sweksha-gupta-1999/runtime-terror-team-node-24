import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  Database,
  Globe,
  Network,
  Server,
  Shield,
  Workflow,
} from 'lucide-react';
import type { ArchitectureEdge, ArchitectureNode } from '@/types';
import { cn } from '@/utils/cn';

const ICONS = {
  client: Globe,
  service: Server,
  db: Database,
  queue: Workflow,
  cache: Cloud,
  external: Network,
  gateway: Shield,
} as const;

const TONES: Record<ArchitectureNode['kind'], string> = {
  client: 'from-cyan-500/15 to-cyan-500/0 text-cyan-700 dark:text-cyan-300',
  service: 'from-brand-500/15 to-brand-500/0 text-brand-700 dark:text-brand-300',
  db: 'from-emerald-500/15 to-emerald-500/0 text-emerald-700 dark:text-emerald-300',
  queue: 'from-fuchsia-500/15 to-fuchsia-500/0 text-fuchsia-700 dark:text-fuchsia-300',
  cache: 'from-amber-500/15 to-amber-500/0 text-amber-700 dark:text-amber-300',
  external: 'from-rose-500/15 to-rose-500/0 text-rose-700 dark:text-rose-300',
  gateway: 'from-indigo-500/15 to-indigo-500/0 text-indigo-700 dark:text-indigo-300',
};

const W = 900;
const H = 420;

export function ArchitectureMap({
  nodes,
  edges,
}: {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}) {
  const [hover, setHover] = useState<string | null>(null);
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-gradient-to-br from-ink-50/60 to-white dark:from-ink-900 dark:to-ink-950 p-4">
      <div className="relative" style={{ minHeight: H }}>
        {/* SVG edges */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-brand-400" />
            </marker>
          </defs>
          {edges.map((edge, i) => {
            const a = nodeMap[edge.from];
            const b = nodeMap[edge.to];
            if (!a || !b) return null;
            const x1 = a.x + 80;
            const y1 = a.y + 36;
            const x2 = b.x;
            const y2 = b.y + 36;
            const cx = (x1 + x2) / 2;
            const highlighted = hover === a.id || hover === b.id;
            return (
              <g key={i}>
                <path
                  d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                  stroke="currentColor"
                  strokeWidth={highlighted ? 2 : 1.4}
                  className={cn(
                    'transition-colors',
                    highlighted ? 'text-brand-500' : 'text-ink-300 dark:text-ink-700',
                  )}
                  fill="none"
                  markerEnd="url(#arrow)"
                />
                {edge.label && (
                  <text
                    x={cx}
                    y={(y1 + y2) / 2 - 6}
                    textAnchor="middle"
                    className="fill-ink-500 dark:fill-ink-400 text-[10px]"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((n) => {
          const Icon = ICONS[n.kind];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.04 }}
              onHoverStart={() => setHover(n.id)}
              onHoverEnd={() => setHover(null)}
              className={cn(
                'absolute w-40 cursor-default rounded-2xl border border-ink-200/70 dark:border-ink-700 bg-white/95 dark:bg-ink-900/90 p-3 shadow-card',
                hover === n.id && 'ring-2 ring-brand-400/40',
              )}
              style={{ left: n.x, top: n.y }}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br',
                  TONES[n.kind],
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="mt-2 font-display text-sm font-semibold">{n.label}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">{n.kind}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
