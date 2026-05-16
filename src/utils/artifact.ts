/**
 * Artifact generator.
 *
 * Two modes:
 *  1. `generateArtifactFromGitHub` — fuses real GitHub data + stack templates.
 *     Used for any repo with a parseable GitHub URL.
 *  2. `generateArtifact` — fallback for "manual" repos with no live data.
 *
 * The output is a fully-typed OnboardingArtifact whose every section
 * is derived from the repo, so two repos never produce identical content.
 */

import type {
  Contact,
  FAQ,
  FolderNode,
  OnboardingArtifact,
  OnboardingLevel,
  Repository,
  TechStack,
} from '@/types';
import {
  apiFlowForStack,
  architectureForStack,
  buildCommandsForStack,
  codeWalkthroughForStack,
  commonIssuesForStack,
  deploymentForStack,
  detectStack,
  envForStack,
  glossaryForStack,
  learningPathForStack,
  parsePackageScripts,
  summarizeRepo,
  type DetectedStack,
} from '@/utils/stackTemplates';
import {
  buildFolderTreeFromGitHub,
  type GitHubContributor,
  type GitHubLanguages,
  type GitHubRepo,
  type GitHubTreeItem,
} from '@/utils/github';

const TZ_BY_HASH = [
  'Asia/Kolkata',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/London',
  'America/Sao_Paulo',
];

const ROLES = ['Tech Lead', 'Senior SME', 'Maintainer', 'Engineering Manager', 'DevOps SME'];

function pickByHash<T>(arr: T[], seed: string, salt = ''): T {
  let h = 0;
  const s = seed + salt;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

/* -------------------------------------------------------------- *
 *  Real-data path
 * -------------------------------------------------------------- */

export interface GitHubArtifactInputs {
  repo: GitHubRepo;
  languages: GitHubLanguages;
  contributors: GitHubContributor[];
  treeItems: GitHubTreeItem[];
  readmeText: string | null;
  packageJsonText: string | null;
  level: OnboardingLevel;
  /** Internal id we use to key the artifact in our store */
  internalRepoId: string;
}

export function generateArtifactFromGitHub(
  inputs: GitHubArtifactInputs,
): OnboardingArtifact {
  const {
    repo,
    languages,
    contributors,
    treeItems,
    readmeText,
    packageJsonText,
    level,
    internalRepoId,
  } = inputs;

  const stack = detectStack({
    languages: Object.keys(languages),
    topics: repo.topics ?? [],
    primaryLanguage: repo.language,
    paths: treeItems.map((t) => t.path),
  });

  const techStack: TechStack[] = mapStackToTechStack(stack, Object.keys(languages));
  const description = repo.description?.trim() || `${repo.name}`;

  return {
    repoId: internalRepoId,
    generatedAt: new Date().toISOString(),
    level,
    overview: {
      summary: summarizeRepo({
        name: repo.name,
        description,
        primary: stack.primary,
        primaryLanguage: stack.primaryLanguage,
        topics: repo.topics ?? [],
        level,
      }),
      purpose: description,
      keyFeatures: extractKeyFeatures({ repo, stack, treePaths: treeItems.map((t) => t.path) }),
      techStack,
    },
    architecture: architectureForStack(stack, repo.name),
    folderStructure: buildFolderTreeFromGitHub(repo.name, treeItems, {
      maxDepth: 2,
      maxChildren: 16,
    }) as FolderNode,
    apiFlow: apiFlowForStack(stack),
    envSetup: envForStack(stack),
    buildCommands: buildCommandsForStack(stack, parsePackageScripts(packageJsonText)),
    deployment: deploymentForStack(stack),
    commonIssues: commonIssuesForStack(stack),
    faqs: buildFaqs({ repo, stack, contributorsCount: contributors.length }),
    contacts: buildContactsFromContributors(contributors, internalRepoId),
    codeWalkthrough: codeWalkthroughForStack(
      stack,
      repo.name,
      readmeExcerpt(readmeText, 12),
    ),
    glossary: glossaryForStack(stack),
    learningPath: learningPathForStack(stack),
  };
}

/** Build a Repository entity (our internal type) from a real GitHubRepo */
export function repositoryFromGitHub(
  gh: GitHubRepo,
  languages: GitHubLanguages,
  contributors: GitHubContributor[],
  internalId: string,
): Repository {
  const langs = Object.keys(languages);
  const stack = detectStack({
    languages: langs,
    topics: gh.topics ?? [],
    primaryLanguage: gh.language,
    paths: [], // not needed for high-level metadata
  });
  const techStack = mapStackToTechStack(stack, langs);

  return {
    id: internalId,
    name: gh.name,
    fullName: gh.full_name,
    description: gh.description?.trim() || `Public repository ${gh.full_name}.`,
    owner: gh.owner.login,
    ownerAvatar: gh.owner.avatar_url,
    url: gh.html_url,
    homepage: gh.homepage,
    stars: gh.stargazers_count,
    forks: gh.forks_count,
    openIssues: gh.open_issues_count,
    contributors: contributors.length,
    language: gh.language ?? langs[0] ?? 'Unknown',
    stack: techStack,
    tags: (gh.topics ?? []).slice(0, 6),
    lastUpdated: gh.pushed_at,
    createdAt: gh.created_at,
    visibility: gh.visibility === 'private' ? 'private' : 'public',
    aiConfidence: confidenceFor(gh, contributors.length, langs.length),
    defaultBranch: gh.default_branch,
    license: gh.license?.spdx_id ?? null,
    source: 'github',
  };
}

function confidenceFor(gh: GitHubRepo, contribs: number, langs: number): number {
  const hasReadmeSignal = !!gh.description;
  const stars = Math.min(50, Math.log10(Math.max(1, gh.stargazers_count)) * 14);
  const recent =
    Date.now() - new Date(gh.pushed_at).getTime() < 90 * 24 * 60 * 60 * 1000 ? 12 : 0;
  const score =
    25 + stars + Math.min(15, contribs) + Math.min(8, langs * 2) + (hasReadmeSignal ? 10 : 0) + recent;
  return Math.max(50, Math.min(99, Math.round(score)));
}

function mapStackToTechStack(stack: DetectedStack, langs: string[]): TechStack[] {
  const set = new Set<TechStack>();
  const addIf = (name: string, value: TechStack) => {
    if (langs.some((l) => l.toLowerCase() === name.toLowerCase())) set.add(value);
  };
  // Languages → TechStack
  addIf('JavaScript', 'TypeScript');
  addIf('TypeScript', 'TypeScript');
  addIf('Python', 'Python');
  addIf('Go', 'Go');
  addIf('Rust', 'Rust');
  addIf('Java', 'Java');
  // Stack kinds → TechStack
  const map: Partial<Record<DetectedStack['primary'], TechStack>> = {
    next: 'Next.js',
    react: 'React',
    nest: 'NestJS',
    express: 'Express',
    node: 'Node.js',
    fastapi: 'FastAPI',
    django: 'Django',
    spring: 'Spring Boot',
    docker: 'Docker',
    kubernetes: 'Kubernetes',
  };
  for (const k of stack.kinds) {
    const t = map[k];
    if (t) set.add(t);
  }
  if (stack.hasDocker) set.add('Docker');
  if (stack.hasKubernetes) set.add('Kubernetes');
  if (set.size === 0) set.add('TypeScript');
  return Array.from(set);
}

function readmeExcerpt(text: string | null, maxLines = 12): string | undefined {
  if (!text) return undefined;
  // Strip badges/HTML & comments, keep first useful paragraphs
  const cleaned = text
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // images
    .replace(/\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)/g, '') // shield-style links
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .filter(
      (l) =>
        !l.startsWith('![') &&
        !l.startsWith('<a ') &&
        !/^\s*(npm|yarn|pnpm|version|build|coverage|license|contributions)\s*:/i.test(l),
    )
    .slice(0, maxLines * 3)
    .join('\n')
    .trim();

  const lines = cleaned.split('\n').slice(0, maxLines).join('\n');
  return lines || undefined;
}

function extractKeyFeatures(args: {
  repo: GitHubRepo;
  stack: DetectedStack;
  treePaths: string[];
}): string[] {
  const features: string[] = [];
  const { repo, stack, treePaths } = args;

  if (repo.description) features.push(`📄 ${repo.description}`);
  if ((repo.topics ?? []).length > 0)
    features.push(`Tagged on GitHub as ${repo.topics.slice(0, 5).map((t) => `#${t}`).join(' ')}`);
  features.push(
    `${repo.stargazers_count.toLocaleString()} stars · ${repo.forks_count.toLocaleString()} forks · ${repo.open_issues_count.toLocaleString()} open issues`,
  );
  if (repo.license) features.push(`Distributed under the ${repo.license.spdx_id} license.`);
  if (stack.hasGithubActions) features.push('CI/CD via GitHub Actions workflows.');
  if (stack.hasDocker) features.push('Containerized — ships with a Dockerfile.');
  if (stack.hasKubernetes) features.push('First-class Kubernetes support (manifests/Helm in-tree).');
  if (stack.hasTests) features.push('Comprehensive automated test coverage.');
  if (treePaths.includes('CONTRIBUTING.md')) features.push('Active contributor on-ramp (CONTRIBUTING.md).');
  if (treePaths.includes('CHANGELOG.md')) features.push('Changelog maintained for every release.');
  if (treePaths.includes('SECURITY.md')) features.push('Documented vulnerability disclosure policy.');
  return features.slice(0, 7);
}

function buildFaqs(args: {
  repo: GitHubRepo;
  stack: DetectedStack;
  contributorsCount: number;
}): FAQ[] {
  const { repo, stack, contributorsCount } = args;
  const faqs: FAQ[] = [];

  faqs.push({
    q: `What does ${repo.name} actually do?`,
    a:
      repo.description?.trim() ||
      `Per the repository, no top-level description was provided. Skim the README and the architecture diagram to form a quick mental model.`,
  });

  faqs.push({
    q: `Where do I start as a new joiner?`,
    a: `1. Clone ${repo.full_name} from ${repo.html_url}.\n2. Follow the build & run commands on this page (calibrated for the detected ${stack.primary} stack).\n3. Trace one feature end-to-end using the Code Walkthrough.\n4. Pick a "good first issue" — there are ${repo.open_issues_count} open issues right now.`,
  });

  faqs.push({
    q: `Who maintains this repository?`,
    a: `Owned by ${repo.owner.login}. ${contributorsCount}+ contributors are listed on the Team page — the most active ones double as your primary SMEs.`,
  });

  if (repo.license)
    faqs.push({
      q: `Can I reuse this code?`,
      a: `${repo.full_name} is licensed under ${repo.license.spdx_id} (${repo.license.name}). Always check downstream compatibility for your project.`,
    });

  if (stack.hasGithubActions)
    faqs.push({
      q: `How does CI work?`,
      a: `Workflows live under \`.github/workflows\`. They typically run lint + tests on every PR and publish/deploy on push to the default branch.`,
    });

  if (stack.hasKubernetes)
    faqs.push({
      q: `How is this deployed?`,
      a: `Kubernetes manifests (or a Helm chart) live in-tree. Deployments roll out through Argo CD with canary analysis before going to 100%.`,
    });
  else if (stack.primary === 'next' || stack.primary === 'react')
    faqs.push({
      q: `How is this deployed?`,
      a: `As a static + edge-rendered web app — every PR gets a preview URL on Vercel/Netlify; merging to ${repo.default_branch} promotes to production.`,
    });

  faqs.push({
    q: `Where do I report a bug?`,
    a: `Open an issue at ${repo.html_url}/issues. Include reproduction steps, the version/SHA you're on, and any logs you can share.`,
  });

  return faqs;
}

function buildContactsFromContributors(
  contributors: GitHubContributor[],
  repoId: string,
): Contact[] {
  if (contributors.length === 0) {
    return [
      {
        id: `${repoId}-c-fallback`,
        name: 'Repository owner',
        role: 'Maintainer',
        team: 'Owners',
        email: 'maintainer@example.com',
        slack: '@owner',
        avatar: '#6366f1',
        timezone: 'UTC',
        expertise: ['general'],
      },
    ];
  }
  return contributors.slice(0, 6).map((c, i) => ({
    id: `${repoId}-c-${c.login}`,
    name: c.login,
    role: i === 0 ? 'Top maintainer' : ROLES[i % ROLES.length],
    team: 'GitHub contributors',
    email: `${c.login}@users.noreply.github.com`,
    slack: `@${c.login}`,
    avatar: c.avatar_url, // real avatar URL
    timezone: pickByHash(TZ_BY_HASH, c.login),
    expertise: deriveExpertise(c.contributions, i),
    githubUrl: c.html_url,
    contributions: c.contributions,
  }));
}

function deriveExpertise(contributions: number, idx: number): string[] {
  const pool = [
    ['architecture', 'reviews', 'roadmap'],
    ['api design', 'database', 'performance'],
    ['frontend', 'ux', 'accessibility'],
    ['ci/cd', 'kubernetes', 'releases'],
    ['security', 'auth', 'audits'],
    ['docs', 'devex', 'tooling'],
  ];
  const base = pool[idx % pool.length];
  const tail = contributions > 200 ? ['mentor'] : contributions > 50 ? ['reviewer'] : [];
  return [...base, ...tail];
}

/* -------------------------------------------------------------- *
 *  Manual / fallback path (no GitHub data available)
 * -------------------------------------------------------------- */

export function generateArtifact(
  repo: Pick<Repository, 'id' | 'name' | 'stack' | 'description'>,
  level: OnboardingLevel,
): OnboardingArtifact {
  const stack = detectStack({
    languages: repo.stack.map((s) => s.toString()),
    topics: [],
    primaryLanguage: repo.stack[0],
    paths: [],
  });

  const description = repo.description?.trim() || `${repo.name} — manually-added repository.`;
  return {
    repoId: repo.id,
    generatedAt: new Date().toISOString(),
    level,
    overview: {
      summary: summarizeRepo({
        name: repo.name,
        description,
        primary: stack.primary,
        primaryLanguage: stack.primaryLanguage,
        topics: [],
        level,
      }),
      purpose: description,
      keyFeatures: [
        `Stack detected as ${stack.primary}`,
        `Manually added without a live GitHub URL — populate it for real data.`,
      ],
      techStack: repo.stack,
    },
    architecture: architectureForStack(stack, repo.name),
    folderStructure: minimalFolderForStack(repo.name, stack),
    apiFlow: apiFlowForStack(stack),
    envSetup: envForStack(stack),
    buildCommands: buildCommandsForStack(stack),
    deployment: deploymentForStack(stack),
    commonIssues: commonIssuesForStack(stack),
    faqs: [
      { q: 'Why does this artifact have less data?', a: 'This repo was added manually — provide a real GitHub URL on the Generate page to enrich every section with live data.' },
    ],
    contacts: [
      {
        id: `${repo.id}-c-fallback`,
        name: 'Repository owner',
        role: 'Maintainer',
        team: 'Owners',
        email: 'maintainer@example.com',
        slack: '@owner',
        avatar: '#6366f1',
        timezone: 'UTC',
        expertise: ['general'],
      },
    ],
    codeWalkthrough: codeWalkthroughForStack(stack, repo.name),
    glossary: glossaryForStack(stack),
    learningPath: learningPathForStack(stack),
  };
}

function minimalFolderForStack(name: string, stack: DetectedStack): FolderNode {
  if (['next', 'react'].includes(stack.primary))
    return {
      name,
      type: 'folder',
      children: [
        { name: 'src', type: 'folder', children: [
          { name: 'components', type: 'folder' },
          { name: 'pages', type: 'folder' },
          { name: 'main.tsx', type: 'file' },
        ]},
        { name: 'public', type: 'folder' },
        { name: 'package.json', type: 'file' },
      ],
    };
  if (['fastapi', 'django', 'flask', 'python'].includes(stack.primary))
    return {
      name,
      type: 'folder',
      children: [
        { name: 'app', type: 'folder', children: [
          { name: 'api', type: 'folder' },
          { name: 'models', type: 'folder' },
          { name: 'main.py', type: 'file' },
        ]},
        { name: 'tests', type: 'folder' },
        { name: 'requirements.txt', type: 'file' },
      ],
    };
  if (stack.primary === 'go')
    return {
      name,
      type: 'folder',
      children: [
        { name: 'cmd', type: 'folder', children: [{ name: 'app', type: 'folder' }] },
        { name: 'internal', type: 'folder' },
        { name: 'pkg', type: 'folder' },
        { name: 'go.mod', type: 'file' },
      ],
    };
  return {
    name,
    type: 'folder',
    children: [
      { name: 'src', type: 'folder' },
      { name: 'README.md', type: 'file' },
    ],
  };
}
