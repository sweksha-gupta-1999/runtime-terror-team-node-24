# Repo Onboarding AI Assistant

> Onboard to any repo in **hours**, not weeks. Agentic-AI–style onboarding co-pilot that turns a repository into a self-contained, browser-readable artifact.

![Tech](https://img.shields.io/badge/React-18-61dafb) ![Tech](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tech](https://img.shields.io/badge/Vite-5-646cff) ![Tech](https://img.shields.io/badge/Tailwind-3-38bdf8)

A complete **frontend-only** application — no backend, no database. All data is mocked via JSON files and persisted in `localStorage` / `sessionStorage` / cookies, so you can demo it instantly.

---

## Why this exists

New joiners usually depend on SMEs and team leads to onboard. They:

- Read scattered README/Confluence pages
- Schedule multiple walkthroughs
- Reverse-engineer code in the IDE
- Repeatedly ask the same questions in Teams/Slack

This drains SME bandwidth and produces inconsistent knowledge transfer.

**This app** generates an interactive, self-serve onboarding artifact for any repo — architecture diagrams, folder structure, API flow, deployment pipeline, common issues, FAQs, SME contacts, code walkthrough, glossary, and a step-by-step learning path — so the SME is only pulled in for the genuinely hard questions.

---

## Quick start

> Requirements: **Node 18+** and **npm**.

```bash
# 1. Install
npm install

# 2. Run dev server
npm run dev
#   → http://localhost:5173

# 3. Build for production
npm run build

# 4. Preview the production build
npm run preview
```

---

## Tech stack

| Concern              | Choice                                    |
| -------------------- | ----------------------------------------- |
| Framework            | React 18 + TypeScript                     |
| Build tool           | Vite 5                                    |
| Styling              | Tailwind CSS 3 + custom design tokens     |
| Routing              | React Router 6                            |
| State management     | Zustand (theme, repos, progress, chat, prefs) |
| Animations           | Framer Motion                             |
| Charts               | Recharts                                  |
| Icons                | Lucide React                              |
| Persistence          | `localStorage`, `sessionStorage`, cookies |

---

## Features

### 1. Dashboard
- Modern, gradient-rich landing page
- Search across repositories
- Recently viewed repos
- Suggested onboarding artifacts (sorted by AI confidence)
- Stat cards (repos, artifacts, avg time, SME hours saved)
- Smart recommendations
- "Generate onboarding" CTA

### 2. Repo Onboarding Generator
A 4-step wizard:
1. Repository details (name + GitHub URL)
2. Tech stack picker
3. Onboarding level (Beginner / Intermediate / Advanced)
4. Review + generate

Animated AI pipeline simulation walks the user through:
**Analyze → Extract → Structure → Render → Done.**

### 3. Generated Onboarding Artifact
Tabbed viewer with 13 sections:
- Overview
- Architecture diagram (interactive SVG + nodes)
- Folder structure (collapsible tree)
- API flow (route table)
- Environment setup
- Build & run commands
- Deployment flow
- Common issues
- FAQs (accordion)
- Important contacts (with "Ask SME" modal)
- Code walkthrough (annotated snippets)
- Glossary
- Learning path (with progress tracking)

### 4. AI Assistant chat panel
- Fake-but-believable AI replies powered by `chatResponses.json`
- Pattern matching on user input
- Typing animation
- Suggested prompts
- Chat history persisted in `sessionStorage`

### 5. Interactive Learning
- Step-by-step onboarding checklist per repo
- Grouped by category (setup, codebase, architecture, process, people)
- Progress tracked in `localStorage`
- "Mark all" / "Reset" actions
- Celebration when you hit 100%

### 6. Knowledge Hub
- Searchable documentation
- Filter by category and tags
- Recent updates sidebar

### 7. Repo Health Insights
Recharts dashboards for:
- Build stability
- PR activity
- Deployment frequency
- Open issues
- Tech debt score
- Weekly velocity (Area chart)
- Language mix (Donut chart)
- Deployments per week (Bar chart)
- Incident trend (Stacked bar)

### 8. Team Collaboration
- SME cards with avatars, expertise, timezone
- Slack/Teams channels
- 4-tier escalation matrix
- "Ask SME" modal with fake send

### 9. Settings
- Light / dark theme
- Reduce motion, compact density toggles
- Default onboarding level
- Reset progress / artifacts / everything

### 10. AI Workflow Simulation
Visual pipeline showing the agentic loop:
**Repo Input → AI Analysis → Knowledge Extraction → Artifact Generation → Interactive Onboarding**

With "Run simulation" button that animates through stages.

### Bonus features
- AI confidence score per repo
- Smart recommendations
- "Ask SME" modal
- PDF export (uses `window.print()` — clean print stylesheet)
- Interactive architecture map (SVG)
- Timeline-style stepper in the generator
- Breadcrumb navigation everywhere
- Global topbar search with live results

---

## Project structure

```
src/
├── App.tsx                     # Routing setup
├── main.tsx                    # Entry point
├── index.css                   # Tailwind + design tokens
│
├── components/
│   ├── ui/                     # Reusable atoms (Button, Card, Input, Modal, …)
│   ├── layout/                 # AppShell, Sidebar, Topbar
│   ├── dashboard/              # StatCard
│   ├── repo/                   # RepoCard, AskSMEModal
│   └── artifact/               # FolderTree, ArchitectureMap
│
├── pages/                      # One file per route
│   ├── Dashboard.tsx
│   ├── Generate.tsx
│   ├── Workflow.tsx
│   ├── Learning.tsx
│   ├── Knowledge.tsx
│   ├── Chat.tsx
│   ├── Health.tsx
│   ├── Team.tsx
│   ├── Artifacts.tsx
│   ├── ArtifactDetail.tsx
│   ├── Settings.tsx
│   └── NotFound.tsx
│
├── store/                      # Zustand stores
│   ├── themeStore.ts
│   ├── repoStore.ts
│   ├── progressStore.ts
│   ├── chatStore.ts
│   └── prefsStore.ts
│
├── data/                       # Dummy JSON
│   ├── repositories.json
│   ├── artifactTemplate.json
│   ├── chatResponses.json
│   ├── knowledge.json
│   ├── health.json
│   ├── escalation.json
│   └── recommendations.json
│
├── utils/                      # cn, format, storage, artifact builder
├── types/                      # All TypeScript interfaces
└── constants/                  # App-wide constants & nav items
```

---

## State & persistence

| Store / data       | Where it lives            |
| ------------------ | ------------------------- |
| Theme              | `localStorage` `roai-theme`        |
| Preferences        | `localStorage` `roai-preferences`  |
| Onboarding progress| `localStorage` `roai-progress`     |
| Recently viewed    | `localStorage` `roai-recent-repos` |
| Generated artifacts| `localStorage` `roai-artifacts`    |
| Chat history       | `sessionStorage` `roai-chat-session` |

All keys are namespaced under `roai-*` so they never collide with other apps.

---

## Design system

- **Brand:** indigo / violet gradient with cyan accents
- **Typography:** Inter (UI) + Space Grotesk (display) + JetBrains Mono (code)
- **Surfaces:** translucent glass cards with subtle radial mesh background
- **Motion:** Framer Motion for spring transitions and shared layout animations
- **Dark mode:** class-based, applied pre-render to avoid theme flash
- **Print stylesheet:** lets users export an artifact as PDF via `Ctrl+P`

---

## Scripts

```bash
npm run dev        # Start the dev server
npm run build      # Type-check + production build
npm run preview    # Preview the production build
npm run lint       # Lint with ESLint
```

---

## License

Demo / educational use. All data shown in the app is synthetic.
