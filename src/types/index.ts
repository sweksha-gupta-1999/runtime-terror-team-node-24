// ----- Core domain types for the Repo Onboarding AI Assistant -----

export type OnboardingLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type TechStack =
  | 'React'
  | 'Next.js'
  | 'Node.js'
  | 'Express'
  | 'NestJS'
  | 'Python'
  | 'Django'
  | 'FastAPI'
  | 'Java'
  | 'Spring Boot'
  | 'Go'
  | 'Rust'
  | 'TypeScript'
  | 'GraphQL'
  | 'PostgreSQL'
  | 'MongoDB'
  | 'Redis'
  | 'Docker'
  | 'Kubernetes';

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  owner: string;
  ownerAvatar?: string;
  url: string;
  homepage?: string | null;
  stars: number;
  forks: number;
  contributors: number;
  openIssues?: number;
  language: string;
  stack: TechStack[];
  tags: string[]; // GitHub topics
  lastUpdated: string; // ISO date
  createdAt?: string;
  visibility: 'public' | 'private';
  aiConfidence: number; // 0–100
  defaultBranch?: string;
  license?: string | null;
  source?: 'github' | 'manual';
}

export interface FolderNode {
  name: string;
  type: 'folder' | 'file';
  description?: string;
  children?: FolderNode[];
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface CommonIssue {
  title: string;
  symptom: string;
  resolution: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  team: string;
  email: string;
  slack: string;
  avatar: string; // either a CSS color (#abcdef) or a full URL to an image
  timezone: string;
  expertise: string[];
  githubUrl?: string;
  contributions?: number;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface LearningStep {
  id: string;
  title: string;
  description: string;
  estMinutes: number;
  category: 'setup' | 'codebase' | 'architecture' | 'process' | 'people';
  resources?: { label: string; href: string }[];
}

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: 'client' | 'service' | 'db' | 'queue' | 'cache' | 'external' | 'gateway';
  x: number;
  y: number;
  description?: string;
}
export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
}

export interface CodeWalkthroughStep {
  title: string;
  file: string;
  language: string;
  snippet: string;
  explanation: string;
}

export interface OnboardingArtifact {
  repoId: string;
  generatedAt: string;
  level: OnboardingLevel;
  overview: {
    summary: string;
    purpose: string;
    keyFeatures: string[];
    techStack: TechStack[];
  };
  architecture: {
    description: string;
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
  };
  folderStructure: FolderNode;
  apiFlow: ApiEndpoint[];
  envSetup: { key: string; example: string; required: boolean; description: string }[];
  buildCommands: { label: string; command: string; description: string }[];
  deployment: { stage: string; description: string; tool: string }[];
  commonIssues: CommonIssue[];
  faqs: FAQ[];
  contacts: Contact[];
  codeWalkthrough: CodeWalkthroughStep[];
  glossary: GlossaryItem[];
  learningPath: LearningStep[];
}

export interface HealthMetric {
  buildStability: number; // 0–100
  prActivity: number; // 0–100
  deploymentFrequency: number; // per week
  openIssues: number;
  techDebtScore: number; // 0–100 (lower is better)
  weekly: { week: string; builds: number; prs: number; deployments: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  repoId?: string;
  messages: ChatMessage[];
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  updatedAt: string;
  category: 'Architecture' | 'Process' | 'Security' | 'Frontend' | 'Backend' | 'DevOps';
  author: string;
}

export interface EscalationLevel {
  level: number;
  name: string;
  role: string;
  contact: string;
  responseTime: string;
}
