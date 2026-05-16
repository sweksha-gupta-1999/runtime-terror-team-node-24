import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eraser, Send, Sparkles } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useRepoStore } from '@/store/repoStore';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils/cn';

const DEFAULT_PROMPTS = [
  'Summarize this repository for a new joiner.',
  'Walk me through the deployment pipeline.',
  'What are the most common build issues?',
  'Where do I start contributing as a beginner?',
];

export default function Chat() {
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const send = useChatStore((s) => s.send);
  const clear = useChatStore((s) => s.clear);

  const repos = useRepoStore((s) => s.repos);
  const activeRepoId = useRepoStore((s) => s.activeRepoId);
  const setActiveRepo = useRepoStore((s) => s.setActiveRepo);
  const activeRepo = useMemo(
    () => repos.find((r) => r.id === activeRepoId),
    [repos, activeRepoId],
  );

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && !isTyping) return;
    const timer = window.setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [messages.length, isTyping]);

  const submit = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;
    setInput('');
    await send(content);
  };

  // Per-repo prompts when a repo is active
  const prompts = activeRepo
    ? [
        `Summarize ${activeRepo.name}.`,
        `What stack does ${activeRepo.name} use?`,
        `Who maintains ${activeRepo.name}?`,
        `What's the license on ${activeRepo.name}?`,
        `How do I run ${activeRepo.name} locally?`,
        `What are common build issues with ${activeRepo.name}?`,
      ]
    : DEFAULT_PROMPTS;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'AI Assistant' }]} />
      <SectionHeader
        eyebrow="Co-pilot"
        title="AI Onboarding Assistant"
        description={
          activeRepo
            ? `Context-aware: replies use real facts about ${activeRepo.fullName}.`
            : 'Pick a repo below to make replies context-aware with real GitHub data.'
        }
        action={
          <Button variant="outline" onClick={clear}>
            <Eraser className="h-4 w-4" /> Reset
          </Button>
        }
      />

      {/* Active-repo selector */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={activeRepo ? 'brand' : 'default'}>
            {activeRepo ? `Asking about ${activeRepo.name}` : 'No active repo'}
          </Badge>
          <div className="flex flex-wrap gap-1.5">
            {repos.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRepo(r.id === activeRepoId ? undefined : r.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  r.id === activeRepoId
                    ? 'border-brand-400 bg-brand-500 text-white shadow-glow'
                    : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200',
                )}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card className="!p-0 overflow-hidden">
          <div className="max-h-[60vh] min-h-[50vh] overflow-y-auto p-4">
            <AnimatePresence initial={false}>
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('mb-3 flex', isUser ? 'justify-end' : 'justify-start')}
                  >
                    {!isUser && (
                      <Avatar
                        name="AI"
                        color="#6366f1"
                        size="sm"
                        className="mr-2 mt-1"
                      />
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card',
                        isUser
                          ? 'bg-[linear-gradient(120deg,#4f46e5,#6366f1_55%,#06b6d4)] text-white'
                          : 'bg-white text-ink-900 dark:bg-ink-800 dark:text-ink-100',
                      )}
                    >
                      {!isUser && (
                        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-brand-600 dark:text-brand-300">
                          <Sparkles className="h-3 w-3" /> Onboarding AI
                          {activeRepo && (
                            <span className="text-ink-400">· about {activeRepo.name}</span>
                          )}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </motion.div>
                );
              })}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-3 flex justify-start"
                >
                  <Avatar name="AI" color="#6366f1" size="sm" className="mr-2 mt-1" />
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-card dark:bg-ink-800">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-brand-500"
                        style={{ animationDelay: '120ms' }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-brand-500"
                        style={{ animationDelay: '240ms' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-2 border-t border-ink-200/60 dark:border-ink-800 bg-white/60 p-3 dark:bg-ink-900/60"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeRepo
                  ? `Ask anything about ${activeRepo.name}…`
                  : 'Ask anything about the repo…'
              }
              className="input"
              disabled={isTyping}
            />
            <Button type="submit" disabled={isTyping || !input.trim()}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-display text-sm font-semibold">Suggested prompts</h3>
          <p className="mt-1 text-xs text-ink-500">Click any to send it instantly.</p>
          <div className="mt-3 flex flex-col gap-2">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => submit(p)}
                className="rounded-xl border border-ink-200 dark:border-ink-700 bg-white/70 dark:bg-ink-900/40 p-3 text-left text-sm transition hover:border-brand-300 hover:bg-brand-50/40 dark:hover:border-brand-500/40"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1">
            <Badge tone="info">Stored in sessionStorage</Badge>
            {activeRepo && <Badge tone="brand">Real-data answers</Badge>}
          </div>
        </Card>
      </div>
    </div>
  );
}
