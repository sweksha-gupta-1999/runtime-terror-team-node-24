/**
 * Lightweight GitHub REST client used by the onboarding generator.
 *
 * Frontend-only — uses the public, unauthenticated GitHub API
 * (60 requests/hour/IP). Each fetch is cached in localStorage for 24h
 * so repeated views of the same repo are instant and don't burn quota.
 */

import { readJSON, writeJSON } from '@/utils/storage';

const API_BASE = 'https://api.github.com';
const CACHE_PREFIX = 'roai-gh-cache:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 3000;
const QUEUE_GAP_MS = 120;

let requestQueue: Promise<void> = Promise.resolve();

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  owner: { login: string; avatar_url: string; html_url: string };
  html_url: string;
  homepage: string | null;
  default_branch: string;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count?: number;
  pushed_at: string;
  updated_at: string;
  created_at: string;
  size: number;
  license: { spdx_id: string; name: string } | null;
  visibility: string;
  archived: boolean;
}

export interface GitHubLanguages {
  [language: string]: number; // bytes
}

export interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  size?: number;
  sha: string;
  url: string;
}

export interface GitHubTree {
  sha: string;
  truncated: boolean;
  tree: GitHubTreeItem[];
}

export interface GitHubReadme {
  name: string;
  path: string;
  encoding: 'base64';
  content: string;
  html_url: string;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  encoding: 'base64' | 'none';
  content?: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

export interface GitHubRelease {
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: { name: string; color: string }[];
  user: { login: string };
  created_at: string;
  html_url: string;
  pull_request?: object;
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public kind: 'not_found' | 'rate_limit' | 'network' | 'unknown',
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

/** Parse `owner/repo` from any GitHub URL or shorthand */
export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  if (!input) return null;
  const trimmed = input.trim();

  // owner/repo shorthand
  const short = trimmed.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (short) return { owner: short[1], repo: short[2] };

  // Full URL
  const url = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/#?].*)?$/i,
  );
  if (url) return { owner: url[1], repo: url[2] };

  return null;
}

interface CacheEntry<T> {
  ts: number;
  value: T;
}

function cacheKey(path: string) {
  return CACHE_PREFIX + path;
}

function readCache<T>(path: string): T | null {
  const entry = readJSON<CacheEntry<T> | null>(cacheKey(path), null);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
  return entry.value;
}

function readAnyCache<T>(path: string): T | null {
  const entry = readJSON<CacheEntry<T> | null>(cacheKey(path), null);
  return entry?.value ?? null;
}

function writeCache<T>(path: string, value: T) {
  writeJSON<CacheEntry<T>>(cacheKey(path), { ts: Date.now(), value });
}

async function ghFetch<T>(path: string, opts?: { fresh?: boolean }): Promise<T> {
  if (!opts?.fresh) {
    const cached = readCache<T>(path);
    if (cached) return cached;
  }

  return enqueueGitHubRequest(async () => {
    const stale = opts?.fresh ? null : readAnyCache<T>(path);
    const res = await fetchWithRetry(path);

    if (res.status === 404) {
      throw new GitHubError('Repository not found on GitHub', 404, 'not_found');
    }
    if (res.status === 403 || res.status === 429) {
      if (stale) return stale;
      throw new GitHubError(rateLimitMessage(res), res.status, 'rate_limit');
    }
    if (!res.ok) {
      throw new GitHubError(`GitHub returned ${res.status}`, res.status, 'unknown');
    }

    const data = (await res.json()) as T;
    writeCache(path, data);
    return data;
  });
}

function enqueueGitHubRequest<T>(task: () => Promise<T>): Promise<T> {
  const run = requestQueue.then(async () => {
    await delay(QUEUE_GAP_MS);
    return task();
  });
  requestQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function fetchWithRetry(path: string, attempt = 0): Promise<Response> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (attempt < MAX_RETRIES && shouldRetry(res)) {
      const waitMs = retryDelayFor(res, attempt);
      if (waitMs !== null) {
        await delay(waitMs);
        return fetchWithRetry(path, attempt + 1);
      }
    }

    return res;
  } catch {
    if (attempt < MAX_RETRIES) {
      await delay(backoffDelay(attempt));
      return fetchWithRetry(path, attempt + 1);
    }
    throw new GitHubError('Network error reaching GitHub', 0, 'network');
  }
}

function shouldRetry(res: Response): boolean {
  return (
    res.status >= 500 ||
    res.status === 429 ||
    (res.status === 403 &&
      (Boolean(res.headers.get('retry-after')) ||
        res.headers.get('x-ratelimit-remaining') === '0'))
  );
}

function retryDelayFor(res: Response, attempt: number): number | null {
  const retryAfter = retryAfterFrom(res);
  if (retryAfter !== null) {
    return retryAfter <= MAX_RETRY_DELAY_MS ? retryAfter : null;
  }
  return backoffDelay(attempt);
}

function backoffDelay(attempt: number): number {
  return Math.min(500 * 2 ** attempt, MAX_RETRY_DELAY_MS);
}

function retryAfterFrom(res: Response): number | null {
  const retryAfter = res.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

    const dateMs = Date.parse(retryAfter);
    if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());
  }

  const reset = Number(res.headers.get('x-ratelimit-reset'));
  if (Number.isFinite(reset)) return Math.max(0, reset * 1000 - Date.now());

  return null;
}

function rateLimitMessage(res: Response): string {
  const base = 'GitHub API rate limit reached (60 requests/hour for unauthenticated users).';
  const retryAfter = retryAfterFrom(res);
  if (retryAfter && retryAfter > 0) {
    const resetAt = new Date(Date.now() + retryAfter).toLocaleTimeString();
    return `${base} Try again after ${resetAt} or use the seeded repos.`;
  }
  return `${base} Try again later or use the seeded repos.`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ----------------------- Endpoints ----------------------- */

export function fetchRepo(owner: string, repo: string) {
  return ghFetch<GitHubRepo>(`/repos/${owner}/${repo}`);
}

export function fetchLanguages(owner: string, repo: string) {
  return ghFetch<GitHubLanguages>(`/repos/${owner}/${repo}/languages`);
}

export function fetchContributors(owner: string, repo: string, perPage = 8) {
  return ghFetch<GitHubContributor[]>(
    `/repos/${owner}/${repo}/contributors?per_page=${perPage}`,
  );
}

export function fetchTree(owner: string, repo: string, branch: string) {
  return ghFetch<GitHubTree>(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
}

export async function fetchReadmeText(owner: string, repo: string): Promise<string | null> {
  try {
    const r = await ghFetch<GitHubReadme>(`/repos/${owner}/${repo}/readme`);
    if (!r?.content) return null;
    return decodeBase64Utf8(r.content);
  } catch (e) {
    if (e instanceof GitHubError && e.kind === 'not_found') return null;
    throw e;
  }
}

export async function fetchTextFile(
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  try {
    const f = await ghFetch<GitHubFileContent>(
      `/repos/${owner}/${repo}/contents/${path}`,
    );
    if (!f?.content || f.encoding !== 'base64') return null;
    return decodeBase64Utf8(f.content);
  } catch (e) {
    if (e instanceof GitHubError && e.kind === 'not_found') return null;
    throw e;
  }
}

export function fetchReleases(owner: string, repo: string, perPage = 5) {
  return ghFetch<GitHubRelease[]>(`/repos/${owner}/${repo}/releases?per_page=${perPage}`);
}

export function fetchRecentIssues(owner: string, repo: string, perPage = 8) {
  return ghFetch<GitHubIssue[]>(
    `/repos/${owner}/${repo}/issues?state=open&per_page=${perPage}`,
  );
}

/* ----------------------- Helpers ----------------------- */

/** Decode a base64 string that may contain UTF-8 (READMEs often do). */
function decodeBase64Utf8(b64: string): string {
  const clean = b64.replace(/\s/g, '');
  try {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    try {
      return atob(clean);
    } catch {
      return '';
    }
  }
}

/** Convert GitHub tree paths into a hierarchical FolderNode structure. */
export interface SimpleFolderNode {
  name: string;
  type: 'folder' | 'file';
  description?: string;
  children?: SimpleFolderNode[];
}

export function buildFolderTreeFromGitHub(
  rootName: string,
  tree: GitHubTreeItem[],
  opts: { maxDepth?: number; maxChildren?: number } = {},
): SimpleFolderNode {
  const maxDepth = opts.maxDepth ?? 2;
  const maxChildren = opts.maxChildren ?? 14;
  const root: SimpleFolderNode = { name: rootName, type: 'folder', children: [] };

  for (const item of tree) {
    if (!item.path) continue;
    const parts = item.path.split('/');
    if (parts.length > maxDepth + 1) continue;
    let cursor = root;
    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1;
      const name = parts[i];
      cursor.children = cursor.children ?? [];
      let child = cursor.children.find((c) => c.name === name);
      if (!child) {
        child = {
          name,
          type: isLast && item.type === 'blob' ? 'file' : 'folder',
          children: [],
        };
        cursor.children.push(child);
      }
      cursor = child;
    }
  }

  // Sort & cap children depth-first
  const dfs = (node: SimpleFolderNode) => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    if (node.children.length > maxChildren) {
      const overflow = node.children.length - maxChildren;
      node.children = node.children.slice(0, maxChildren);
      node.children.push({
        name: `… (+${overflow} more)`,
        type: 'file',
        description: 'Truncated for readability',
      });
    }
    node.children.forEach(dfs);
    if (node.type === 'file') delete node.children;
  };
  dfs(root);
  return root;
}

/** Sum language byte counts → percentage breakdown */
export function languagesToPercent(
  langs: GitHubLanguages,
): { name: string; value: number }[] {
  const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(langs)
    .map(([name, bytes]) => ({ name, value: Math.round((bytes / total) * 100) }))
    .sort((a, b) => b.value - a.value);
}
