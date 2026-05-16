import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-1 rounded-2xl border border-ink-200/70 dark:border-ink-800',
        'bg-white/60 dark:bg-ink-900/40 p-1 backdrop-blur-sm',
        className,
      )}
    >
      {items.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition',
              isActive
                ? 'text-white'
                : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-100',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 -z-0 rounded-xl bg-[linear-gradient(120deg,#4f46e5,#6366f1_55%,#06b6d4)] shadow-glow"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
