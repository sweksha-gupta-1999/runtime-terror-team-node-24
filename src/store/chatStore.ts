import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import type { ChatMessage, OnboardingArtifact, Repository } from '@/types';
import { readJSON, writeJSON } from '@/utils/storage';
import { uid, timeAgo } from '@/utils/format';
import { useRepoStore } from '@/store/repoStore';

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  send: (content: string) => Promise<void>;
  clear: () => void;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a context-aware reply.
 * If there's an active repo, answers reference REAL facts (stars, license,
 * default branch, top contributors, detected stack, etc.). Falls back to
 * generic guidance when there's no repo selected.
 */
function buildReply(
  prompt: string,
  ctx: { repo?: Repository; artifact?: OnboardingArtifact },
): string {
  const text = prompt.toLowerCase().trim();
  const { repo, artifact } = ctx;

  if (!text) return greeting(repo);
  const repoName = repo ? repo.name : 'this repository';
  const repoLabel = repo ? `${repo.fullName}` : 'the active repository';

  // ---------- Helpers ----------
  const summarize = () => {
    if (!repo) return null;
    return [
      `Here's a quick read on **${repo.fullName}**:`,
      ``,
      `• ${repo.description}`,
      `• Primary language: ${repo.language}` +
        (repo.stack.length ? `; full stack: ${repo.stack.join(', ')}` : ''),
      `• ${repo.stars.toLocaleString()} stars · ${repo.forks.toLocaleString()} forks · ${
        repo.openIssues ?? 'unknown'
      } open issues`,
      repo.license ? `• License: ${repo.license}` : '',
      repo.defaultBranch ? `• Default branch: \`${repo.defaultBranch}\`` : '',
      `• Last pushed ${timeAgo(repo.lastUpdated)}`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  // ---------- Pattern routing ----------
  if (/^(hi|hey|hello|yo|sup)\b/.test(text)) return greeting(repo);

  if (/(summari[sz]e|what (does|is) this|tldr|overview)/.test(text)) {
    const s = summarize();
    if (s) return s;
    return `I can summarize once you open a repository — try the dashboard.`;
  }

  if (/(stars?|popular|how popular)/.test(text)) {
    if (!repo) return `Open any repo and I can give you exact star/fork counts.`;
    return `**${repo.fullName}** has **${repo.stars.toLocaleString()} stars**, **${repo.forks.toLocaleString()} forks**, and **${repo.openIssues ?? 0} open issues** as of the last sync.`;
  }

  if (/(license|legal|reuse|allowed)/.test(text)) {
    if (!repo) return `Open a repo first — I'll tell you its exact license.`;
    return repo.license
      ? `${repo.fullName} is licensed under **${repo.license}**. That generally permits use with attribution; check downstream compatibility for your project.`
      : `${repo.fullName} doesn't expose a SPDX license identifier — treat it as "all rights reserved" until you confirm with the maintainers.`;
  }

  if (/(branch|default branch|main|master)/.test(text)) {
    if (!repo?.defaultBranch) return `I don't have branch info for ${repoLabel}.`;
    return `The default branch on **${repo.fullName}** is **\`${repo.defaultBranch}\`** — that's where CI runs and where you should base feature branches.`;
  }

  if (/(contributors?|who maintains|owners?|maintainers?)/.test(text)) {
    if (!artifact?.contacts?.length)
      return `I'll list contributors after the artifact loads. Open the Team page once it's ready.`;
    const top = artifact.contacts.slice(0, 5);
    return [
      `Top contributors on **${repoName}** right now:`,
      ``,
      ...top.map(
        (c, i) =>
          `${i + 1}. **${c.name}** — ${c.role}${
            c.contributions ? ` (${c.contributions.toLocaleString()} commits)` : ''
          }`,
      ),
      ``,
      `You can DM them via the Team page — there's an "Ask SME" button on each card.`,
    ].join('\n');
  }

  if (/(stack|tech|languages?|written in)/.test(text)) {
    if (!repo) return `Open a repo and I'll tell you the detected stack.`;
    return `**${repo.fullName}** is primarily ${repo.language}. Detected stack: ${repo.stack
      .map((s) => `\`${s}\``)
      .join(', ')}.`;
  }

  if (/(deploy|deployment|release|ci|cd|pipeline)/.test(text)) {
    if (!artifact)
      return `Once the artifact is ready, the Deployment tab shows the actual stages.`;
    const stages = artifact.deployment.map((d, i) => `${i + 1}. **${d.stage}** — ${d.description} (${d.tool})`);
    return [`Deployment pipeline for **${repoName}**:`, ``, ...stages].join('\n');
  }

  if (/(env|environment|secrets?|variables?)/.test(text)) {
    if (!artifact) return `The Env Setup tab will list every variable the project expects.`;
    const required = artifact.envSetup.filter((e) => e.required);
    if (required.length === 0) return `No strictly required env vars detected for ${repoName}.`;
    return [
      `Required environment variables for **${repoName}**:`,
      ``,
      ...required.map((e) => `• \`${e.key}\` — ${e.description}`),
    ].join('\n');
  }

  if (/(build|run|start|local|dev server|how do i (run|start))/.test(text)) {
    if (!artifact) return `The Build & Run tab lists the exact commands.`;
    return [
      `To run **${repoName}** locally:`,
      ``,
      ...artifact.buildCommands.slice(0, 4).map((c) => `• **${c.label}** — \`${c.command}\``),
    ].join('\n');
  }

  if (/(error|issue|bug|build (fail|broken)|fail|stuck)/.test(text)) {
    if (!artifact) return `Once the artifact loads, the Common Issues tab lists the most frequent ones.`;
    return [
      `Top common issues for **${repoName}**:`,
      ``,
      ...artifact.commonIssues.slice(0, 4).map((c) => `• **${c.title}** (${c.severity}) — ${c.resolution}`),
    ].join('\n');
  }

  if (/(architecture|design|components|how is it (built|structured))/.test(text)) {
    if (!artifact) return `The Architecture tab has an interactive diagram.`;
    const nodes = artifact.architecture.nodes.map((n) => n.label).join(', ');
    return `${artifact.architecture.description}\n\nKey components: ${nodes}.`;
  }

  if (/(test|testing|coverage|spec)/.test(text)) {
    if (!artifact) return `Tests live in the Build & Run tab once the artifact loads.`;
    const cmd = artifact.buildCommands.find((c) => /test/i.test(c.label));
    return cmd
      ? `Run the test suite with \`${cmd.command}\`. ${cmd.description}`
      : `I couldn't detect a dedicated test script — check the README or CI workflow.`;
  }

  if (/(api|endpoints?|routes?)/.test(text)) {
    if (!artifact) return `The API Flow tab shows every endpoint once the artifact loads.`;
    if (artifact.apiFlow.length === 0)
      return `No HTTP API surface was detected for ${repoName} — it might be a library or a frontend-only project.`;
    return [
      `Headline API endpoints for **${repoName}**:`,
      ``,
      ...artifact.apiFlow.slice(0, 5).map((e) => `• **${e.method} ${e.path}** — ${e.description}`),
    ].join('\n');
  }

  if (/(where do i start|new joiner|first day|beginner|onboard|begin)/.test(text)) {
    if (!artifact) return `Open the Learning Path on any repo and I'll walk you through it.`;
    return [
      `Suggested first 3 steps for **${repoName}**:`,
      ``,
      ...artifact.learningPath.slice(0, 3).map((s, i) => `${i + 1}. **${s.title}** (~${s.estMinutes}m) — ${s.description}`),
      ``,
      `The full checklist is on the Learning Path page.`,
    ].join('\n');
  }

  if (/(folder|file|structure|tree|directory)/.test(text)) {
    if (!artifact) return `The Folder Structure tab visualizes the tree.`;
    const top = (artifact.folderStructure.children ?? []).map((c) => `\`${c.name}\``).join(', ');
    return `Top-level folders/files in **${repoName}**: ${top || 'none detected'}.`;
  }

  if (/(faq|question|frequently)/.test(text)) {
    if (!artifact) return `The FAQs tab lists the top questions.`;
    return artifact.faqs
      .slice(0, 3)
      .map((f, i) => `**${i + 1}. ${f.q}**\n${f.a}`)
      .join('\n\n');
  }

  if (/(thanks|thank you|ty)/.test(text)) {
    return `Anytime. If you get stuck, "Ask SME" on the Team page sends a real ping to the right contributor.`;
  }

  // Generic, repo-aware fallback
  if (repo) {
    return [
      `Hmm — I don't have a confident answer for that yet.`,
      ``,
      `Here's what I'd check next on **${repo.fullName}**:`,
      `• The README at ${repo.url}#readme`,
      `• The Architecture tab for a quick mental model`,
      `• The Team page — the top contributor is your fastest path to an answer`,
      ``,
      `Or rephrase your question and I'll try again.`,
    ].join('\n');
  }
  return `Open any repository from the dashboard and ask me again — I answer with real facts about the active repo.`;
}

function greeting(repo?: Repository): string {
  if (repo)
    return `Hi! I'm your onboarding co-pilot. I can answer questions about **${repo.fullName}** — its stack, contributors, deployment, common issues, anything. What do you want to know first?`;
  return `Hi! I'm your onboarding co-pilot. Open a repository to get repo-specific answers, or ask me a general onboarding question.`;
}

const initialMessages: ChatMessage[] = readJSON<ChatMessage[]>(
  STORAGE_KEYS.chatSession,
  [
    {
      id: uid('msg'),
      role: 'assistant',
      content: greeting(),
      timestamp: Date.now(),
    },
  ],
  'session',
);

export const useChatStore = create<ChatState>((set, get) => ({
  messages: initialMessages,
  isTyping: false,

  send: async (content) => {
    const userMsg: ChatMessage = {
      id: uid('msg'),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };
    const afterUser = [...get().messages, userMsg];
    set({ messages: afterUser, isTyping: true });
    writeJSON(STORAGE_KEYS.chatSession, afterUser, 'session');

    // Pull active repo + artifact from the repo store at reply time
    const repoStore = useRepoStore.getState();
    const activeRepo = repoStore.activeRepoId ? repoStore.getRepo(repoStore.activeRepoId) : undefined;
    const activeArtifact = activeRepo ? repoStore.getArtifact(activeRepo.id) : undefined;

    const reply = buildReply(content, { repo: activeRepo, artifact: activeArtifact });
    await delay(420 + Math.min(1400, reply.length * 5));

    const aiMsg: ChatMessage = {
      id: uid('msg'),
      role: 'assistant',
      content: reply,
      timestamp: Date.now(),
    };
    const afterAi = [...get().messages, aiMsg];
    set({ messages: afterAi, isTyping: false });
    writeJSON(STORAGE_KEYS.chatSession, afterAi, 'session');
  },

  clear: () => {
    const repoStore = useRepoStore.getState();
    const activeRepo = repoStore.activeRepoId ? repoStore.getRepo(repoStore.activeRepoId) : undefined;
    const greet: ChatMessage = {
      id: uid('msg'),
      role: 'assistant',
      content: greeting(activeRepo),
      timestamp: Date.now(),
    };
    set({ messages: [greet] });
    writeJSON(STORAGE_KEYS.chatSession, [greet], 'session');
  },
}));
