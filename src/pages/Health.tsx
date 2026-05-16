import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  Bug,
  GitFork,
  GitPullRequestArrow,
  Rocket,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRepoStore } from '@/store/repoStore';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import healthData from '@/data/health.json';
import { cn } from '@/utils/cn';

const PIE_COLORS = ['#6366f1', '#22d3ee', '#a855f7', '#f59e0b'];

export default function Health() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const repos = useRepoStore((s) => s.repos);
  const [selectedId, setSelectedId] = useState<string | undefined>(repoId ?? repos[0]?.id);

  useEffect(() => {
    if (repoId && repoId !== selectedId) setSelectedId(repoId);
  }, [repoId, selectedId]);

  const repo = repos.find((r) => r.id === selectedId);
  const data = healthData.default;

  // Derive a per-repo "languageMix" from the repo's stack so the donut
  // looks different per repo when we don't have raw byte counts cached.
  const languageMix = useMemo(() => {
    if (!repo) return data.languageMix;
    const items = repo.stack.slice(0, 4);
    if (items.length === 0) return data.languageMix;
    const weights = [55, 25, 12, 8];
    return items.map((name, i) => ({ name, value: weights[i] ?? 5 }));
  }, [repo, data.languageMix]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={
          repo
            ? [{ to: '/health', label: 'Health' }, { label: repo.name }]
            : [{ label: 'Repo Health' }]
        }
      />
      <SectionHeader
        eyebrow="Insights"
        title="Repo Health Insights"
        description="A vital-signs view of the codebase — pick a repo to drill in."
      />

      <div className="flex flex-wrap gap-2">
        {repos.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setSelectedId(r.id);
              navigate(`/health/${r.id}`);
            }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition',
              r.id === selectedId
                ? 'border-brand-400 bg-brand-500 text-white shadow-glow'
                : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200',
            )}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {repo ? (
          <>
            <StatCard
              icon={Star}
              label="Stars"
              value={repo.stars.toLocaleString()}
              tone="warning"
              delta={{ value: 'live', positive: true }}
            />
            <StatCard
              icon={GitFork}
              label="Forks"
              value={repo.forks.toLocaleString()}
              tone="brand"
            />
            <StatCard
              icon={Bug}
              label="Open issues"
              value={(repo.openIssues ?? 0).toLocaleString()}
              tone="accent"
            />
            <StatCard
              icon={Users}
              label="Top contributors"
              value={repo.contributors}
              tone="success"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={ShieldCheck}
              label="Build stability"
              value={`${data.buildStability}%`}
              tone="success"
            />
            <StatCard
              icon={GitPullRequestArrow}
              label="PR activity"
              value={`${data.prActivity}`}
              tone="brand"
            />
            <StatCard
              icon={Rocket}
              label="Deploys / week"
              value={data.deploymentFrequency}
              tone="accent"
            />
            <StatCard
              icon={Bug}
              label="Open issues"
              value={data.openIssues}
              tone="warning"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Weekly velocity</h3>
            <Badge tone="info">
              <TrendingUp className="h-3 w-3" /> last 12 weeks
            </Badge>
          </div>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weekly}>
                <defs>
                  <linearGradient id="gradPrs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBuilds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="week" stroke="rgba(100,116,139,0.8)" fontSize={11} />
                <YAxis stroke="rgba(100,116,139,0.8)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: 12,
                    color: 'white',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="builds"
                  stroke="#22d3ee"
                  fill="url(#gradBuilds)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="prs"
                  stroke="#6366f1"
                  fill="url(#gradPrs)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-sm font-semibold">Language mix</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageMix}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {languageMix.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: 12,
                    color: 'white',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Tech debt score</h3>
            <Badge tone={data.techDebtScore < 35 ? 'success' : 'warning'}>
              {data.techDebtScore < 35 ? 'Healthy' : 'Watch list'}
            </Badge>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className="font-display text-4xl font-semibold">{data.techDebtScore}</div>
            <div className="mb-1 text-xs text-ink-500">lower is better</div>
          </div>
          <ProgressBar
            value={data.techDebtScore}
            tone={data.techDebtScore < 35 ? 'success' : 'warning'}
            className="mt-3"
          />
          <ul className="mt-4 space-y-1.5 text-sm text-ink-600 dark:text-ink-300">
            <li className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-brand-500" /> Trending down for 4 weeks
            </li>
            <li className="flex items-center gap-2">
              <AlertOctagon className="h-3.5 w-3.5 text-amber-500" /> 3 hotspots flagged
            </li>
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-display text-sm font-semibold">Deployments per week</h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="week" stroke="rgba(100,116,139,0.8)" fontSize={11} />
                <YAxis stroke="rgba(100,116,139,0.8)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: 12,
                    color: 'white',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="deployments" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-display text-sm font-semibold">Incident trend (last 6 months)</h3>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.incidentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" stroke="rgba(100,116,139,0.8)" fontSize={11} />
              <YAxis stroke="rgba(100,116,139,0.8)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sev1" stackId="a" fill="#ef4444" name="Sev 1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="sev2" stackId="a" fill="#f59e0b" name="Sev 2" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
