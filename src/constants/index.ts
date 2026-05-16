import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  MessageSquare,
  CheckSquare,
  Library,
  Activity,
  Users,
  Settings,
  Workflow,
} from 'lucide-react';

export const APP_NAME = 'Repo Onboarding AI';
export const APP_TAGLINE = 'Onboard to any repo in hours — not weeks.';

export const STORAGE_KEYS = {
  theme: 'roai-theme',
  preferences: 'roai-preferences',
  progress: 'roai-progress',
  recentRepos: 'roai-recent-repos',
  repos: 'roai-repos',
  artifacts: 'roai-artifacts',
  activeRepo: 'roai-active-repo',
  chatSession: 'roai-chat-session', // sessionStorage
} as const;

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/generate', label: 'Generate', icon: Sparkles },
  { to: '/workflow', label: 'AI Workflow', icon: Workflow },
  { to: '/learning', label: 'Learning Path', icon: CheckSquare },
  { to: '/knowledge', label: 'Knowledge Hub', icon: Library },
  { to: '/chat', label: 'AI Assistant', icon: MessageSquare },
  { to: '/health', label: 'Repo Health', icon: Activity },
  { to: '/team', label: 'Team & SMEs', icon: Users },
  { to: '/artifacts', label: 'Artifacts', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export const TECH_STACK_OPTIONS = [
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'NestJS',
  'Python',
  'Django',
  'FastAPI',
  'Java',
  'Spring Boot',
  'Go',
  'Rust',
  'TypeScript',
  'GraphQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'Docker',
  'Kubernetes',
] as const;

export const ONBOARDING_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const SUGGESTED_PROMPTS = [
  'Summarize this repository for a new joiner.',
  'How is authentication handled in this codebase?',
  'Walk me through the deployment pipeline.',
  'What are the most common build issues?',
  'Where do I start contributing as a beginner?',
  'Explain the architecture in plain English.',
];
