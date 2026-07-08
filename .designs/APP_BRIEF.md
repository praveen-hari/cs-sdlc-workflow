# SDLC Studio — Application Brief

## App Overview
- **Type:** VS Code / Code Studio extension (webview panels + sidebar views + tree views)
- **Description:** A developer-workspace-native SDLC project management extension that gives humans clear visibility, control, and review over AI-assisted software development — from requirement to deployment.
- **Platform:** VS Code / Code Studio extension (desktop, webview-based UI)

## Target Users
- **Primary:** Software developers and tech leads who use AI coding agents and need to track, review, and approve AI-generated work alongside their own.
- **Secondary:** Engineering managers and project managers who want SDLC progress visibility without leaving the IDE; solo developers managing personal projects with structured workflow.
- **Team size:** Individual to mid-size teams (1–50). Enterprise support deferred to later versions.

## Core Features
1. **Project Context Configuration** — Define project name, description, business goal, target users, tech stack, frameworks, coding standards, deployment environment, and repo structure. Support multiple projects per workspace.
2. **SDLC Workflow Engine** — Full lifecycle phases: Requirements → Analysis → Planning → Design → Architecture → Data/API Design → Dev Setup → Implementation → Testing → Review → Deployment → Monitoring. Each phase has entry/exit criteria and approval gates.
3. **Work Item Management** — Create and manage features, bugs, enhancements, refactoring, docs, testing, and deployment tasks. Each item carries requirements, acceptance criteria, priority, status, owner/agent, related files, dependencies, risks, and review notes.
4. **AI Plan Review & Approval** — When an AI agent works on a task, show the agent's plan, current progress, completed/pending steps, blockers, and required human approvals. Humans can approve, reject, request changes, or pause.
5. **Task Board & Progress Tracking** — Kanban-style board with statuses: Backlog → Planned → In Progress → In Review → Testing → Approved → Completed → Blocked. Progress visible at project level and work-item level.
6. **Human Review Checkpoints** — Mandatory review gates for requirements, implementation plan, code changes, test results, and deployment. No AI work proceeds without explicit human approval at each gate.
7. **Multi-Project Repository Support** — Map tasks to specific projects, modules, folders, or services within a monorepo. Separate context and progress per project with cross-project dependency tracking.
8. **Agent Context & Plugin Hub** — A central hub for managing AI agent context, skills, and plugins. Based on the current task or project context, users can browse, configure, install, and activate relevant agent plugins (e.g., framework-specific skills, linting rules, deployment helpers, testing strategies). The extension recommends plugins based on the project's tech stack and the work item being tackled, and lets users control which skills/context are active for each agent session.

## Style Direction
- **Mood:** Technical and professional — clean, information-dense, developer-native. Should feel like a natural part of VS Code, not a bolted-on web app.
- **References:** VS Code's native UI (activity bar, sidebar, editor tabs, status bar), GitHub Projects board, Linear's task detail view, GitLens sidebar panels.
- **Dark mode:** Yes — primary theme is dark (matching VS Code default). Light mode support as secondary.

## Brand
- **Colors:** Follow VS Code's native color palette — `#1E1E1E` background, `#252526` surface, `#0078D4` accent/primary, `#007ACC` status bar blue. Use VS Code CSS variables where possible.
- **Fonts:** VS Code's default font stack — system UI fonts, monospace for code references.
- **Logo:** No logo yet — use a simple icon (e.g., a workflow/rocket glyph from Codicons).

## Constraints
- Must use VS Code's native UI primitives where possible (tree views, webview panels, status bar items, quick picks, notifications).
- Webview panels must use the VS Code webview toolkit CSS variables for theme compatibility.
- Must work in both dark and light themes automatically.
- Accessibility: WCAG AA minimum — keyboard navigable, screen-reader friendly, sufficient contrast.
- No external server dependency for v1 — all data stored locally in `.sdlc/` workspace folder.
- Must integrate with VS Code Explorer, Source Control, Terminal, Problems panel, and Git workflows.

## Key UI Surfaces

### Sidebar Views (Activity Bar icon → Sidebar)
1. **Project Explorer** — Tree view of projects, phases, and work items
2. **SDLC Progress** — Phase-by-phase progress for the active project
3. **Quick Actions** — Start work, create item, run sync, take snapshot
4. **Agent Plugins** — Browse, search, and manage installed agent skills/plugins

### Webview Panels (Editor area)
5. **Project Dashboard** — KPIs, recent activity, phase progress chart
6. **Task Board** — Kanban columns with drag-and-drop cards
7. **Work Item Detail** — Full work item with tabs (Requirements, Plan, Files, Tests, Reviews)
8. **Requirement Editor** — Rich form for writing/editing requirements and acceptance criteria
9. **AI Plan Review** — Agent's proposed plan with approve/reject/modify controls
10. **File Impact View** — Which files are affected by a work item, with diff previews
11. **Test & Validation Summary** — Test results, coverage, validation status
12. **Approval History** — Timeline of all review decisions and comments
13. **Plugin Marketplace** — Browse available agent plugins with install/configure/activate controls, plugin detail view with docs, compatibility info, and configuration options
14. **Active Agent Context** — View and edit the assembled context being sent to the AI agent — which skills, rules, project context, and plugins are active for the current task

### Other Surfaces
15. **Status Bar** — Active project name, current phase, active work item count, active plugin count
16. **Settings Page** — Project context configuration form
17. **Plugin Settings** — Per-plugin configuration, enable/disable toggles, scope (project vs workspace)
18. **Notifications** — Review requests, phase completions, blocker alerts, plugin recommendations

## V1 Scope (MVP)
- Single-project support (multi-project deferred)
- Core SDLC phases (simplified to: Plan → Implement → Test → Review → Deploy)
- Work item CRUD with basic statuses
- Task board (kanban)
- Project dashboard
- AI plan review panel (read-only display of agent plans)
- Human approval gates (approve/reject)
- Agent plugin hub — browse, install, activate/deactivate skills and plugins
- Task-aware plugin recommendations (suggest relevant plugins based on work item type and tech stack)
- Active agent context viewer (see what context/skills the agent is using)
- Local `.sdlc/` storage
- Dark theme only

## V2+ Roadmap
- Multi-project support with cross-project dependencies
- Full 12-phase SDLC workflow
- AI agent integration API (agents can push status updates)
- Rich file impact view with inline diffs
- Test result aggregation
- Deployment tracking
- Light theme
- Team collaboration (shared state via Git)
- Metrics and velocity tracking
- Export/reporting
- Plugin authoring SDK (let teams create custom agent plugins)
- Plugin marketplace with community contributions
- Auto-configure plugins on project init (detect stack → install matching plugins)
- Plugin dependency resolution and conflict detection
- Per-phase plugin activation (e.g., testing plugins only active during Test phase)
