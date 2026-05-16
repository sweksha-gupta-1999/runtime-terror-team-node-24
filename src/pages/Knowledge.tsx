import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search, Tag } from 'lucide-react';
import knowledge from '@/data/knowledge.json';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { timeAgo } from '@/utils/format';
import type { KnowledgeDoc } from '@/types';
import { cn } from '@/utils/cn';

const ALL_TAGS = Array.from(new Set((knowledge as KnowledgeDoc[]).flatMap((k) => k.tags))).sort();
const CATEGORIES: KnowledgeDoc['category'][] = [
  'Architecture',
  'Backend',
  'Frontend',
  'Security',
  'Process',
  'DevOps',
];

export default function Knowledge() {
  const docs = knowledge as KnowledgeDoc[];
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [category, setCategory] = useState<KnowledgeDoc['category'] | 'All'>('All');

  const toggleTag = (t: string) =>
    setActiveTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const filtered = useMemo(() => {
    let list = docs;
    if (category !== 'All') list = list.filter((d) => d.category === category);
    if (activeTags.length > 0)
      list = list.filter((d) => activeTags.every((t) => d.tags.includes(t)));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.body.toLowerCase().includes(q),
      );
    }
    return list;
  }, [docs, query, activeTags, category]);

  const recent = [...docs]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Knowledge Hub' }]} />
      <SectionHeader
        eyebrow="Searchable docs"
        title="Knowledge Hub"
        description="Curated playbooks, runbooks, and ADRs. Search, filter, and learn."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search docs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-700 bg-white/70 dark:bg-ink-900/60 p-1">
              {(['All', ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                    category === c
                      ? 'bg-brand-500 text-white shadow-glow'
                      : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-ink-400" />
            {ALL_TAGS.map((t) => {
              const active = activeTags.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[11px] transition',
                    active
                      ? 'border-brand-400 bg-brand-500 text-white shadow-glow'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300',
                  )}
                >
                  #{t}
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button
                onClick={() => setActiveTags([])}
                className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] text-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                Clear ×
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No docs match those filters"
              description="Try clearing tags or adjusting your search."
            />
          ) : (
            <div className="grid gap-3">
              {filtered.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white p-5 shadow-card dark:bg-ink-900/60"
                >
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{doc.category}</Badge>
                    <span className="text-xs text-ink-500">
                      {doc.author} · {timeAgo(doc.updatedAt)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold">{doc.title}</h3>
                  <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{doc.summary}</p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">{doc.body}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {doc.tags.map((t) => (
                      <Badge key={t} tone="default">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-display text-sm font-semibold">Recent updates</h3>
            <ul className="mt-3 space-y-3">
              {recent.map((d) => (
                <li key={d.id} className="border-l-2 border-brand-400 pl-3">
                  <div className="text-xs uppercase tracking-wider text-ink-500">
                    {d.category} · {timeAgo(d.updatedAt)}
                  </div>
                  <div className="font-display text-sm font-semibold">{d.title}</div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="font-display text-sm font-semibold">Popular tags</h3>
            <div className="mt-3 flex flex-wrap gap-1">
              {ALL_TAGS.slice(0, 12).map((t) => (
                <Badge key={t} tone="default">
                  #{t}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
