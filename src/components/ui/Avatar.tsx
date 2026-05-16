import { useState } from 'react';
import { cn } from '@/utils/cn';

interface Props {
  name: string;
  /** Either a CSS color (#rrggbb) for an initials avatar OR a full image URL */
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

function initials(name: string) {
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function isImageUrl(value?: string): value is string {
  if (!value) return false;
  return /^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:');
}

export function Avatar({ name, color = '#6366f1', size = 'md', className }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const useImage = isImageUrl(color) && !imgFailed;

  if (useImage) {
    return (
      <img
        src={color}
        alt={name}
        title={name}
        loading="lazy"
        onError={() => setImgFailed(true)}
        className={cn(
          'inline-block rounded-full object-cover ring-2 ring-white/60 dark:ring-ink-900/60',
          sizes[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white shadow-sm ring-2 ring-white/60 dark:ring-ink-900/60',
        sizes[size],
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
