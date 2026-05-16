import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Props {
  value: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

const sizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3',
};

const tones = {
  brand: 'bg-[linear-gradient(120deg,#4f46e5,#6366f1_55%,#06b6d4)]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

export function ProgressBar({
  value,
  showLabel = false,
  size = 'md',
  tone = 'brand',
  className,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-800',
          sizes[size],
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={cn('h-full rounded-full', tones[tone])}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 flex justify-between text-xs text-ink-500 dark:text-ink-400">
          <span>{clamped}% complete</span>
          <span>{100 - clamped}% to go</span>
        </div>
      )}
    </div>
  );
}
