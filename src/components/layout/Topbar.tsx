import { Bell, Menu, Moon, Search, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { usePrefsStore } from '@/store/prefsStore';
import { useRepoStore } from '@/store/repoStore';
import { Avatar } from '@/components/ui/Avatar';

interface Props {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: Props) {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const displayName = usePrefsStore((s) => s.displayName);
  const role = usePrefsStore((s) => s.role);
  const repos = useRepoStore((s) => s.repos);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const matches = query
    ? repos
        .filter(
          (r) =>
            r.name.toLowerCase().includes(query.toLowerCase()) ||
            r.description.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-ink-200/60 dark:border-ink-800 bg-white/70 dark:bg-ink-950/70 px-4 backdrop-blur-xl">
      <button
        onClick={onMenuClick}
        className="rounded-xl p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search repositories, docs, contacts…"
          className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white/70 dark:bg-ink-900/60 pl-9 pr-3 py-2 text-sm text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
        />
        {matches.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-ink-200 dark:border-ink-800 bg-white/95 dark:bg-ink-900/95 shadow-soft backdrop-blur-xl">
            {matches.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setQuery('');
                  navigate(`/artifacts/${r.id}`);
                }}
                className="flex w-full items-start gap-3 border-b border-ink-100 last:border-b-0 dark:border-ink-800 px-3.5 py-2.5 text-left hover:bg-ink-50 dark:hover:bg-ink-800"
              >
                <div className="mt-0.5 h-2 w-2 rounded-full bg-brand-500" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                    {r.name}
                  </div>
                  <div className="truncate text-xs text-ink-500 dark:text-ink-400">
                    {r.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={toggle}
        className="rounded-xl p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
        aria-label="Toggle theme"
      >
        {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <button
        className="relative rounded-xl p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-ink-950" />
      </button>

      <div className="flex items-center gap-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white/70 dark:bg-ink-900/60 py-1 pl-1 pr-2.5">
        <Avatar name={displayName} size="sm" />
        <div className="hidden sm:block leading-tight">
          <div className="text-xs font-semibold text-ink-900 dark:text-ink-50">{displayName}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-500">{role}</div>
        </div>
      </div>
    </header>
  );
}
