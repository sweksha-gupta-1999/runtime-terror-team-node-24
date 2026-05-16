import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, CheckSquare, ListChecks, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { useRepoStore } from '@/store/repoStore';
import { useProgressStore } from '@/store/progressStore';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';

export default function Learning() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const repos = useRepoStore((s) => s.repos);
  const artifacts = useRepoStore((s) => s.artifacts);
  const generateForRepo = useRepoStore((s) => s.generateForRepo);
  const setActiveRepo = useRepoStore((s) => s.setActiveRepo);
  const progress = useProgressStore((s) => s.progress);
  const toggleStep = useProgressStore((s) => s.toggleStep);
  const markAll = useProgressStore((s) => s.markAll);
  const cleanupStaleSteps = useProgressStore((s) => s.cleanupStaleSteps);

  const [selectedId, setSelectedId] = useState<string | undefined>(repoId);
  const selected = selectedId ? repos.find((r) => r.id === selectedId) : undefined;
  const artifact = selectedId ? artifacts[selectedId] : undefined;

  useEffect(() => {
    if (repoId && repoId !== selectedId) setSelectedId(repoId);
  }, [repoId, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setActiveRepo(selected.id);
    if (!artifact) generateForRepo(selected.id, 'Beginner');
  }, [selected, artifact, generateForRepo, setActiveRepo]);

  const steps = useMemo(() => artifact?.learningPath ?? [], [artifact]);

  useEffect(() => {
    if (!selectedId) return;
    cleanupStaleSteps(
      selectedId,
      steps.map((step) => step.id),
    );
  }, [selectedId, steps, cleanupStaleSteps]);

  const repoProgress = useMemo(
    () => (selectedId ? progress[selectedId] ?? {} : {}),
    [selectedId, progress],
  );
  const completion = useMemo(() => {
    if (steps.length === 0) return 0;
    return Math.round(
      (steps.filter((s) => repoProgress[s.id]).length / steps.length) * 100,
    );
  }, [steps, repoProgress]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof steps> = {};
    steps.forEach((s) => {
      map[s.category] ??= [];
      map[s.category].push(s);
    });
    return map;
  }, [steps]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={
          selected
            ? [
                { to: '/learning', label: 'Learning' },
                { label: selected.name },
              ]
            : [{ label: 'Learning Path' }]
        }
      />

      <SectionHeader
        eyebrow="Interactive learning"
        title="Onboarding checklist"
        description="Pick a repo to start. Progress is saved per repo in your browser."
        action={
          selected && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => markAll(selected.id, steps.map((s) => s.id), false)}
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button onClick={() => markAll(selected.id, steps.map((s) => s.id), true)}>
                <CheckSquare className="h-4 w-4" /> Mark all
              </Button>
            </div>
          )
        }
      />

      {/* Repo picker */}
      <div className="flex flex-wrap gap-2">
        {repos.map((r) => {
          const active = r.id === selectedId;
          return (
            <button
              key={r.id}
              onClick={() => {
                setSelectedId(r.id);
                navigate(`/learning/${r.id}`);
              }}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition',
                active
                  ? 'border-brand-400 bg-brand-500 text-white shadow-glow'
                  : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200',
              )}
            >
              {r.name}
            </button>
          );
        })}
      </div>

      {!selected ? (
        <EmptyState
          icon={ListChecks}
          title="Pick a repository to begin"
          description="Each repo has its own onboarding checklist with progress tracked in localStorage."
          action={
            <Button onClick={() => navigate(`/learning/${repos[0]?.id}`)}>Start with {repos[0]?.name}</Button>
          }
        />
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-500">Progress</div>
                <div className="mt-1 font-display text-2xl font-semibold">
                  {completion}% complete
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="brand">
                  <Trophy className="h-3 w-3" /> {Math.round((completion / 100) * steps.length)} /{' '}
                  {steps.length} steps
                </Badge>
                <Link
                  to={`/artifacts/${selected.id}`}
                  className="text-sm text-brand-600 hover:underline"
                >
                  Open artifact →
                </Link>
              </div>
            </div>
            <ProgressBar value={completion} className="mt-3" />
          </Card>

          {/* Grouped checklist */}
          {Object.entries(grouped).map(([cat, items]) => (
            <motion.section
              key={cat}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-500">
                {cat}
              </h3>
              <div className="space-y-2">
                {items.map((step, i) => {
                  const done = !!repoProgress[step.id];
                  return (
                    <motion.button
                      key={step.id}
                      whileHover={{ y: -1 }}
                      onClick={() => toggleStep(selected.id, step.id)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
                        done
                          ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5'
                          : 'border-ink-200 bg-white hover:border-brand-300 dark:border-ink-800 dark:bg-ink-900/40',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition',
                          done
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-ink-300 dark:border-ink-600',
                        )}
                      >
                        {done && <CheckCircle2 className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-ink-500">
                            Step {i + 1}
                          </span>
                          <Badge tone="info">~{step.estMinutes}m</Badge>
                        </div>
                        <div
                          className={cn(
                            'mt-1 font-display text-sm font-semibold',
                            done && 'line-through text-ink-500',
                          )}
                        >
                          {step.title}
                        </div>
                        <p className="text-sm text-ink-600 dark:text-ink-300">
                          {step.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          ))}

          {completion === 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5 text-center dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-cyan-500/10"
            >
              <Sparkles className="mx-auto h-7 w-7 text-emerald-600" />
              <h3 className="mt-2 font-display text-xl font-semibold">
                You're onboarded — nice work!
              </h3>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                Time to ship something. Pick a "good first issue" and open your first PR.
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
