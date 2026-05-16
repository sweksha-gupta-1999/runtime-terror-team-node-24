import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenCheck,
  GitBranch,
  Rocket,
  Search,
  Sparkles,
  TimerReset,
  Trophy,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useRepoStore } from '@/store/repoStore';
import { usePrefsStore } from '@/store/prefsStore';
import { useProgressStore } from '@/store/progressStore';
import { RepoCard } from '@/components/repo/RepoCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import recommendations from '@/data/recommendations.json';
import { APP_TAGLINE } from '@/constants';

const ICONS: Record<string, typeof Workflow> = {
  Workflow,
  GitBranch,
  Users,
  Rocket,
};

export default function Dashboard() {
  const repos = useRepoStore((s) => s.repos);
  const recentIds = useRepoStore((s) => s.recentIds);
  const cleanupRecents = useRepoStore((s) => s.cleanupRecents);
  const artifacts = useRepoStore((s) => s.artifacts);
  const progress = useProgressStore((s) => s.progress);
  const displayName = usePrefsStore((s) => s.displayName);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    cleanupRecents();
  }, [cleanupRecents]);

  const filtered = useMemo(() => {
    if (!query.trim()) return repos;
    const q = query.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.stack.some((s) => s.toLowerCase().includes(q)),
    );
  }, [repos, query]);

  const validRecentIds = recentIds.filter((id) => repos.some((r) => r.id === id));
  const recent = validRecentIds
    .map((id) => repos.find((r) => r.id === id))
    .filter(Boolean) as typeof repos;

  const suggested = repos
    .filter((r) => !validRecentIds.includes(r.id))
    .sort((a, b) => b.aiConfidence - a.aiConfidence)
    .slice(0, 3);

  const totalSteps = Object.values(progress).reduce(
    (acc, m) => acc + Object.values(m).filter(Boolean).length,
    0,
  );
  const artifactCount = Object.keys(artifacts).length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-ink-200/70 dark:border-ink-800"
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#4f46e5_0%,#6366f1_45%,#06b6d4_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(at_80%_-10%,rgba(255,255,255,0.35),transparent_60%),radial-gradient(at_-10%_120%,rgba(255,255,255,0.25),transparent_55%)]" />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl text-white">
              <Badge tone="default" className="border-white/30 bg-white/15 text-white">
                <Sparkles className="h-3 w-3" /> Agentic AI · Onboarding co-pilot
              </Badge>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome back, {displayName.split(' ')[0]} ·{' '}
                <span className="text-white/85">{APP_TAGLINE}</span>
              </h1>
              <p className="mt-3 text-base text-white/85">
                Generate a self-contained, browser-readable onboarding artifact for any repository.
                Walk new joiners through architecture, code, deploys, and SMEs — without burning
                team-lead bandwidth.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate('/generate')}
                  className="!bg-white !text-brand-700 hover:!brightness-95"
                >
                  <Sparkles className="h-4 w-4" /> Generate onboarding
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/workflow')}
                  className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/15"
                >
                  <Workflow className="h-4 w-4" /> See AI workflow
                </Button>
              </div>
            </div>

            <div className="grid w-full max-w-md grid-cols-3 gap-3 lg:max-w-sm">
              {[
                { label: 'Repos', value: repos.length, icon: GitBranch },
                { label: 'Artifacts', value: artifactCount, icon: BookOpenCheck },
                { label: 'Steps done', value: totalSteps, icon: Trophy },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl"
                >
                  <s.icon className="h-4 w-4 text-white/80" />
                  <div className="mt-2 font-display text-2xl font-semibold text-white">
                    {s.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-white/70">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mt-8">
            <div className="relative max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search repositories or paste a GitHub URL…"
                className="h-12 w-full rounded-2xl border border-white/30 bg-white/95 pl-11 pr-32 text-sm text-ink-900 placeholder-ink-400 shadow-soft focus:border-white focus:outline-none focus:ring-4 focus:ring-white/40 dark:bg-ink-900/95 dark:text-ink-100"
              />
              <Button
                size="sm"
                onClick={() => navigate('/generate')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Zap className="h-3.5 w-3.5" /> New
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={GitBranch}
          label="Repositories"
          value={repos.length}
          delta={{ value: '+2 this month', positive: true }}
          tone="brand"
        />
        <StatCard
          icon={BookOpenCheck}
          label="Artifacts generated"
          value={artifactCount}
          delta={{ value: '+12% WoW', positive: true }}
          tone="accent"
        />
        <StatCard
          icon={TimerReset}
          label="Avg onboarding time"
          value="2.1 days"
          delta={{ value: '-58% vs baseline', positive: true }}
          tone="success"
        />
        <StatCard
          icon={Users}
          label="SME hours saved"
          value="86 hrs"
          delta={{ value: '+22% MoM', positive: true }}
          tone="warning"
        />
      </section>

      {/* Recommendations */}
      <section>
        <SectionHeader
          eyebrow="For you"
          title="Smart recommendations"
          description="Personalized next steps based on your activity. Nudges, not noise."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommendations.map((r) => {
            const Icon = ICONS[r.icon] ?? Sparkles;
            return (
              <Card key={r.id} hoverable>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Badge tone="info">AI</Badge>
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
                  {r.title}
                </h3>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{r.reason}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent repos */}
      {recent.length > 0 && (
        <section>
          <SectionHeader
            eyebrow="Recently viewed"
            title="Pick up where you left off"
            action={
              <Link to="/artifacts" className="text-sm text-brand-600 hover:underline">
                View all artifacts
              </Link>
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((r) => (
              <RepoCard key={r.id} repo={r} />
            ))}
          </div>
        </section>
      )}

      {/* Suggested */}
      <section>
        <SectionHeader
          eyebrow="Suggested"
          title="High-confidence onboarding artifacts"
          description="These repos have strong signal — schema, contributors, recent activity — so the AI is most useful here."
          action={
            <Button variant="outline" onClick={() => navigate('/generate')} size="sm">
              <Sparkles className="h-4 w-4" /> Generate new
            </Button>
          }
        />
        {suggested.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nothing suggested yet"
            description="Generate your first onboarding to see recommendations."
            action={
              <Button onClick={() => navigate('/generate')}>
                <Sparkles className="h-4 w-4" /> Generate
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggested.map((r) => (
              <RepoCard key={r.id} repo={r} />
            ))}
          </div>
        )}
      </section>

      {/* CTA banner */}
      <section className="relative overflow-hidden rounded-3xl border border-ink-200/60 dark:border-ink-800 bg-gradient-to-br from-white via-brand-50/40 to-accent-50/40 p-6 dark:from-ink-900 dark:via-brand-500/5 dark:to-accent-500/5 sm:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-2">
          <div>
            <Badge tone="brand">
              <Sparkles className="h-3 w-3" /> Production-ready
            </Badge>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
              Cut onboarding from <span className="text-gradient">10 days to 2</span>
            </h3>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
              An Agentic AI pipeline reads your repo, extracts knowledge, and ships a complete,
              interactive onboarding artifact — without ever pulling an SME into a 1:1.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => navigate('/generate')}>
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/knowledge')}>
                Browse knowledge hub
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {filtered.slice(0, 4).map((r) => (
              <Link
                key={r.id}
                to={`/artifacts/${r.id}`}
                className="group rounded-2xl border border-ink-200/60 dark:border-ink-700 bg-white/80 dark:bg-ink-900/60 p-4 transition hover:shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
                    {r.name}
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-ink-500 dark:text-ink-400">
                  {r.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
