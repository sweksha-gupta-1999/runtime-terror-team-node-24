import { cn } from '@/utils/cn';

interface Props {
  className?: string;
  rows?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer h-4 w-full', className)} />;
}

export function SkeletonCard({ className, rows = 3 }: Props) {
  return (
    <div className={cn('card space-y-3 p-5', className)}>
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={i === rows - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  );
}
