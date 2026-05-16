import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useRepoStore } from '@/store/repoStore';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { RepoCard } from '@/components/repo/RepoCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Artifacts() {
  const navigate = useNavigate();
  const repos = useRepoStore((s) => s.repos);
  const artifacts = useRepoStore((s) => s.artifacts);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'generated' | 'pending'>('all');

  const filtered = useMemo(() => {
    const list = repos.filter((r) => {
      if (filter === 'generated') return !!artifacts[r.id];
      if (filter === 'pending') return !artifacts[r.id];
      return true;
    });
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.stack.some((s) => s.toLowerCase().includes(q)),
    );
  }, [repos, query, filter, artifacts]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Artifacts' }]} />

      <SectionHeader
        eyebrow="Library"
        title="Onboarding artifacts"
        description="Every repo and its generated artifact, in one place."
        action={
          <Button onClick={() => navigate('/generate')}>
            <Sparkles className="h-4 w-4" /> Generate new
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="flex-1">
          <Input
            placeholder="Search by name, description, or stack…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white/70 dark:bg-ink-900/60 p-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'generated', label: 'Generated' },
              { id: 'pending', label: 'Pending' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                filter === f.id
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-1 hidden text-ink-400 sm:inline-flex">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
        </div>
      </motion.div>

      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Badge tone="default">{filtered.length} results</Badge>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No artifacts match your filter"
          description="Try adjusting your search or generate a new artifact."
          action={<Button onClick={() => navigate('/generate')}>Generate</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RepoCard key={r.id} repo={r} />
          ))}
        </div>
      )}
    </div>
  );
}
