import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Props = Omit<HTMLMotionProps<'div'>, 'children'> & {
  hoverable?: boolean;
  padded?: boolean;
  children?: ReactNode;
};

export function Card({
  children,
  className,
  hoverable = false,
  padded = true,
  ...rest
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={hoverable ? { y: -3, transition: { duration: 0.15 } } : undefined}
      className={cn(
        'rounded-2xl border border-ink-200/70 dark:border-ink-800 bg-white/80 dark:bg-ink-900/60 shadow-card backdrop-blur-sm',
        hoverable && 'cursor-pointer hover:shadow-soft transition-shadow',
        padded && 'p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
