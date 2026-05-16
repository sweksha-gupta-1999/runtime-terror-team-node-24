import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    'text-white shadow-glow bg-[linear-gradient(120deg,#4f46e5,#6366f1_55%,#06b6d4)] hover:brightness-110',
  outline:
    'border border-ink-200 dark:border-ink-700 bg-white/70 dark:bg-ink-900/40 hover:bg-white dark:hover:bg-ink-800 text-ink-700 dark:text-ink-100',
  ghost:
    'bg-transparent hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all',
        'focus:outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {children}
    </motion.button>
  );
}
