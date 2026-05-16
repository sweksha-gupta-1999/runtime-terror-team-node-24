import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  CheckSquare,
  Code2,
  Download,
  ExternalLink,
  FolderTree as FolderTreeIcon,
  GitBranch,
  Globe2,
  HelpCircle,
  Layers,
  ListChecks,
  MessageCircle,
  RefreshCw,
  Rocket,
  Sparkles,
  Star,
  Terminal,
  Users,
} from 'lucide-react';
import { useRepoStore } from '@/store/repoStore';
import { useProgressStore } from '@/store/progressStore';
import { GitHubError } from '@/utils/github';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { FolderTree } from '@/components/artifact/FolderTree';
import { ArchitectureMap } from '@/components/artifact/ArchitectureMap';
import { AskSMEModal } from '@/components/repo/AskSMEModal';
import { timeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Contact } from '@/types';

const TAB_ITEMS: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: 'architecture', label: 'Architecture', icon: <Boxes className="h-3.5 w-3.5" /> },
  { id: 'folder', label: 'Folder structure', icon: <FolderTreeIcon className="h-3.5 w-3.5" /> },
  { id: 'api', label: 'API flow', icon: <Globe2 className="h-3.5 w-3.5" /> },
  { id: 'env', label: 'Env setup', icon: <Terminal className="h-3.5 w-3.5" /> },
  { id: 'build', label: 'Build & run', icon: <Rocket className="h-3.5 w-3.5" /> },
  { id: 'deploy', label: 'Deployment', icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 'issues', label: 'Common issues', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { id: 'faqs', label: 'FAQs', icon: <HelpCircle className="h-3.5 w-3.5" /> },
  { id: 'contacts', label: 'Contacts', icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'walkthrough', label: 'Walkthrough', icon: <Code2 className="h-3.5 w-3.5" /> },
  { id: 'glossary', label: 'Glossary', icon: <Layers className="h-3.5 w-3.5" /> },
  { id: 'learning', label: 'Learning path', icon: <ListChecks className="h-3.5 w-3.5" /> },
];

export default function ArtifactDetail() {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const repo = useRepoStore((s) => (repoId ? s.getRepo(repoId) : undefined));
  const artifact = useRepoStore((s) => (repoId ? s.getArtifact(repoId) : undefined));
  const generateForRepo = useRepoStore((s) => s.generateForRepo);
  const refreshFromGitHub = useRepoStore((s) => s.refreshRepoFromGitHub);
  const createFromGitHub = useRepoStore((s) => s.createRepoFromGitHub);
  const addRecent = useRepoStore((s) => s.addRecent);
  const setActiveRepo = useRepoStore((s) => s.setActiveRepo);
  const progressMap = useProgressStore((s) => s.progress);
  const toggleStep = useProgressStore((s) => s.toggleStep);
  const cleanupStaleSteps = useProgressStore((s) => s.cleanupStaleSteps);

  const [tab, setTab] = useState('overview');
  const [askOpen, setAskOpen] = useState(false);
  const [askContact, setAskContact] = useState<Contact | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Mark this as the active repo for the AI chat & track in recents
  useEffect(() => {
    if (!repo) return;
    addRecent(repo.id);
    setActiveRepo(repo.id);
  }, [repo, addRecent, setActiveRepo]);

  // For GitHub-sourced repos, fetch fresh data on first view if no artifact yet.
  // For manual repos, just stamp the template-based artifact.
  useEffect(() => {
    if (!repo || artifact) return;
    let cancelled = false;
    (async () => {
      setFetchError(null);
      if (repo.source === 'github') {
        setRefreshing(true);
        try {
          await createFromGitHub(repo.url, 'Beginner');
        } catch (e) {
          if (cancelled) return;
          setFetchError(
            e instanceof GitHubError
              ? `${e.message} — showing a stack-aware preview instead.`
              : 'Could not reach GitHub — showing a stack-aware preview instead.',
          );
          generateForRepo(repo.id, 'Beginner');
        } finally {
          if (!cancelled) setRefreshing(false);
        }
      } else {
        generateForRepo(repo.id, 'Beginner');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo, artifact, createFromGitHub, generateForRepo]);

  const refresh = async () => {
    if (!repo || repo.source !== 'github') return;
    setRefreshing(true);
    setFetchError(null);
    try {
      await refreshFromGitHub(repo.id, artifact?.level);
    } catch (e) {
      setFetchError(
        e instanceof GitHubError ? e.message : 'Could not refresh from GitHub.',
      );
    } finally {
      setRefreshing(false);
    }
  };

  const learning = useMemo(() => artifact?.learningPath ?? [], [artifact]);

  useEffect(() => {
    if (!repoId) return;
    cleanupStaleSteps(
      repoId,
      learning.map((step) => step.id),
    );
  }, [repoId, learning, cleanupStaleSteps]);

  const repoProgress = useMemo(
    () => (repoId ? progressMap[repoId] ?? {} : {}),
    [repoId, progressMap],
  );
  const doneLearningCount = useMemo(
    () => learning.filter((l) => repoProgress[l.id]).length,
    [learning, repoProgress],
  );
  const completion = useMemo(() => {
    if (learning.length === 0) return 0;
    return Math.round((doneLearningCount / learning.length) * 100);
  }, [learning, doneLearningCount]);

  const sanitizeFileName = (value: string) => {
    const safe = value
      .trim()
      .replace(/[^a-zA-Z0-9 \-_.]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[._-]+|[._-]+$/g, '');

    return safe || 'Artifact';
  };

  const exportPdf = () => {
    if (typeof window === 'undefined') return;

    const originalTitle = document.title;
    const fileTitle = `${sanitizeFileName(repo?.name ?? 'Artifact')}-Onboarding.pdf`;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', mediaListener);
      }
    };

    const beforePrint = () => {
      document.title = fileTitle;
    };

    const afterPrint = () => {
      restoreTitle();
    };

    const mediaQuery = window.matchMedia?.('print');
    const mediaListener = (event: MediaQueryListEvent) => {
      if (!event.matches) restoreTitle();
    };

    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', mediaListener);
    }

    beforePrint();
    window.print();

    // Fallback restore if browser does not fire afterprint.
    setTimeout(() => {
      if (document.title === fileTitle) restoreTitle();
    }, 2000);
  };

  if (!repo) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ to: '/artifacts', label: 'Artifacts' }, { label: 'Not found' }]} />
        <Card>
          <p className="text-sm">Repository not found. It may have been removed.</p>
          <div className="mt-3">
            <Button onClick={() => navigate('/artifacts')}>Back to artifacts</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ to: '/artifacts', label: 'Artifacts' }, { label: repo.name }]} />
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 animate-pulse items-center justify-center rounded-xl bg-brand-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium">
                {repo.source === 'github'
                  ? `Fetching live data from github.com/${repo.fullName}…`
                  : 'Building artifact for the first time…'}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {repo.source === 'github'
                  ? 'Repo metadata · languages · contributors · file tree · README · package.json'
                  : 'Composing stack-aware sections.'}
              </p>
            </div>
          </div>
        </Card>
        {fetchError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {fetchError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ to: '/artifacts', label: 'Artifacts' }, { label: repo.name }]} />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-ink-200/70 dark:border-ink-800 bg-gradient-to-br from-white via-brand-50/40 to-accent-50/40 p-6 dark:from-ink-900 dark:via-brand-500/5 dark:to-accent-500/5"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                <Sparkles className="h-3 w-3" /> AI confidence {repo.aiConfidence}%
              </Badge>
              <Badge tone="info">{artifact.level}</Badge>
              <Badge tone="default">{repo.visibility}</Badge>
              <Badge tone="default">
                <Star className="h-3 w-3" /> {repo.stars.toLocaleString()}
              </Badge>
              {repo.license && <Badge tone="default">{repo.license}</Badge>}
              {repo.source === 'github' && (
                <Badge tone="success">Live GitHub data</Badge>
              )}
            </div>
            <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
              {repo.ownerAvatar && (
                <Avatar name={repo.owner} color={repo.ownerAvatar} size="md" />
              )}
              {repo.name}
            </h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                {repo.fullName} <ExternalLink className="h-3 w-3" />
              </a>
              {' · '}updated {timeAgo(repo.lastUpdated)}
              {repo.defaultBranch && ` · default branch \`${repo.defaultBranch}\``}
            </p>
            <p className="mt-3 max-w-2xl text-sm text-ink-600 dark:text-ink-300">
              {repo.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {repo.stack.map((s) => (
                <Badge tone="brand" key={s}>
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink-200/70 dark:border-ink-700 bg-white/80 p-4 dark:bg-ink-900/60">
            <div className="font-display text-sm font-semibold">Onboarding progress</div>
            <p className="mt-1 text-xs text-ink-500">
              {doneLearningCount} of {learning.length} steps done
            </p>
            <ProgressBar value={completion} showLabel className="mt-3" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => navigate(`/learning/${repo.id}`)}>
                <CheckSquare className="h-3.5 w-3.5" /> Open checklist
              </Button>
              <Button size="sm" variant="outline" onClick={exportPdf} title="Export as PDF (Ctrl+P or Cmd+P)">
                <Download className="h-3.5 w-3.5" /> Export as PDF
              </Button>
              {repo.source === 'github' && (
                <Button size="sm" variant="ghost" onClick={refresh} loading={refreshing}>
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh from GitHub
                </Button>
              )}
            </div>
          </div>
        </div>
        {fetchError && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {fetchError}
          </div>
        )}
      </motion.div>

      <Tabs items={TAB_ITEMS} active={tab} onChange={setTab} />

      {/* Tab content */}
      <div className="space-y-4">
        {tab === 'overview' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h3 className="font-display text-base font-semibold">Summary</h3>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
                {artifact.overview.summary}
              </p>
              <h4 className="mt-5 font-display text-sm font-semibold">Purpose</h4>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                {artifact.overview.purpose}
              </p>
              <h4 className="mt-5 font-display text-sm font-semibold">Key features</h4>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {artifact.overview.keyFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="font-display text-base font-semibold">Tech stack</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {artifact.overview.techStack.map((t) => (
                  <Badge key={t} tone="brand">
                    {t}
                  </Badge>
                ))}
              </div>
              <h3 className="mt-5 font-display text-base font-semibold">Quick links</h3>
              <div className="mt-2 flex flex-col gap-2 text-sm">
                <a className="hover:underline" href={repo.url} target="_blank" rel="noreferrer">
                  GitHub repository ↗
                </a>
                <Link className="hover:underline" to={`/health/${repo.id}`}>
                  Repo health insights →
                </Link>
                <Link className="hover:underline" to={`/team/${repo.id}`}>
                  Team & SMEs →
                </Link>
              </div>
            </Card>
          </div>
        )}

        {tab === 'architecture' && (
          <Card>
            <div className="mb-3">
              <h3 className="font-display text-base font-semibold">System architecture</h3>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {artifact.architecture.description}
              </p>
            </div>
            <ArchitectureMap
              nodes={artifact.architecture.nodes}
              edges={artifact.architecture.edges}
            />
          </Card>
        )}

        {tab === 'folder' && (
          <Card>
            <h3 className="font-display text-base font-semibold">Folder structure</h3>
            <p className="mt-1 text-sm text-ink-500">
              Click any folder to expand. Hints describe what lives inside.
            </p>
            <div className="mt-3">
              <FolderTree root={artifact.folderStructure} />
            </div>
          </Card>
        )}

        {tab === 'api' && (
          <Card>
            <h3 className="font-display text-base font-semibold">API flow</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-ink-200 dark:border-ink-800">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500 dark:bg-ink-900">
                  <tr>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Path</th>
                    <th className="px-3 py-2">Auth</th>
                    <th className="px-3 py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {artifact.apiFlow.map((e, i) => (
                    <tr
                      key={i}
                      className="border-t border-ink-200 dark:border-ink-800 hover:bg-ink-50/60 dark:hover:bg-ink-900/60"
                    >
                      <td className="px-3 py-2">
                        <Badge
                          tone={
                            e.method === 'GET'
                              ? 'success'
                              : e.method === 'POST'
                                ? 'brand'
                                : e.method === 'DELETE'
                                  ? 'danger'
                                  : 'warning'
                          }
                        >
                          {e.method}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{e.path}</td>
                      <td className="px-3 py-2">
                        {e.auth ? (
                          <Badge tone="info">Auth required</Badge>
                        ) : (
                          <Badge tone="default">Public</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-ink-600 dark:text-ink-300">{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'env' && (
          <Card>
            <h3 className="font-display text-base font-semibold">Environment variables</h3>
            <div className="mt-3 space-y-2">
              {artifact.envSetup.map((e) => (
                <div
                  key={e.key}
                  className="grid gap-2 rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-900/40 p-3 sm:grid-cols-[1fr_2fr]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-brand-700 dark:text-brand-300">
                        {e.key}
                      </span>
                      {e.required ? (
                        <Badge tone="danger">required</Badge>
                      ) : (
                        <Badge tone="default">optional</Badge>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-ink-500">{e.example}</div>
                  </div>
                  <p className="text-sm text-ink-600 dark:text-ink-300">{e.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'build' && (
          <Card>
            <h3 className="font-display text-base font-semibold">Build & run commands</h3>
            <div className="mt-3 space-y-2">
              {artifact.buildCommands.map((c) => (
                <div
                  key={c.command}
                  className="flex items-start justify-between gap-3 rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-900/40 p-3"
                >
                  <div>
                    <div className="font-display text-sm font-semibold">{c.label}</div>
                    <code className="mt-1 inline-block rounded-md bg-ink-900 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                      $ {c.command}
                    </code>
                    <p className="mt-1.5 text-sm text-ink-600 dark:text-ink-300">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'deploy' && (
          <Card>
            <h3 className="font-display text-base font-semibold">Deployment flow</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {artifact.deployment.map((d, i) => (
                <div
                  key={d.stage}
                  className="relative rounded-2xl border border-ink-200 dark:border-ink-800 bg-white p-4 dark:bg-ink-900/60"
                >
                  <span className="absolute -top-2 left-3 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    Stage {i + 1}
                  </span>
                  <h4 className="mt-2 font-display text-sm font-semibold">{d.stage}</h4>
                  <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">{d.description}</p>
                  <Badge tone="info" className="mt-3">
                    {d.tool}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'issues' && (
          <Card>
            <h3 className="font-display text-base font-semibold">Common issues</h3>
            <div className="mt-3 space-y-3">
              {artifact.commonIssues.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/40 p-3 dark:bg-ink-900/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display text-sm font-semibold">{c.title}</div>
                    <Badge
                      tone={
                        c.severity === 'high'
                          ? 'danger'
                          : c.severity === 'medium'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {c.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">{c.symptom}</p>
                  <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">
                    <span className="font-medium">Resolution:</span> {c.resolution}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'faqs' && (
          <Card>
            <h3 className="font-display text-base font-semibold">Frequently asked questions</h3>
            <div className="mt-3 space-y-2">
              {artifact.faqs.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-ink-200 dark:border-ink-800 bg-white p-3 dark:bg-ink-900/40"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium">
                    {f.q}
                    <span className="text-ink-400 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{f.a}</p>
                </details>
              ))}
            </div>
          </Card>
        )}

        {tab === 'contacts' && (
          <Card>
            <h3 className="font-display text-base font-semibold">Important contacts</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {artifact.contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-ink-200 dark:border-ink-800 bg-white p-3 dark:bg-ink-900/40"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={c.name} color={c.avatar} />
                    <div>
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-xs text-ink-500">
                        {c.role} · {c.team}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.expertise.slice(0, 3).map((e) => (
                          <Badge tone="info" key={e}>
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAskContact(c as Contact);
                      setAskOpen(true);
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Ask
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'walkthrough' && (
          <div className="space-y-3">
            {artifact.codeWalkthrough.map((step, i) => (
              <Card key={i}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <h4 className="font-display text-sm font-semibold">{step.title}</h4>
                  <Badge tone="default" className="ml-auto">
                    {step.file}
                  </Badge>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-ink-950 p-3 font-mono text-[11px] text-emerald-200">
                  <code>{step.snippet}</code>
                </pre>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{step.explanation}</p>
              </Card>
            ))}
          </div>
        )}

        {tab === 'glossary' && (
          <Card>
            <h3 className="font-display text-base font-semibold">Glossary</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {artifact.glossary.map((g) => (
                <div
                  key={g.term}
                  className="rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/40 p-3 dark:bg-ink-900/40"
                >
                  <div className="font-display text-sm font-semibold">{g.term}</div>
                  <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{g.definition}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'learning' && (
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold">Learning path</h3>
              <Badge tone="brand">{completion}% complete</Badge>
            </div>
            <ProgressBar value={completion} className="mt-3" />
            <ol className="mt-4 space-y-2">
              {learning.map((step, i) => {
                const done = !!repoProgress[step.id];
                return (
                  <li
                    key={step.id}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3 transition',
                      done
                        ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5'
                        : 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40',
                    )}
                  >
                    <button
                      onClick={() => toggleStep(repo.id, step.id)}
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition',
                        done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-ink-300 dark:border-ink-600',
                      )}
                      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {done && '✓'}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-ink-500">
                          Step {i + 1}
                        </span>
                        <Badge tone="default">{step.category}</Badge>
                        <Badge tone="info">~{step.estMinutes}m</Badge>
                      </div>
                      <div
                        className={cn(
                          'mt-1 font-display text-sm font-semibold',
                          done && 'text-ink-500 line-through',
                        )}
                      >
                        {step.title}
                      </div>
                      <p className="text-sm text-ink-600 dark:text-ink-300">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}
      </div>

      <AskSMEModal open={askOpen} onClose={() => setAskOpen(false)} contact={askContact} />
    </div>
  );
}
