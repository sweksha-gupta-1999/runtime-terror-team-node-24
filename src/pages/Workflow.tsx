import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Cpu,
  Database,
  Github,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Workflow as WorkflowIcon,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

const STAGES = [
  {
    id: 'input',
    title: 'Repo Input',
    icon: Github,
    color: 'from-cyan-500 to-cyan-400',
    description: 'URL, stack, audience level captured from the user.',
    details: [
      'Clone metadata only — no source code leaves the browser in this demo.',
      'Pre-fill heuristics from the URL.',
      'Audience level decides tone & depth.',
    ],
  },
  {
    id: 'analyze',
    title: 'AI Analysis',
    icon: Cpu,
    color: 'from-brand-500 to-brand-400',
    description: 'Parse manifest, infer language, detect key entry points.',
    details: [
      'Identify build system, package manager, frameworks.',
      'Score repo signal strength (confidence).',
      'Heuristics + LLM hybrid in the real version.',
    ],
  },
  {
    id: 'extract',
    title: 'Knowledge Extraction',
    icon: Database,
    color: 'from-fuchsia-500 to-fuchsia-400',
    description: 'Pull READMEs, ADRs, runbooks, and code comments.',
    details: [
      'Summarize each artifact into structured slots.',
      'Reconcile conflicting docs by recency.',
      'Tag with confidence per fact.',
    ],
  },
  {
    id: 'generate',
    title: 'Artifact Generation',
    icon: Sparkles,
    color: 'from-amber-500 to-amber-400',
    description: 'Compose the 13-section browser-readable artifact.',
    details: [
      'Section templates filled with extracted facts.',
      'Code walkthroughs pinned to real files.',
      'Cross-links to the Knowledge Hub.',
    ],
  },
  {
    id: 'serve',
    title: 'Interactive Onboarding',
    icon: BookOpen,
    color: 'from-emerald-500 to-emerald-400',
    description: 'Self-serve, interactive learning with progress tracking.',
    details: [
      'Step-by-step checklist with state in localStorage.',
      'Ask SME modal where the AI can\'t answer.',
      'Per-repo progress and analytics.',
    ],
  },
];

export default function Workflow() {
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);

  const play = () => {
    if (running) return;
    setRunning(true);
    setActive(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= STAGES.length) {
        setActive(STAGES.length - 1);
        setRunning(false);
        clearInterval(id);
      } else {
        setActive(i);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'AI Workflow' }]} />
      <SectionHeader
        eyebrow="Behind the magic"
        title="The AI onboarding pipeline"
        description="Watch the agentic loop that turns a raw repo into a self-contained onboarding artifact."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActive(0)}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button onClick={play} disabled={running}>
              {running ? (
                <>
                  <Pause className="h-4 w-4" /> Running…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Run simulation
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Pipeline */}
      <Card className="!p-6">
        <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === active;
            const isDone = i < active && !running ? false : i < active;
            return (
              <div key={s.id} className="flex flex-1 items-center gap-4 lg:flex-col">
                <button
                  onClick={() => setActive(i)}
                  className={cn(
                    'group relative flex w-full flex-1 items-start gap-3 rounded-2xl border p-3 text-left transition',
                    isActive
                      ? 'border-brand-400 bg-white shadow-glow dark:bg-ink-900'
                      : 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/60 hover:border-brand-300',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-glow',
                      `bg-gradient-to-br ${s.color}`,
                      isActive && running && 'animate-pulse-soft',
                    )}
                  >
                    {running && isActive ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-ink-500">
                        Stage {i + 1}
                      </span>
                      {isDone && <Badge tone="success">Done</Badge>}
                      {isActive && <Badge tone="brand">Active</Badge>}
                    </div>
                    <div className="font-display text-sm font-semibold">{s.title}</div>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">{s.description}</p>
                  </div>
                </button>
                {i < STAGES.length - 1 && (
                  <ArrowRight className="hidden h-5 w-5 shrink-0 text-ink-400 lg:block" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Active stage details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-glow',
                  `bg-gradient-to-br ${STAGES[active].color}`,
                )}
              >
                <WorkflowIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-500">
                  Stage {active + 1} of {STAGES.length}
                </div>
                <h3 className="font-display text-xl font-semibold">{STAGES[active].title}</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
              {STAGES[active].description}
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              {STAGES[active].details.map((d) => (
                <li
                  key={d}
                  className="rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-900/40 p-3 text-sm text-ink-600 dark:text-ink-300"
                >
                  {d}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
