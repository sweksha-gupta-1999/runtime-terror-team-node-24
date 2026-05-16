import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, leftIcon, rightIcon, error, hint, className, ...rest },
  ref,
) {
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-ink-600 dark:text-ink-300">
          {label}
        </span>
      )}
      <span className="relative block">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{leftIcon}</span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-white/80 dark:bg-ink-900/60 px-3.5 py-2.5 text-sm',
            'text-ink-900 dark:text-ink-100 placeholder-ink-400 transition',
            'focus:outline-none focus:ring-4',
            error
              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/15'
              : 'border-ink-200 dark:border-ink-700 focus:border-brand-400 focus:ring-brand-400/15',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className,
          )}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
            {rightIcon}
          </span>
        )}
      </span>
      {(hint || error) && (
        <span
          className={cn(
            'mt-1.5 block text-xs',
            error ? 'text-danger-500' : 'text-ink-500 dark:text-ink-400',
          )}
        >
          {error || hint}
        </span>
      )}
    </label>
  );
});
