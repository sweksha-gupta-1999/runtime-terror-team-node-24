import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, MessageCircle, Phone, Mail, AlertTriangle } from 'lucide-react';
import { useRepoStore } from '@/store/repoStore';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AskSMEModal } from '@/components/repo/AskSMEModal';
import escalation from '@/data/escalation.json';
import type { Contact, EscalationLevel } from '@/types';

const CHANNELS = [
  { name: '#repo-help', members: 412, kind: 'slack' },
  { name: '#oncall-platform', members: 88, kind: 'slack' },
  { name: 'Platform Eng — General', members: 124, kind: 'teams' },
  { name: 'Incidents', members: 56, kind: 'teams' },
];

export default function Team() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const repos = useRepoStore((s) => s.repos);
  const artifacts = useRepoStore((s) => s.artifacts);
  const generateForRepo = useRepoStore((s) => s.generateForRepo);
  const [selectedId, setSelectedId] = useState<string | undefined>(repoId ?? repos[0]?.id);

  useEffect(() => {
    if (repoId && repoId !== selectedId) setSelectedId(repoId);
  }, [repoId, selectedId]);

  const repo = repos.find((r) => r.id === selectedId);
  const setActiveRepo = useRepoStore((s) => s.setActiveRepo);
  useEffect(() => {
    if (!repo) return;
    setActiveRepo(repo.id);
    if (!artifacts[repo.id]) generateForRepo(repo.id, 'Beginner');
  }, [repo, artifacts, generateForRepo, setActiveRepo]);

  const artifact = repo ? artifacts[repo.id] : undefined;
  const contacts = artifact?.contacts ?? [];

  const [askOpen, setAskOpen] = useState(false);
  const [askContact, setAskContact] = useState<Contact | undefined>();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={
          repo
            ? [{ to: '/team', label: 'Team' }, { label: repo.name }]
            : [{ label: 'Team & SMEs' }]
        }
      />
      <SectionHeader
        eyebrow="Collaboration"
        title="Team & SMEs"
        description="Who to ping, when, and how. Built so you don't burn SME bandwidth."
      />

      <div className="flex flex-wrap gap-2">
        {repos.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setSelectedId(r.id);
              navigate(`/team/${r.id}`);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              r.id === selectedId
                ? 'border-brand-400 bg-brand-500 text-white shadow-glow'
                : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {!repo ? (
        <EmptyState title="Pick a repository to see its team" />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {contacts.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-ink-200 dark:border-ink-800 bg-white p-4 shadow-card dark:bg-ink-900/60"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} color={c.avatar} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold">{c.name}</h3>
                      <Badge tone="brand">{c.role}</Badge>
                    </div>
                    <div className="text-xs text-ink-500">
                      {c.team} · {c.timezone}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.expertise.map((e) => (
                        <Badge tone="info" key={e}>
                          {e}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-600 dark:text-ink-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {c.email}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" /> {c.slack}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setAskContact(c as Contact);
                          setAskOpen(true);
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Ask SME
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="h-3.5 w-3.5" /> 15-min sync
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-brand-600" />
                <h3 className="font-display text-sm font-semibold">Slack / Teams channels</h3>
              </div>
              <ul className="mt-3 space-y-2">
                {CHANNELS.map((ch) => (
                  <li
                    key={ch.name}
                    className="flex items-center justify-between rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/40 px-3 py-2 dark:bg-ink-900/40"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-ink-400" />
                      <span className="text-sm font-medium">{ch.name}</span>
                      <Badge tone="default">{ch.kind}</Badge>
                    </div>
                    <span className="text-xs text-ink-500">{ch.members} members</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="font-display text-sm font-semibold">Escalation matrix</h3>
              </div>
              <ol className="mt-3 space-y-2">
                {(escalation as EscalationLevel[]).map((e) => (
                  <li
                    key={e.level}
                    className="flex items-start gap-3 rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/40 p-3 dark:bg-ink-900/40"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
                      L{e.level}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">
                        {e.name} <span className="text-ink-500 font-normal">· {e.role}</span>
                      </div>
                      <div className="text-xs text-ink-500">{e.contact}</div>
                      <Badge tone="warning" className="mt-1">
                        Reply target: {e.responseTime}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </>
      )}

      <AskSMEModal open={askOpen} onClose={() => setAskOpen(false)} contact={askContact} />
    </div>
  );
}
