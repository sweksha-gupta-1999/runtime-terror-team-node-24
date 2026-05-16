import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  tone?: 'brand' | 'accent' | 'success' | 'warning';
}

const tones = {
  brand: 'from-brand-500/15 to-brand-500/0 text-brand-600 dark:text-brand-300',
  accent: 'from-accent-500/15 to-accent-500/0 text-accent-600 dark:text-accent-300',
  success: 'from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-300',
  warning: 'from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-300',
};

export function StatCard({ icon: Icon, label, value, delta, tone = 'brand' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl border border-ink-200/70 dark:border-ink-800 bg-white/85 dark:bg-ink-900/60 p-5 shadow-card backdrop-blur-sm"
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-80 blur-2xl',
          tones[tone],
        )}
      />
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', `bg-gradient-to-br ${tones[tone]}`)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-xs font-medium uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 flex items-end gap-2">
        <div className="font-display text-3xl font-semibold text-ink-900 dark:text-ink-50">
          {value}
        </div>
        {delta && (
          <span
            className={cn(
              'mb-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
              delta.positive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
            )}
          >
            {delta.value}
          </span>
        )}
      </div>
    </motion.div>
  );
}
