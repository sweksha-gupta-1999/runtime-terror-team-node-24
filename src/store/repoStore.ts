import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import type { OnboardingArtifact, OnboardingLevel, Repository, TechStack } from '@/types';
import { readJSON, writeJSON } from '@/utils/storage';
import {
  generateArtifact,
  generateArtifactFromGitHub,
  repositoryFromGitHub,
} from '@/utils/artifact';
import { uid } from '@/utils/format';
import {
  fetchContributors,
  fetchLanguages,
  fetchRepo,
  fetchTextFile,
  fetchReadmeText,
  fetchTree,
  GitHubError,
  parseGitHubUrl,
} from '@/utils/github';
import repositoriesSeed from '@/data/repositories.json';

export interface FetchProgress {
  step: number; // 0..5
  label: string;
}

interface RepoState {
  repos: Repository[];
  recentIds: string[];
  artifacts: Record<string, OnboardingArtifact>;
  /** Active repo id used by the AI chat for context */
  activeRepoId?: string;

  setActiveRepo: (id?: string) => void;
  addRecent: (repoId: string) => void;
  cleanupRecents: () => void;

  /** Manual create (no GitHub URL) — used as a fallback */
  createRepoManual: (input: {
    name: string;
    url: string;
    stack: TechStack[];
    description?: string;
  }) => Repository;

  /**
   * Fetch a real GitHub repo (and all its companion data), build a Repository
   * + OnboardingArtifact, persist them, and return the new repo.
   * Throws GitHubError on rate-limit / 404 / network failure.
   */
  createRepoFromGitHub: (
    url: string,
    level: OnboardingLevel,
    onProgress?: (p: FetchProgress) => void,
  ) => Promise<Repository>;

  /** Refresh an existing GitHub-sourced repo's data + artifact */
  refreshRepoFromGitHub: (
    repoId: string,
    level?: OnboardingLevel,
  ) => Promise<Repository | undefined>;

  generateForRepo: (repoId: string, level: OnboardingLevel) => OnboardingArtifact;
  getArtifact: (repoId: string) => OnboardingArtifact | undefined;
  getRepo: (repoId: string) => Repository | undefined;
  clearArtifacts: () => void;
}

const seededRepos = repositoriesSeed as Repository[];

export const useRepoStore = create<RepoState>((set, get) => ({
  repos: mergeStored(seededRepos, readJSON<Repository[]>(STORAGE_KEYS.repos, [])),
  recentIds: readJSON<string[]>(STORAGE_KEYS.recentRepos, []),
  artifacts: readJSON<Record<string, OnboardingArtifact>>(STORAGE_KEYS.artifacts, {}),
  activeRepoId: readJSON<string | undefined>(STORAGE_KEYS.activeRepo, undefined),

  setActiveRepo: (id) => {
    writeJSON(STORAGE_KEYS.activeRepo, id);
    set({ activeRepoId: id });
  },

  addRecent: (repoId) => {
    if (!get().repos.some((repo) => repo.id === repoId)) return;
    const recent = [repoId, ...get().recentIds.filter((id) => id !== repoId)].slice(0, 6);
    writeJSON(STORAGE_KEYS.recentRepos, recent);
    set({ recentIds: recent });
  },

  cleanupRecents: () => {
    const repoIds = new Set(get().repos.map((repo) => repo.id));
    const recent = get().recentIds.filter((id) => repoIds.has(id));
    if (recent.length === get().recentIds.length) return;
    writeJSON(STORAGE_KEYS.recentRepos, recent);
    set({ recentIds: recent });
  },

  createRepoManual: ({ name, url, stack, description }) => {
    const repo: Repository = {
      id: uid('repo'),
      name,
      fullName: url.replace(/^https?:\/\/github\.com\//, '') || name,
      description: description?.trim() || 'Manually-added repository.',
      owner: url.split('/').filter(Boolean).slice(-2, -1)[0] || 'unknown',
      url,
      stars: 0,
      forks: 0,
      contributors: 1,
      language: stack[0] || 'TypeScript',
      stack,
      tags: ['manual'],
      lastUpdated: new Date().toISOString(),
      visibility: 'private',
      aiConfidence: 60 + Math.floor(Math.random() * 15),
      source: 'manual',
    };
    const next = [repo, ...get().repos];
    set({ repos: next });
    persistRepos(next);
    return repo;
  },

  createRepoFromGitHub: async (url, level, onProgress) => {
    const parsed = parseGitHubUrl(url);
    if (!parsed) throw new GitHubError('Invalid GitHub URL', 400, 'unknown');

    onProgress?.({ step: 0, label: `Looking up ${parsed.owner}/${parsed.repo}…` });
    const ghRepo = await fetchRepo(parsed.owner, parsed.repo);

    onProgress?.({ step: 1, label: 'Reading languages & topics…' });
    const languages = await fetchLanguages(parsed.owner, parsed.repo);

    onProgress?.({ step: 2, label: 'Pulling top contributors…' });
    let contributors: Awaited<ReturnType<typeof fetchContributors>> = [];
    try {
      contributors = await fetchContributors(parsed.owner, parsed.repo, 8);
    } catch (e) {
      if (e instanceof GitHubError && e.kind === 'rate_limit') throw e;
      contributors = [];
    }

    onProgress?.({ step: 3, label: 'Walking the file tree…' });
    let treeItems: Awaited<ReturnType<typeof fetchTree>>['tree'] = [];
    try {
      const tree = await fetchTree(parsed.owner, parsed.repo, ghRepo.default_branch);
      treeItems = tree.tree;
    } catch (e) {
      if (e instanceof GitHubError && e.kind === 'rate_limit') throw e;
      treeItems = [];
    }

    onProgress?.({ step: 4, label: 'Reading README + manifests…' });
    const [readmeText, packageJsonText] = await Promise.all([
      safeRead(() => fetchReadmeText(parsed.owner, parsed.repo)),
      treeItems.some((t) => t.path === 'package.json')
        ? safeRead(() => fetchTextFile(parsed.owner, parsed.repo, 'package.json'))
        : Promise.resolve(null),
    ]);

    onProgress?.({ step: 5, label: 'Composing artifact…' });

    const internalId = `gh_${parsed.owner}_${parsed.repo}`.toLowerCase();
    const repo = repositoryFromGitHub(ghRepo, languages, contributors, internalId);
    const artifact = generateArtifactFromGitHub({
      repo: ghRepo,
      languages,
      contributors,
      treeItems,
      readmeText,
      packageJsonText,
      level,
      internalRepoId: internalId,
    });

    // Persist
    const repoIdx = get().repos.findIndex((r) => r.id === internalId);
    const nextRepos =
      repoIdx >= 0
        ? get().repos.map((r, i) => (i === repoIdx ? repo : r))
        : [repo, ...get().repos];
    persistRepos(nextRepos);

    const nextArtifacts = { ...get().artifacts, [internalId]: artifact };
    writeJSON(STORAGE_KEYS.artifacts, nextArtifacts);
    set({ repos: nextRepos, artifacts: nextArtifacts });

    return repo;
  },

  refreshRepoFromGitHub: async (repoId, level) => {
    const repo = get().getRepo(repoId);
    if (!repo || repo.source !== 'github') return undefined;
    return get().createRepoFromGitHub(repo.url, level ?? 'Beginner');
  },

  generateForRepo: (repoId, level) => {
    const repo = get().repos.find((r) => r.id === repoId);
    if (!repo) throw new Error(`Repo ${repoId} not found`);
    const artifact = generateArtifact(repo, level);
    const next = { ...get().artifacts, [repoId]: artifact };
    writeJSON(STORAGE_KEYS.artifacts, next);
    set({ artifacts: next });
    return artifact;
  },

  getArtifact: (repoId) => get().artifacts[repoId],
  getRepo: (repoId) => get().repos.find((r) => r.id === repoId),

  clearArtifacts: () => {
    writeJSON(STORAGE_KEYS.artifacts, {});
    set({ artifacts: {} });
  },
}));

/* ------------------ helpers ------------------ */

async function safeRead<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof GitHubError && e.kind === 'rate_limit') throw e;
    return null;
  }
}

/** Merge persisted (user-added) repos with seeds, dedup by id. */
function mergeStored(seeds: Repository[], stored: Repository[]): Repository[] {
  const byId = new Map<string, Repository>();
  // Prefer stored (user changes win), then fall back to seeds
  stored.forEach((r) => byId.set(r.id, r));
  seeds.forEach((r) => {
    if (!byId.has(r.id)) byId.set(r.id, r);
  });
  return Array.from(byId.values());
}

function persistRepos(repos: Repository[]) {
  // Only persist non-seed (user-added) and any updated seed entries
  writeJSON(STORAGE_KEYS.repos, repos);
}
