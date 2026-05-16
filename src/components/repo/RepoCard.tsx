import { Star, GitFork, Users, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Repository } from '@/types';
import { formatCompact, timeAgo } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import { usePrefsStore } from '@/store/prefsStore';

export function RepoCard({ repo }: { repo: Repository }) {
  const showConfidence = usePrefsStore((s) => s.showAiConfidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="group relative h-full overflow-hidden rounded-2xl border border-ink-200/70 dark:border-ink-800 bg-white/85 dark:bg-ink-900/60 p-5 shadow-card backdrop-blur-sm transition-all hover:shadow-soft"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-500/10 blur-2xl transition-transform group-hover:scale-125"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-base font-semibold text-ink-900 dark:text-ink-50">
              {repo.name}
            </h3>
            {repo.visibility === 'private' && (
              <Badge tone="default" className="shrink-0">
                Private
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">
            {repo.fullName}
          </p>
        </div>
        {showConfidence && (
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-ink-500">AI score</span>
            <span className="text-gradient font-display text-lg font-bold leading-none">
              {repo.aiConfidence}%
            </span>
          </div>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-ink-600 dark:text-ink-300">
        {repo.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {repo.stack.slice(0, 4).map((s) => (
          <Badge key={s} tone="brand">
            {s}
          </Badge>
        ))}
        {repo.stack.length > 4 && (
          <Badge tone="default">+{repo.stack.length - 4}</Badge>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> {formatCompact(repo.stars)}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3.5 w-3.5" /> {formatCompact(repo.forks)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {repo.contributors}
          </span>
        </div>
        <span>{timeAgo(repo.lastUpdated)}</span>
      </div>

      <Link
        to={`/artifacts/${repo.id}`}
        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 bg-white/80 dark:bg-ink-900/80 text-ink-700 dark:text-ink-200 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Open onboarding"
      >
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
