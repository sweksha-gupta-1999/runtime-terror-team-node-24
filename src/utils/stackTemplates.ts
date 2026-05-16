/**
 * Stack detection + stack-specific section templates.
 *
 * Given a real GitHub repo's languages, topics, and file tree, we
 * synthesize an artifact that is genuinely different per repo —
 * different env vars, build commands, architecture, common issues, etc.
 */

import type {
  ApiEndpoint,
  ArchitectureEdge,
  ArchitectureNode,
  CodeWalkthroughStep,
  CommonIssue,
  GlossaryItem,
  LearningStep,
} from '@/types';

export type StackKind =
  | 'next'
  | 'react'
  | 'node'
  | 'express'
  | 'nest'
  | 'python'
  | 'fastapi'
  | 'django'
  | 'flask'
  | 'go'
  | 'java'
  | 'spring'
  | 'rust'
  | 'docker'
  | 'kubernetes'
  | 'unknown';

export interface DetectedStack {
  kinds: StackKind[]; // ordered, primary first
  primary: StackKind;
  primaryLanguage: string;
  hasDocker: boolean;
  hasKubernetes: boolean;
  hasGithubActions: boolean;
  hasTests: boolean;
}

/** Detect stack from GitHub languages + file tree paths */
export function detectStack(input: {
  languages: string[];
  topics?: string[];
  primaryLanguage?: string | null;
  paths: string[];
}): DetectedStack {
  const paths = input.paths.map((p) => p.toLowerCase());
  const langs = new Set(input.languages.map((l) => l.toLowerCase()));
  const topics = new Set((input.topics ?? []).map((t) => t.toLowerCase()));
  const has = (needle: string) => paths.some((p) => p.includes(needle));

  const kinds: StackKind[] = [];

  // JS/TS family
  const isNode =
    has('package.json') || langs.has('javascript') || langs.has('typescript');
  if (has('next.config.js') || has('next.config.ts') || topics.has('nextjs')) kinds.push('next');
  if (has('vite.config.ts') || has('vite.config.js') || topics.has('react')) {
    if (!kinds.includes('next')) kinds.push('react');
  }
  if (
    has('nest-cli.json') ||
    paths.some((p) => p.includes('nestjs')) ||
    topics.has('nestjs')
  )
    kinds.push('nest');
  if (
    !kinds.includes('nest') &&
    !kinds.includes('next') &&
    paths.some((p) => p.endsWith('app.js') || p.endsWith('server.js'))
  )
    kinds.push('express');
  if (isNode && !kinds.some((k) => ['next', 'react', 'nest', 'express'].includes(k)))
    kinds.push('node');

  // Python
  if (langs.has('python')) {
    if (has('manage.py') || topics.has('django')) kinds.push('django');
    else if (has('main.py') && (has('fastapi') || topics.has('fastapi'))) kinds.push('fastapi');
    else if (topics.has('flask')) kinds.push('flask');
    else kinds.push('python');
  }

  if (langs.has('go') || has('go.mod')) kinds.push('go');
  if (langs.has('java')) kinds.push('java');
  if (has('pom.xml') || has('build.gradle') || topics.has('spring-boot')) kinds.push('spring');
  if (langs.has('rust') || has('cargo.toml')) kinds.push('rust');

  const hasDocker = has('dockerfile') || has('docker-compose');
  const hasKubernetes =
    has('helm/') || has('chart.yaml') || has('k8s/') || has('kubernetes/');
  const hasGithubActions = has('.github/workflows');
  const hasTests = paths.some(
    (p) => p.includes('/test') || p.includes('__tests__') || p.endsWith('_test.go'),
  );

  if (hasDocker) kinds.push('docker');
  if (hasKubernetes) kinds.push('kubernetes');

  if (kinds.length === 0) kinds.push('unknown');

  return {
    kinds,
    primary: kinds[0],
    primaryLanguage: input.primaryLanguage ?? input.languages[0] ?? 'Unknown',
    hasDocker,
    hasKubernetes,
    hasGithubActions,
    hasTests,
  };
}

/* ---------------------------------------------------------------- *
 *  Per-stack section content
 *  Each function returns content that is genuinely different.
 * ---------------------------------------------------------------- */

export function envForStack(stack: DetectedStack) {
  const base: { key: string; example: string; required: boolean; description: string }[] = [];

  switch (stack.primary) {
    case 'next':
      base.push(
        { key: 'NEXT_PUBLIC_API_URL', example: 'https://api.example.com', required: true, description: 'Public-facing API base URL exposed to the client.' },
        { key: 'NEXTAUTH_SECRET', example: 'a-32-byte-random-string', required: true, description: 'Secret used to sign NextAuth.js sessions.' },
        { key: 'NEXTAUTH_URL', example: 'http://localhost:3000', required: true, description: 'Canonical site URL used for OAuth callbacks.' },
        { key: 'DATABASE_URL', example: 'postgres://user:pass@localhost:5432/app', required: true, description: 'Database connection string.' },
      );
      break;
    case 'react':
      base.push(
        { key: 'VITE_API_URL', example: 'https://api.example.com', required: true, description: 'API base URL exposed to the React app at build time.' },
        { key: 'VITE_SENTRY_DSN', example: '', required: false, description: 'Optional Sentry DSN for client-side error reporting.' },
      );
      break;
    case 'nest':
      base.push(
        { key: 'PORT', example: '3000', required: true, description: 'HTTP port the NestJS server listens on.' },
        { key: 'JWT_SECRET', example: 'change-me', required: true, description: 'Secret used to sign JWT access tokens.' },
        { key: 'DATABASE_URL', example: 'postgres://user:pass@localhost:5432/app', required: true, description: 'Postgres connection string consumed by TypeORM/Prisma.' },
        { key: 'REDIS_URL', example: 'redis://localhost:6379', required: false, description: 'Optional cache/queue store.' },
      );
      break;
    case 'express':
    case 'node':
      base.push(
        { key: 'NODE_ENV', example: 'development', required: true, description: 'Runtime mode (development/test/production).' },
        { key: 'PORT', example: '8080', required: true, description: 'HTTP port to listen on.' },
        { key: 'DATABASE_URL', example: 'postgres://user:pass@localhost:5432/app', required: false, description: 'Optional DB connection string.' },
      );
      break;
    case 'fastapi':
      base.push(
        { key: 'APP_ENV', example: 'dev', required: true, description: 'Runtime environment.' },
        { key: 'DATABASE_URL', example: 'postgresql+asyncpg://user:pass@localhost/app', required: true, description: 'Async SQLAlchemy connection string.' },
        { key: 'JWT_SECRET_KEY', example: 'a-long-random-string', required: true, description: 'Secret used to sign access tokens.' },
        { key: 'CORS_ORIGINS', example: 'http://localhost:3000', required: false, description: 'Comma-separated list of allowed origins.' },
      );
      break;
    case 'django':
      base.push(
        { key: 'DJANGO_SECRET_KEY', example: 'change-me', required: true, description: 'Secret key for Django sessions and CSRF.' },
        { key: 'DJANGO_DEBUG', example: 'False', required: true, description: 'Set to True only in local development.' },
        { key: 'DATABASE_URL', example: 'postgres://user:pass@localhost:5432/app', required: true, description: 'Parsed by django-environ at startup.' },
        { key: 'ALLOWED_HOSTS', example: 'localhost,127.0.0.1', required: true, description: 'Comma-separated list of valid Host headers.' },
      );
      break;
    case 'flask':
    case 'python':
      base.push(
        { key: 'FLASK_ENV', example: 'development', required: false, description: 'Runtime environment for Flask apps.' },
        { key: 'DATABASE_URL', example: 'postgres://user:pass@localhost:5432/app', required: true, description: 'Database connection string.' },
      );
      break;
    case 'go':
      base.push(
        { key: 'PORT', example: '8080', required: true, description: 'HTTP port to listen on.' },
        { key: 'GO_ENV', example: 'dev', required: true, description: 'Runtime environment switch.' },
        { key: 'DB_DSN', example: 'host=localhost user=app password=app dbname=app sslmode=disable', required: true, description: 'database/sql DSN.' },
      );
      break;
    case 'spring':
    case 'java':
      base.push(
        { key: 'SPRING_PROFILES_ACTIVE', example: 'local', required: true, description: 'Selects the active Spring profile.' },
        { key: 'SPRING_DATASOURCE_URL', example: 'jdbc:postgresql://localhost:5432/app', required: true, description: 'Primary datasource JDBC URL.' },
        { key: 'SPRING_DATASOURCE_USERNAME', example: 'app', required: true, description: 'DB user.' },
        { key: 'SPRING_DATASOURCE_PASSWORD', example: 'app', required: true, description: 'DB password (use a secret in non-local).' },
      );
      break;
    case 'rust':
      base.push(
        { key: 'RUST_LOG', example: 'info', required: false, description: 'env_logger filter directive.' },
        { key: 'DATABASE_URL', example: 'postgres://user:pass@localhost:5432/app', required: false, description: 'sqlx connection URL.' },
      );
      break;
    default:
      base.push(
        { key: 'APP_ENV', example: 'development', required: true, description: 'Runtime environment.' },
        { key: 'PORT', example: '8080', required: false, description: 'Optional HTTP port to listen on.' },
      );
  }

  if (stack.hasDocker)
    base.push({
      key: 'DOCKER_BUILDKIT',
      example: '1',
      required: false,
      description: 'Enable BuildKit for faster, cacheable Docker builds.',
    });

  return base;
}

export function buildCommandsForStack(
  stack: DetectedStack,
  pkgScripts?: Record<string, string>,
) {
  const out: { label: string; command: string; description: string }[] = [];
  const isJs = ['next', 'react', 'node', 'express', 'nest'].includes(stack.primary);

  if (isJs) {
    out.push({ label: 'Install dependencies', command: 'npm install', description: 'Install runtime + dev dependencies declared in package.json.' });
    if (pkgScripts?.dev)
      out.push({ label: 'Run locally (dev)', command: `npm run dev`, description: `package.json: \`${pkgScripts.dev}\`` });
    else if (stack.primary === 'next')
      out.push({ label: 'Run locally (dev)', command: 'npm run dev', description: 'Starts Next.js with HMR on http://localhost:3000.' });
    else if (stack.primary === 'react')
      out.push({ label: 'Run locally (dev)', command: 'npm run dev', description: 'Starts the Vite/CRA dev server.' });
    else
      out.push({ label: 'Run locally (dev)', command: 'npm run start:dev', description: 'Start the server in watch mode.' });

    if (pkgScripts?.test)
      out.push({ label: 'Run tests', command: 'npm test', description: `package.json: \`${pkgScripts.test}\`` });
    else
      out.push({ label: 'Run tests', command: 'npm test', description: 'Runs the unit + integration test suite.' });

    out.push({ label: 'Lint', command: pkgScripts?.lint ? 'npm run lint' : 'npm run lint', description: 'Runs ESLint over the codebase.' });
    if (pkgScripts?.build)
      out.push({ label: 'Production build', command: 'npm run build', description: `package.json: \`${pkgScripts.build}\`` });
  } else if (['python', 'fastapi', 'flask'].includes(stack.primary)) {
    out.push(
      { label: 'Create virtualenv', command: 'python -m venv .venv && source .venv/bin/activate', description: 'Isolate dependencies per project.' },
      { label: 'Install dependencies', command: 'pip install -r requirements.txt', description: 'Install pinned Python dependencies.' },
      { label: 'Run locally', command: stack.primary === 'fastapi' ? 'uvicorn app.main:app --reload' : 'flask --app app run --reload', description: 'Boots the dev server with hot reload.' },
      { label: 'Run tests', command: 'pytest -q', description: 'Runs pytest in quiet mode.' },
      { label: 'Lint & format', command: 'ruff check . && black .', description: 'Lint with ruff, autoformat with black.' },
    );
  } else if (stack.primary === 'django') {
    out.push(
      { label: 'Install dependencies', command: 'pip install -r requirements.txt', description: 'Install pinned dependencies.' },
      { label: 'Apply migrations', command: 'python manage.py migrate', description: 'Bring the local DB up to the current schema.' },
      { label: 'Run dev server', command: 'python manage.py runserver', description: 'http://localhost:8000.' },
      { label: 'Run tests', command: 'python manage.py test', description: 'Run Django’s built-in test runner.' },
    );
  } else if (stack.primary === 'go') {
    out.push(
      { label: 'Tidy modules', command: 'go mod tidy', description: 'Sync go.mod / go.sum.' },
      { label: 'Run locally', command: 'go run ./cmd/...', description: 'Compile and run the main package(s).' },
      { label: 'Run tests', command: 'go test ./... -race -cover', description: 'Race detector + coverage across all packages.' },
      { label: 'Build binary', command: 'go build -o bin/app ./cmd/app', description: 'Produce a static binary in ./bin.' },
    );
  } else if (stack.primary === 'spring' || stack.primary === 'java') {
    out.push(
      { label: 'Install + build', command: './mvnw install -DskipTests', description: 'Maven wrapper builds and installs locally.' },
      { label: 'Run locally', command: './mvnw spring-boot:run', description: 'Boots Spring Boot on http://localhost:8080.' },
      { label: 'Run tests', command: './mvnw test', description: 'JUnit + integration tests.' },
    );
  } else if (stack.primary === 'rust') {
    out.push(
      { label: 'Run locally', command: 'cargo run', description: 'Compile and run the default binary target.' },
      { label: 'Run tests', command: 'cargo test', description: 'Runs unit + doctests.' },
      { label: 'Build (release)', command: 'cargo build --release', description: 'Optimized release binary in target/release/.' },
    );
  } else {
    out.push({ label: 'Open the README', command: 'cat README.md', description: 'No conventional build files detected — start with the README.' });
  }

  if (stack.hasDocker)
    out.push({ label: 'Container build', command: 'docker build -t app .', description: 'Builds the production image from the Dockerfile.' });
  if (stack.hasKubernetes)
    out.push({
      label: 'Local k8s deploy',
      command: 'kubectl apply -f k8s/',
      description: 'Apply manifests to your local cluster (kind/minikube).',
    });

  return out;
}

export function deploymentForStack(stack: DetectedStack) {
  const stages: { stage: string; description: string; tool: string }[] = [];
  stages.push({
    stage: 'Build',
    description: stack.hasDocker
      ? 'CI builds an immutable container image from the Dockerfile.'
      : 'CI compiles and packages the application artifact.',
    tool: stack.hasGithubActions ? 'GitHub Actions' : 'CI',
  });
  stages.push({
    stage: 'Test & scan',
    description: 'Unit + integration tests, plus dependency and secret scans.',
    tool: 'Jest / Pytest / go test + Trivy + CodeQL',
  });
  if (stack.hasKubernetes) {
    stages.push(
      { stage: 'Stage', description: 'Auto-deploy to the staging namespace on merge to main.', tool: 'Argo CD' },
      { stage: 'Canary', description: '5% of traffic shifted, SLO-based auto-rollback.', tool: 'Argo Rollouts' },
      { stage: 'Production', description: 'Promoted automatically when canary metrics stay green.', tool: 'Argo CD' },
    );
  } else {
    if (stack.primary === 'next' || stack.primary === 'react')
      stages.push(
        { stage: 'Preview', description: 'Each PR gets a unique preview URL for review.', tool: 'Vercel / Netlify' },
        { stage: 'Production', description: 'Promoted on merge to main.', tool: 'Vercel / Netlify' },
      );
    else
      stages.push(
        { stage: 'Stage', description: 'Deploy to staging environment.', tool: 'Heroku / Fly.io / Render' },
        { stage: 'Production', description: 'Promoted manually after smoke tests pass.', tool: 'Heroku / Fly.io / Render' },
      );
  }
  return stages;
}

export function commonIssuesForStack(stack: DetectedStack): CommonIssue[] {
  const out: CommonIssue[] = [];
  if (['next', 'react', 'node', 'express', 'nest'].includes(stack.primary))
    out.push(
      { title: 'Module not found after install', symptom: '`Cannot find module …` after a fresh clone.', resolution: 'Delete `node_modules` and `package-lock.json`, then run `npm install` again.', severity: 'low' },
      { title: 'Port already in use (EADDRINUSE)', symptom: 'Dev server fails to start.', resolution: 'Kill the previous process: `lsof -i :3000 | xargs kill -9`, or set a different PORT.', severity: 'low' },
    );
  if (stack.primary === 'next')
    out.push({
      title: 'Hydration mismatch',
      symptom: 'React hydration error in the console after a route change.',
      resolution: 'Check that server and client render the same markup — avoid `Date.now()`/`Math.random()` in components, or move them to `useEffect`.',
      severity: 'medium',
    });
  if (['python', 'fastapi', 'django', 'flask'].includes(stack.primary))
    out.push(
      { title: 'ModuleNotFoundError', symptom: 'Imports fail at startup.', resolution: 'Activate the virtualenv (`source .venv/bin/activate`) and reinstall: `pip install -r requirements.txt`.', severity: 'low' },
      { title: 'psycopg / asyncpg connection refused', symptom: 'Cannot connect to Postgres.', resolution: 'Verify DATABASE_URL and that Postgres is actually listening: `pg_isready -h localhost`.', severity: 'medium' },
    );
  if (stack.primary === 'django')
    out.push({
      title: 'Migrations out of sync',
      symptom: '`InconsistentMigrationHistory` on startup.',
      resolution: 'Run `python manage.py migrate --plan` to inspect, then `migrate <app> zero` and re-apply.',
      severity: 'medium',
    });
  if (stack.primary === 'go')
    out.push(
      { title: 'go: cannot find module', symptom: 'Build fails after pulling new code.', resolution: 'Run `go mod tidy` to refresh module hashes.', severity: 'low' },
      { title: 'Race detector flagging shared map', symptom: '`fatal error: concurrent map writes`.', resolution: 'Wrap the map in a `sync.RWMutex` or switch to `sync.Map` for hot read/write paths.', severity: 'high' },
    );
  if (stack.primary === 'spring' || stack.primary === 'java')
    out.push({
      title: 'Application context fails to start',
      symptom: 'BeanCreationException at boot.',
      resolution: 'Check `SPRING_PROFILES_ACTIVE` and confirm the datasource bean is wired for that profile.',
      severity: 'medium',
    });
  if (stack.hasDocker)
    out.push({
      title: 'Slow `docker build`',
      symptom: 'Each build re-downloads dependencies.',
      resolution: 'Order Dockerfile layers from least → most volatile, and enable `DOCKER_BUILDKIT=1` for cache mounts.',
      severity: 'low',
    });
  if (out.length === 0)
    out.push({
      title: 'Unfamiliar build error',
      symptom: 'A command from the README fails on a fresh clone.',
      resolution: 'Check the README and CONTRIBUTING for prerequisites; ping the SMEs listed on the Team page.',
      severity: 'low',
    });
  return out;
}

export function glossaryForStack(stack: DetectedStack): GlossaryItem[] {
  const base: GlossaryItem[] = [
    { term: 'Idempotent', definition: 'An operation that produces the same result if executed multiple times with the same input.' },
    { term: 'SLO', definition: 'Service Level Objective — the reliability target we commit to.' },
  ];
  switch (stack.primary) {
    case 'next':
      base.push(
        { term: 'SSR', definition: 'Server-side rendering — HTML rendered on each request.' },
        { term: 'ISR', definition: 'Incremental Static Regeneration — pages cached and re-built in the background.' },
        { term: 'Edge runtime', definition: 'Lightweight V8 isolates that run close to the user, with limited Node APIs.' },
      );
      break;
    case 'react':
      base.push(
        { term: 'Hook', definition: 'A function that lets you "hook into" React state and lifecycle from a component.' },
        { term: 'Suspense', definition: 'React mechanism for declaratively waiting on async data before rendering.' },
      );
      break;
    case 'nest':
      base.push(
        { term: 'Module', definition: 'A NestJS class decorated with `@Module` that groups providers and controllers.' },
        { term: 'Provider', definition: 'A class managed by Nest’s DI container.' },
      );
      break;
    case 'fastapi':
      base.push(
        { term: 'Pydantic model', definition: 'A typed schema used by FastAPI to validate requests and responses.' },
        { term: 'Dependency', definition: 'A reusable function injected into route handlers via `Depends()`.' },
      );
      break;
    case 'django':
      base.push(
        { term: 'App', definition: 'A self-contained Django module with models, views, and URLs.' },
        { term: 'Migration', definition: 'A versioned change to the database schema, generated from models.' },
      );
      break;
    case 'go':
      base.push(
        { term: 'Goroutine', definition: 'A lightweight thread of execution scheduled by the Go runtime.' },
        { term: 'Channel', definition: 'A typed conduit through which goroutines communicate safely.' },
      );
      break;
    case 'spring':
    case 'java':
      base.push(
        { term: 'Bean', definition: 'A Spring-managed object whose lifecycle is controlled by the IoC container.' },
        { term: 'Profile', definition: 'A named set of configuration that can be activated per environment.' },
      );
      break;
    case 'rust':
      base.push(
        { term: 'Ownership', definition: 'Rust’s compile-time mechanism for memory safety without a GC.' },
        { term: 'Crate', definition: 'A unit of compilation/distribution in Rust (a binary or a library).' },
      );
      break;
  }
  if (stack.hasKubernetes)
    base.push(
      { term: 'Pod', definition: 'The smallest deployable unit in Kubernetes — one or more containers sharing a network namespace.' },
      { term: 'Helm chart', definition: 'A packaged set of Kubernetes manifests with templated values.' },
    );
  return base;
}

export function learningPathForStack(stack: DetectedStack): LearningStep[] {
  const steps: LearningStep[] = [
    { id: 'lp-1', title: 'Get the repo running locally', description: 'Clone, install, set up env, and run the dev server.', estMinutes: 30, category: 'setup' },
    { id: 'lp-2', title: 'Read the architecture diagram', description: 'Understand request flow, data ownership, and async boundaries.', estMinutes: 20, category: 'architecture' },
    { id: 'lp-3', title: 'Tour the folder structure', description: 'Open each top-level folder and map intent to code.', estMinutes: 25, category: 'codebase' },
  ];

  switch (stack.primary) {
    case 'next':
    case 'react':
      steps.push({ id: 'lp-4', title: 'Trace one route end-to-end', description: 'Pick a route, follow it from the page component → hook → API → render.', estMinutes: 35, category: 'codebase' });
      break;
    case 'nest':
    case 'express':
    case 'node':
      steps.push({ id: 'lp-4', title: 'Trace one API call end-to-end', description: 'Controller → service → repository → DB.', estMinutes: 35, category: 'codebase' });
      break;
    case 'fastapi':
    case 'django':
    case 'flask':
    case 'python':
      steps.push({ id: 'lp-4', title: 'Trace one route end-to-end', description: 'URL → view → service → ORM → response.', estMinutes: 35, category: 'codebase' });
      break;
    case 'go':
      steps.push({ id: 'lp-4', title: 'Read main + the primary handler', description: 'Trace from `func main()` through the router to one handler.', estMinutes: 30, category: 'codebase' });
      break;
    case 'spring':
    case 'java':
      steps.push({ id: 'lp-4', title: 'Find and read the primary @RestController', description: 'Trace controller → service → repository → DB.', estMinutes: 35, category: 'codebase' });
      break;
    case 'rust':
      steps.push({ id: 'lp-4', title: 'Read main.rs and lib.rs', description: 'Build a mental map of modules and their boundaries.', estMinutes: 35, category: 'codebase' });
      break;
    default:
      steps.push({ id: 'lp-4', title: 'Read the entry point', description: 'Find where the program starts and walk one path through.', estMinutes: 35, category: 'codebase' });
  }

  steps.push(
    { id: 'lp-5', title: 'Run the test suite', description: 'Get a green run locally; add a deliberate failure to confirm it’s wired.', estMinutes: 30, category: 'process' },
    { id: 'lp-6', title: 'Read the on-call runbook', description: 'Know what to do at 3am: dashboards, runbooks, escalation.', estMinutes: 20, category: 'process' },
    { id: 'lp-7', title: 'Meet your SMEs', description: '15-min intros with the top contributors listed on the Team page.', estMinutes: 45, category: 'people' },
    { id: 'lp-8', title: 'Ship a tiny PR', description: 'Pick a `good first issue`, open a PR, get a review.', estMinutes: 90, category: 'process' },
  );
  return steps;
}

export function architectureForStack(
  stack: DetectedStack,
  repoLabel: string,
): { description: string; nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  const isWeb = ['next', 'react'].includes(stack.primary);
  const isService = ['express', 'nest', 'fastapi', 'django', 'flask', 'go', 'spring', 'java', 'node', 'python'].includes(stack.primary);

  if (isWeb) {
    return {
      description: `Browser loads the ${stack.primary === 'next' ? 'Next.js' : 'React'} app, which talks to one or more backend services. Edge/CDN caches static assets.`,
      nodes: [
        { id: 'browser', label: 'Browser', kind: 'client', x: 60, y: 60 },
        { id: 'cdn', label: 'CDN / Edge', kind: 'gateway', x: 280, y: 60 },
        { id: 'web', label: repoLabel, kind: 'service', x: 500, y: 60 },
        { id: 'api', label: 'Backend API', kind: 'service', x: 720, y: 60 },
        { id: 'auth', label: 'Auth provider', kind: 'external', x: 500, y: 220 },
        { id: 'db', label: 'Database', kind: 'db', x: 720, y: 220 },
      ],
      edges: [
        { from: 'browser', to: 'cdn', label: 'HTTPS' },
        { from: 'cdn', to: 'web', label: 'pages/assets' },
        { from: 'web', to: 'api', label: 'fetch' },
        { from: 'web', to: 'auth', label: 'OAuth' },
        { from: 'api', to: 'db', label: 'SQL' },
      ],
    };
  }
  if (isService) {
    return {
      description: `Requests enter through an API gateway, are authenticated, then routed into ${repoLabel}. State lives in a primary database with optional caches and an event bus for async work.`,
      nodes: [
        { id: 'client', label: 'Client / SPA', kind: 'client', x: 60, y: 60 },
        { id: 'gateway', label: 'API Gateway', kind: 'gateway', x: 280, y: 60 },
        { id: 'identity', label: 'Identity', kind: 'service', x: 280, y: 220 },
        { id: 'core', label: repoLabel, kind: 'service', x: 500, y: 60 },
        { id: 'queue', label: 'Event Bus', kind: 'queue', x: 500, y: 220 },
        { id: 'cache', label: 'Cache', kind: 'cache', x: 720, y: 60 },
        { id: 'db', label: 'Primary DB', kind: 'db', x: 720, y: 220 },
        { id: 'external', label: '3rd-party APIs', kind: 'external', x: 720, y: 360 },
      ],
      edges: [
        { from: 'client', to: 'gateway', label: 'HTTPS' },
        { from: 'gateway', to: 'identity', label: 'verify' },
        { from: 'gateway', to: 'core', label: 'route' },
        { from: 'core', to: 'cache', label: 'hot reads' },
        { from: 'core', to: 'db', label: 'persist' },
        { from: 'core', to: 'queue', label: 'publish' },
        { from: 'queue', to: 'external', label: 'deliver' },
      ],
    };
  }
  // Generic/library
  return {
    description: `${repoLabel} is consumed as a library by client applications. Releases ship through the package registry; CI handles tests and publishing.`,
    nodes: [
      { id: 'consumer', label: 'Consumer App', kind: 'client', x: 80, y: 60 },
      { id: 'lib', label: repoLabel, kind: 'service', x: 320, y: 60 },
      { id: 'registry', label: 'Package Registry', kind: 'external', x: 560, y: 60 },
      { id: 'ci', label: 'CI', kind: 'gateway', x: 320, y: 220 },
      { id: 'tests', label: 'Test Suite', kind: 'cache', x: 560, y: 220 },
    ],
    edges: [
      { from: 'consumer', to: 'lib', label: 'imports' },
      { from: 'lib', to: 'registry', label: 'publish' },
      { from: 'ci', to: 'lib', label: 'build' },
      { from: 'ci', to: 'tests', label: 'run' },
    ],
  };
}

export function apiFlowForStack(stack: DetectedStack): ApiEndpoint[] {
  if (['next', 'react'].includes(stack.primary)) return [];
  switch (stack.primary) {
    case 'fastapi':
      return [
        { method: 'GET', path: '/docs', description: 'Interactive Swagger UI, auto-generated from Pydantic models.', auth: false },
        { method: 'GET', path: '/health', description: 'Liveness probe.', auth: false },
        { method: 'POST', path: '/api/v1/auth/token', description: 'Exchange credentials for an access token.', auth: false },
        { method: 'GET', path: '/api/v1/users/me', description: 'Return the authenticated user.', auth: true },
        { method: 'POST', path: '/api/v1/items', description: 'Create a new item (idempotent via X-Idempotency-Key).', auth: true },
        { method: 'PATCH', path: '/api/v1/items/{id}', description: 'Partially update an item.', auth: true },
      ];
    case 'django':
      return [
        { method: 'GET', path: '/admin/', description: 'Django admin (staff only).', auth: true },
        { method: 'GET', path: '/api/health/', description: 'Liveness check.', auth: false },
        { method: 'GET', path: '/api/v1/items/', description: 'List items for the current tenant.', auth: true },
        { method: 'POST', path: '/api/v1/items/', description: 'Create a new item.', auth: true },
      ];
    case 'spring':
    case 'java':
      return [
        { method: 'GET', path: '/actuator/health', description: 'Spring Boot Actuator liveness/readiness.', auth: false },
        { method: 'POST', path: '/api/v1/auth/login', description: 'Issue a JWT access token.', auth: false },
        { method: 'GET', path: '/api/v1/orders/{id}', description: 'Fetch one order.', auth: true },
        { method: 'POST', path: '/api/v1/orders', description: 'Create an order.', auth: true },
      ];
    case 'go':
      return [
        { method: 'GET', path: '/healthz', description: 'Liveness probe.', auth: false },
        { method: 'POST', path: '/v1/sessions', description: 'Create a session.', auth: false },
        { method: 'GET', path: '/v1/resources/:id', description: 'Read a resource.', auth: true },
        { method: 'POST', path: '/v1/resources', description: 'Create a resource.', auth: true },
      ];
    case 'nest':
    case 'express':
    case 'node':
      return [
        { method: 'GET', path: '/health', description: 'Health check used by k8s.', auth: false },
        { method: 'POST', path: '/v1/auth/login', description: 'Issue an access token.', auth: false },
        { method: 'GET', path: '/v1/me', description: 'Return the current user.', auth: true },
        { method: 'POST', path: '/v1/resources', description: 'Create a resource (idempotent).', auth: true },
      ];
    default:
      return [];
  }
}

export function codeWalkthroughForStack(
  stack: DetectedStack,
  repoLabel: string,
  readmeExcerpt?: string,
): CodeWalkthroughStep[] {
  const out: CodeWalkthroughStep[] = [];
  if (readmeExcerpt) {
    out.push({
      title: 'README at a glance',
      file: 'README.md',
      language: 'md',
      snippet: readmeExcerpt,
      explanation: `An excerpt pulled directly from ${repoLabel}'s README — start here to understand the author's intent.`,
    });
  }

  switch (stack.primary) {
    case 'next':
      out.push(
        {
          title: 'App Router entry',
          file: 'app/layout.tsx',
          language: 'tsx',
          snippet: `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}`,
          explanation: 'Top-level layout that wraps every route. Anything in here renders on every page.',
        },
        {
          title: 'Server component fetching data',
          file: 'app/(dashboard)/page.tsx',
          language: 'tsx',
          snippet: `export default async function Page() {\n  const items = await fetch(process.env.NEXT_PUBLIC_API_URL + '/items', { next: { revalidate: 60 } }).then(r => r.json());\n  return <ItemList items={items} />;\n}`,
          explanation: 'Default rendering happens on the server; ISR refreshes the cache every 60 s.',
        },
      );
      break;
    case 'react':
      out.push({
        title: 'App entry & routing',
        file: 'src/main.tsx',
        language: 'tsx',
        snippet: `import { createRoot } from 'react-dom/client';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(<App />);`,
        explanation: 'Tiny entry point; routing and layout live in `<App />`.',
      });
      break;
    case 'nest':
      out.push({
        title: 'A typical controller',
        file: 'src/users/users.controller.ts',
        language: 'ts',
        snippet: `@Controller('users')\nexport class UsersController {\n  constructor(private readonly users: UsersService) {}\n\n  @Get(':id')\n  findOne(@Param('id') id: string) {\n    return this.users.findOne(id);\n  }\n}`,
        explanation: 'Controllers are thin: validate input, call the service. Business logic lives in the service.',
      });
      break;
    case 'express':
    case 'node':
      out.push({
        title: 'Server bootstrap',
        file: 'src/server.js',
        language: 'js',
        snippet: `const express = require('express');\nconst app = express();\napp.use(express.json());\napp.get('/health', (_, res) => res.json({ ok: true }));\napp.listen(process.env.PORT || 8080);`,
        explanation: 'Plain Express bootstrap — middleware, routes, then `listen`.',
      });
      break;
    case 'fastapi':
      out.push({
        title: 'A FastAPI route',
        file: 'app/api/items.py',
        language: 'py',
        snippet: `from fastapi import APIRouter, Depends\nfrom .schemas import Item\n\nrouter = APIRouter(prefix="/items", tags=["items"])\n\n@router.get("/{item_id}", response_model=Item)\nasync def get_item(item_id: int, svc: ItemService = Depends()):\n    return await svc.get(item_id)`,
        explanation: 'Pydantic + Depends() give you typed validation and dependency injection in 8 lines.',
      });
      break;
    case 'django':
      out.push({
        title: 'A view and its URL',
        file: 'items/views.py',
        language: 'py',
        snippet: `from rest_framework.viewsets import ModelViewSet\nfrom .models import Item\nfrom .serializers import ItemSerializer\n\nclass ItemViewSet(ModelViewSet):\n    queryset = Item.objects.all()\n    serializer_class = ItemSerializer`,
        explanation: 'DRF generates list/retrieve/create/update/destroy from this one class.',
      });
      break;
    case 'go':
      out.push({
        title: 'main.go',
        file: 'cmd/app/main.go',
        language: 'go',
        snippet: `func main() {\n  r := gin.Default()\n  r.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })\n  if err := r.Run(":8080"); err != nil {\n    log.Fatal(err)\n  }\n}`,
        explanation: 'Tiny gin server — register routes, then `r.Run`.',
      });
      break;
    case 'spring':
    case 'java':
      out.push({
        title: 'A REST controller',
        file: 'src/main/java/com/example/UserController.java',
        language: 'java',
        snippet: `@RestController\n@RequestMapping("/api/v1/users")\npublic class UserController {\n  private final UserService users;\n  public UserController(UserService users) { this.users = users; }\n\n  @GetMapping("/{id}")\n  public User get(@PathVariable Long id) { return users.findById(id); }\n}`,
        explanation: 'Controller delegates to a service — services are where business logic and transactions live.',
      });
      break;
    case 'rust':
      out.push({
        title: 'main.rs',
        file: 'src/main.rs',
        language: 'rust',
        snippet: `#[tokio::main]\nasync fn main() {\n    let app = axum::Router::new().route("/healthz", axum::routing::get(|| async { "ok" }));\n    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();\n    axum::serve(listener, app).await.unwrap();\n}`,
        explanation: 'Async axum server bootstrapped on Tokio.',
      });
      break;
  }
  return out;
}

/** Pull script names off a parsed package.json (best-effort) */
export function parsePackageScripts(pkgJsonText: string | null): Record<string, string> | undefined {
  if (!pkgJsonText) return undefined;
  try {
    const obj = JSON.parse(pkgJsonText);
    return obj?.scripts ?? undefined;
  } catch {
    return undefined;
  }
}

/** Friendly summary string for an artifact overview. */
export function summarizeRepo(opts: {
  name: string;
  description: string;
  primary: StackKind;
  primaryLanguage: string;
  topics: string[];
  level: string;
}): string {
  const desc = opts.description?.trim() || `the ${opts.name} project`;
  const stackHint = opts.primary === 'unknown' ? opts.primaryLanguage : opts.primary;
  return `${opts.name} is ${desc.endsWith('.') ? desc : desc + '.'} It is primarily a ${stackHint} codebase${
    opts.topics.length ? ` tagged ${opts.topics.slice(0, 4).map((t) => `#${t}`).join(' ')}` : ''
  }. This onboarding artifact is calibrated for a ${opts.level.toLowerCase()} audience.`;
}
