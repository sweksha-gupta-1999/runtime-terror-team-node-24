import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { NAV_ITEMS, APP_NAME } from '@/constants';
import { useRepoStore } from '@/store/repoStore';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ open, onCloseMobile }: Props) {
  const activeRepoId = useRepoStore((s) => s.activeRepoId);
  const repoContextRoutes = new Set(['/learning', '/health', '/team']);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm lg:hidden transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-ink-200/60 dark:border-ink-800',
          'bg-white/85 dark:bg-ink-950/80 backdrop-blur-xl transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-ink-200/60 dark:border-ink-800 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6366f1,#22d3ee,#a855f7)] text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
              {APP_NAME}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">
              Agentic Onboarding
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const navTo =
              activeRepoId && repoContextRoutes.has(to) ? `${to}/${activeRepoId}` : to;
            return (
              <NavLink
                key={to}
                to={navTo}
                end={to === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'text-white'
                      : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 -z-0 rounded-xl bg-[linear-gradient(120deg,#4f46e5,#6366f1_55%,#06b6d4)] shadow-glow"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="rounded-2xl border border-ink-200/60 dark:border-ink-800 bg-gradient-to-br from-brand-50 to-accent-50 p-4 dark:from-brand-500/10 dark:to-accent-500/10">
            <div className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
              Need a hand?
            </div>
            <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">
              Ask the AI Assistant anything about your repo — it remembers your session.
            </p>
            <NavLink
              to="/chat"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-ink-800 dark:bg-ink-100 dark:text-ink-900 dark:hover:bg-white"
            >
              Open Chat <Sparkles className="h-3 w-3" />
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
