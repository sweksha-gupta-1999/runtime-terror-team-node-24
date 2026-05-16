import type { ReactNode } from 'react';

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <span className="mb-1 inline-block text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900 dark:text-ink-50 sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-ink-500 dark:text-ink-400">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
