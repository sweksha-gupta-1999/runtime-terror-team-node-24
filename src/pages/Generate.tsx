import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  FolderTree,
  Github,
  Layers,
  Loader2,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { ONBOARDING_LEVELS, TECH_STACK_OPTIONS } from '@/constants';
import type { OnboardingLevel, TechStack } from '@/types';
import { useRepoStore } from '@/store/repoStore';
import { usePrefsStore } from '@/store/prefsStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GitHubError, parseGitHubUrl } from '@/utils/github';
import { cn } from '@/utils/cn';

const STAGE_ICONS = [Github, Search, Database, FolderTree, FileText, Layers, Sparkles];
const STAGE_LABELS = [
  'Validating GitHub URL',
  'Fetching repo metadata',
  'Reading languages & contributors',
  'Walking the file tree',
  'Pulling README + manifests',
  'Composing artifact sections',
  'Done — opening artifact',
];

export default function Generate() {
  const navigate = useNavigate();
  const createManual = useRepoStore((s) => s.createRepoManual);
  const createFromGitHub = useRepoStore((s) => s.createRepoFromGitHub);
  const generateForRepo = useRepoStore((s) => s.generateForRepo);
  const addRecent = useRepoStore((s) => s.addRecent);
  const setActiveRepo = useRepoStore((s) => s.setActiveRepo);
  const defaultLevel = usePrefsStore((s) => s.defaultLevel);

  const [step, setStep] = useState(0);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stack, setStack] = useState<TechStack[]>([]);
  const [level, setLevel] = useState<OnboardingLevel>(defaultLevel);
  const [generating, setGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressLabel, setProgressLabel] = useState(STAGE_LABELS[0]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'github' | 'manual'>('github');

  const parsed = useMemo(() => parseGitHubUrl(url), [url]);
  const validGitHubUrl = !!parsed;

  // Auto-fill the name from the parsed URL
  useEffect(() => {
    if (parsed && !name) setName(parsed.repo);
  }, [parsed, name]);

  const canStep1 =
    mode === 'github' ? validGitHubUrl : name.trim().length > 0 && /^https?:\/\//.test(url);
  const canStep2 = mode === 'github' ? true : stack.length > 0;

  const toggleStack = (s: TechStack) =>
    setStack((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const startGenerate = async () => {
    setGenerating(true);
    setError(null);
    setProgressStep(0);
    setProgressLabel(STAGE_LABELS[0]);

    try {
      if (mode === 'github') {
        const repo = await createFromGitHub(url.trim(), level, (p) => {
          setProgressStep(p.step);
          setProgressLabel(p.label);
        });
        setProgressStep(STAGE_LABELS.length - 1);
        setProgressLabel(STAGE_LABELS[STAGE_LABELS.length - 1]);
        addRecent(repo.id);
        setActiveRepo(repo.id);
        setTimeout(() => navigate(`/artifacts/${repo.id}`), 350);
      } else {
        for (let i = 0; i < 3; i++) {
          setProgressStep(i);
          setProgressLabel(STAGE_LABELS[i]);
          await new Promise((r) => setTimeout(r, 350));
        }
        const repo = createManual({
          name: name.trim(),
          url: url.trim(),
          stack,
          description,
        });
        generateForRepo(repo.id, level);
        addRecent(repo.id);
        setActiveRepo(repo.id);
        setProgressStep(STAGE_LABELS.length - 1);
        setProgressLabel(STAGE_LABELS[STAGE_LABELS.length - 1]);
        setTimeout(() => navigate(`/artifacts/${repo.id}`), 350);
      }
    } catch (e) {
      const msg =
        e instanceof GitHubError
          ? e.message
          : 'Something went wrong while generating the artifact. Please try again.';
      setError(msg);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Generate onboarding' }]} />

      <SectionHeader
        eyebrow="Step-by-step"
        title="Generate an onboarding artifact"
        description="Drop in any public GitHub URL — we fetch the repo's real metadata, languages, contributors, and file tree, and compose a stack-aware onboarding artifact."
      />

      {/* Mode switcher */}
      <div className="flex gap-1.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white/70 dark:bg-ink-900/60 p-1 sm:w-fit">
        {(
          [
            { id: 'github', label: 'From GitHub URL (real data)' },
            { id: 'manual', label: 'Manual entry' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              setMode(opt.id);
              setError(null);
              setStep(0);
            }}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition',
              mode === opt.id
                ? 'bg-brand-500 text-white shadow-glow'
                : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(mode === 'github'
          ? ['Repository', 'Level', 'Generate']
          : ['Repository', 'Tech stack', 'Level', 'Generate']
        ).map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition',
                  active
                    ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : done
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'border-ink-200 bg-white text-ink-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                    active
                      ? 'bg-brand-600 text-white'
                      : done
                        ? 'bg-emerald-500 text-white'
                        : 'bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-ink-300',
                  )}
                >
                  {done ? '✓' : i + 1}
                </span>
                {label}
              </div>
              {i < (mode === 'github' ? 2 : 3) && (
                <div className="h-px w-6 bg-ink-200 dark:bg-ink-700" />
              )}
            </div>
          );
        })}
      </div>

      <Card className="!p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ---- Step 0: URL/details ---- */}
          {!generating && step === 0 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6 p-6 md:grid-cols-2"
            >
              <div className="space-y-4">
                <Input
                  label="GitHub URL"
                  placeholder="https://github.com/owner/repo"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  leftIcon={<Github className="h-4 w-4" />}
                  rightIcon={
                    url ? (
                      validGitHubUrl ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )
                    ) : null
                  }
                  hint={
                    parsed
                      ? `Will fetch ${parsed.owner}/${parsed.repo} from api.github.com`
                      : 'Paste any public GitHub repo URL — owner/repo is also accepted.'
                  }
                />
                {mode === 'manual' && (
                  <>
                    <Input
                      label="Repository name"
                      placeholder="my-service"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                      label="Short description (optional)"
                      placeholder="What does this service do?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-dashed border-ink-200 dark:border-ink-700 bg-ink-50/40 dark:bg-ink-900/30 p-5">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-brand-600" />
                  <span className="font-display text-sm font-semibold">
                    {mode === 'github' ? 'What we fetch' : 'Tips'}
                  </span>
                </div>
                {mode === 'github' ? (
                  <ul className="mt-3 space-y-2 text-sm text-ink-600 dark:text-ink-300">
                    <li>• Repository metadata (stars, forks, issues, license, branch)</li>
                    <li>• Language byte counts and topics</li>
                    <li>• Top 8 contributors with avatars</li>
                    <li>• File tree (2 levels deep)</li>
                    <li>• README excerpt + package.json scripts (if present)</li>
                    <li className="pt-2 text-xs text-ink-500">
                      Public GitHub API is rate-limited to 60 requests/hour per IP. Cached for 24h.
                    </li>
                  </ul>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-ink-600 dark:text-ink-300">
                    <li>• Manual entries skip the GitHub fetch entirely.</li>
                    <li>• You'll pick the tech stack on the next step.</li>
                    <li>• Switch to "From GitHub URL" for richer artifacts.</li>
                  </ul>
                )}
              </div>
            </motion.div>
          )}

          {/* ---- Manual: stack picker ---- */}
          {!generating && step === 1 && mode === 'manual' && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <div className="mb-4">
                <h3 className="font-display text-base font-semibold">Pick your tech stack</h3>
                <p className="text-sm text-ink-500">
                  We'll tailor every section to match.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK_OPTIONS.map((s) => {
                  const active = stack.includes(s as TechStack);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleStack(s as TechStack)}
                      className={cn(
                        'rounded-xl border px-3 py-1.5 text-sm font-medium transition',
                        active
                          ? 'border-brand-400 bg-brand-50 text-brand-700 shadow-glow dark:bg-brand-500/10 dark:text-brand-200'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-brand-500/40',
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ---- Level picker (step depends on mode) ---- */}
          {!generating && ((step === 1 && mode === 'github') || (step === 2 && mode === 'manual')) && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <div className="mb-4">
                <h3 className="font-display text-base font-semibold">Onboarding depth</h3>
                <p className="text-sm text-ink-500">
                  Pick the audience — we'll calibrate the tone and detail.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {ONBOARDING_LEVELS.map((lvl) => {
                  const active = lvl === level;
                  return (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={cn(
                        'group rounded-2xl border p-5 text-left transition',
                        active
                          ? 'border-brand-400 bg-brand-50/40 shadow-glow dark:bg-brand-500/5'
                          : 'border-ink-200 bg-white hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-brand-500/40',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-base font-semibold">{lvl}</span>
                        {active && <CheckCircle2 className="h-5 w-5 text-brand-600" />}
                      </div>
                      <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
                        {lvl === 'Beginner' && 'Step-by-step, vocabulary expanded, fewer assumptions.'}
                        {lvl === 'Intermediate' && 'Balanced depth — best for most engineers joining the team.'}
                        {lvl === 'Advanced' && 'Concise, opinionated, assumes domain familiarity.'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ---- Review ---- */}
          {!generating && ((step === 2 && mode === 'github') || (step === 3 && mode === 'manual')) && (
            <motion.div
              key="s4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6 p-6 md:grid-cols-2"
            >
              <div>
                <h3 className="font-display text-base font-semibold">Review & generate</h3>
                <p className="mt-1 text-sm text-ink-500">
                  {mode === 'github'
                    ? 'We will fetch live data from GitHub and build the artifact.'
                    : 'We will build the artifact from your inputs.'}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label={mode === 'github' ? 'GitHub repo' : 'Repository'}>
                    {mode === 'github' && parsed
                      ? `${parsed.owner}/${parsed.repo}`
                      : name || '—'}
                  </Row>
                  <Row label="URL">
                    <span className="max-w-[60%] truncate">{url || '—'}</span>
                  </Row>
                  <Row label="Level">{level}</Row>
                  {mode === 'manual' && (
                    <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-900">
                      <dt className="mb-1.5 text-ink-500">Tech stack</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {stack.map((s) => (
                          <Badge tone="brand" key={s}>
                            {s}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-gradient-to-br from-brand-50/60 to-accent-50/60 p-5 dark:from-brand-500/5 dark:to-accent-500/5">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-brand-600" />
                  <span className="font-display text-sm font-semibold">What the AI will do</span>
                </div>
                <ol className="mt-3 space-y-2 text-sm text-ink-700 dark:text-ink-200">
                  {mode === 'github' ? (
                    <>
                      <li>1. Hit api.github.com for repo, languages, contributors, tree.</li>
                      <li>2. Detect the actual stack (Node/Python/Go/Java/Rust/etc.).</li>
                      <li>3. Compose stack-aware env, build, deploy, common-issue sections.</li>
                      <li>4. Use real contributors as the SME team.</li>
                    </>
                  ) : (
                    <>
                      <li>1. Detect stack from your selections.</li>
                      <li>2. Generate stack-aware sections (env, build, deploy).</li>
                      <li>3. Render the interactive artifact.</li>
                    </>
                  )}
                </ol>
              </div>
            </motion.div>
          )}

          {/* ---- Generating ---- */}
          {generating && (
            <motion.div
              key="gen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8"
            >
              <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                <span className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/40" />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#22d3ee)] text-white shadow-glow">
                    <Sparkles className="h-7 w-7" />
                  </span>
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{progressLabel}</h3>
                <p className="mt-1 text-sm text-ink-500">
                  {mode === 'github'
                    ? `Fetching real data from github.com/${parsed?.owner}/${parsed?.repo}`
                    : 'Composing your artifact'}
                </p>

                <div className="mt-6 w-full space-y-3">
                  {STAGE_LABELS.map((label, i) => {
                    const Icon = STAGE_ICONS[i] ?? Sparkles;
                    const done = i < progressStep;
                    const active = i === progressStep;
                    return (
                      <div
                        key={label}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border p-3 transition',
                          done
                            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5'
                            : active
                              ? 'border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/5'
                              : 'border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg',
                            done
                              ? 'bg-emerald-500 text-white'
                              : active
                                ? 'bg-brand-500 text-white'
                                : 'bg-ink-100 text-ink-500 dark:bg-ink-800',
                          )}
                        >
                          {active ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : done ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </span>
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="mt-6 w-full rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="h-4 w-4" /> Couldn't generate
                    </div>
                    <p className="mt-1">{error}</p>
                    <button
                      onClick={() => {
                        setError(null);
                        setGenerating(false);
                      }}
                      className="mt-3 inline-flex rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
                    >
                      Back to form
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!generating && (
          <div className="flex items-center justify-between gap-2 border-t border-ink-200/60 dark:border-ink-800 p-4">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            {(mode === 'github' ? step < 2 : step < 3) ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={(step === 0 && !canStep1) || (step === 1 && !canStep2 && mode === 'manual')}
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={startGenerate}>
                <Sparkles className="h-4 w-4" />
                {mode === 'github' ? 'Fetch & generate' : 'Generate artifact'}
              </Button>
            )}
          </div>
        )}
      </Card>

      {error && !generating && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-3 py-2 dark:bg-ink-900">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
