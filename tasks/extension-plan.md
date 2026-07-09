# SDLC Workflow Extension — Implementation Plan

## Architecture Decision

**No Chat Participant.** The built-in agent is the orchestrator.
We provide: **LM Tools** + **Skills** + **Agents** + **Instructions** + **Sidebar UI** + **Webview Panels** + **Commands**.

UI buttons send prompts to chat via `vscode.commands.executeCommand('workbench.action.chat.open', { query })`.

Prompts composed with `@vscode/prompt-tsx` for token-budget-aware rendering.

---

## Screens (from `.designs/`)

| Screen | File | Type | Description |
|--------|------|------|-------------|
| **Onboarding** | `standalone/onboarding.html` | Standalone webview | Greenfield (title+idea) / Brownfield (scan workspace) |
| **Overview** | `screens/overview.html` | Sidebar webview | Status cards (Plugins, Context, Health), Active Work, Quick Actions, Alerts |
| **Plugins** | `screens/agent-config.html` | Sidebar webview | Installed plugins grid, Recommended, All/Community/Personal tabs |
| **Plugin Detail** | `screens/plugin-detail.html` | Sidebar webview | Plugin info, What's Included (commands, skills, agents, hooks, MCP) |
| **Project Context** | `screens/context.html` | Sidebar webview | Empty state → Scan & Initialize; Configured state → Stack, Modules, Conventions |
| **Work** | `screens/work.html` | Sidebar webview | Empty → Create Form → Active Work (Brief/Plan/Review tabs) |
| **History** | `screens/history.html` | Sidebar webview | Completed work grouped by month, Decision records |
| **Settings** | `screens/settings.html` | Sidebar webview | Placeholder (future) |

---

## Phase 1 — Extension Scaffold + SDK Integration ✅ COMPLETE

**Goal:** Buildable extension that activates, registers commands, and reads `.sdlc/` data.

**Completed:** July 9, 2026 · Commit `1c7866b`

### Tasks

- [x] 1.1 **Scaffold `packages/extension/`**
  - `package.json` with `engines.vscode`, `activationEvents`, `main`, `contributes`
  - `tsconfig.json` (jsx: react, jsxFactory: vscpp for prompt-tsx)
  - `esbuild.config.mjs` for bundling
  - `src/extension.ts` with `activate()` / `deactivate()`

- [x] 1.2 **Add to monorepo**
  - Auto-detected by `pnpm-workspace.yaml` (`packages/*`)
  - Workspace dependency on `@syncfusion/cs-sdlc`
  - Dev dependencies: `@types/vscode`, `@types/node`, `esbuild`, `@vscode/prompt-tsx`

- [x] 1.3 **SDK Service Layer**
  - `src/services/sdlc-service.ts` — wraps `discoverSdlc`, `readManifest`, `readWorkIndex`, etc.
  - `src/services/file-watcher.ts` — watches `.sdlc/` with debounced refresh
  - `src/services/state.ts` — persists active screen, onboarding status via `workspaceState`

- [x] 1.4 **Register Commands** (8 total)
  - `sdlc-workflow.init` — Initialize SDLC tracking
  - `sdlc-workflow.start` — Start new work item (with input box)
  - `sdlc-workflow.status` — Show project status
  - `sdlc-workflow.done` — Complete active work item (with summary input)
  - `sdlc-workflow.openDashboard` — Open overview panel
  - `sdlc-workflow.openInChat` — Send prompt to chat
  - `sdlc-workflow.sync` — Manual data sync
  - `sdlc-workflow.snapshot` — Take project snapshot

- [x] 1.5 **Sidebar Webview + Status Bar**
  - `MainViewProvider` — single webview with internal routing (Overview, Plugins, Context, Work, History)
  - Uses **only** `--vscode-*` CSS variables and `codicon` icons
  - Message passing protocol: webview ↔ extension host
  - Onboarding screen when no `.sdlc/` found
  - Status bar item with project name
  - `.vscode/launch.json` + `tasks.json` for F5 debugging

- [x] 1.6 **Verify build + activation**
  - Clean typecheck, clean build
  - All 436 existing tests still pass

### Deliverable
Extension activates, commands registered, SDK reads `.sdlc/` data, sidebar webview renders.

---

## Phase 2 — Language Model Tools

**Goal:** Agent mode can read/write SDLC data autonomously.

### Tools to Register

| Tool Name | Purpose | Input |
|-----------|---------|-------|
| `sdlc_getProjectStatus` | Read manifest, active work, phase progress | `{}` |
| `sdlc_getProjectContext` | Read context docs (brief, architecture, conventions) | `{}` |
| `sdlc_listWorkItems` | List work items with optional status filter | `{ status?: string }` |
| `sdlc_getWorkItem` | Read a specific work item by ID | `{ id: string }` |
| `sdlc_createWorkItem` | Create a new work item | `{ title, type, priority, description }` |
| `sdlc_updateWorkItem` | Update work item status/notes | `{ id, status?, notes? }` |
| `sdlc_completeWorkItem` | Mark work item done with summary | `{ id, summary }` |
| `sdlc_logDecision` | Create an ADR | `{ title, status, context, decision, consequences }` |

### Implementation

2.1 **Tool base class** — `src/tools/base-tool.ts`
- Implements `vscode.LanguageModelTool<T>`
- Shared SDK service access, error handling, confirmation messages

2.2 **Implement each tool** — `src/tools/{tool-name}.ts`
- `prepareInvocation()` with confirmation message
- `invoke()` calls SDK, returns `LanguageModelToolResult`

2.3 **Prompt-tsx result rendering** — `src/prompts/`
- `ProjectStatusPrompt` — prioritized rendering of status data
- `WorkItemPrompt` — work item detail with budget-aware context
- `ProjectContextPrompt` — context docs with flex truncation
- Use `renderElementJSON()` to return `LanguageModelPromptTsxPart`

2.4 **Register all tools** in `activate()`
- `vscode.lm.registerTool('sdlc-workflow_getProjectStatus', new GetProjectStatusTool())`
- Declare in `package.json` `contributes.languageModelTools`

### Deliverable
In agent mode, user says "what's my project status?" → agent auto-calls `sdlc_getProjectStatus` → returns structured, budget-aware response.

---

## Phase 3 — Sidebar Webview UI

**Goal:** Activity bar icon → sidebar with all screens from mockups.

### Tasks

3.1 **Activity Bar + View Container**
```json
"viewsContainers": {
  "activitybar": [{
    "id": "sdlc-workflow",
    "title": "SDLC Workflow",
    "icon": "media/sdlc-icon.svg"
  }]
},
"views": {
  "sdlc-workflow": [{
    "type": "webview",
    "id": "sdlc-workflow.mainView",
    "name": "SDLC Workflow"
  }]
}
```

3.2 **WebviewViewProvider** — `src/views/main-view-provider.ts`
- Single webview with internal routing (like the mockup's `index.html`)
- Sidebar nav: Overview, Plugins, Project Context, Work, History, Settings
- Message passing protocol between webview ↔ extension host

3.3 **Webview HTML/CSS/JS**
- Port mockup HTML/CSS into webview templates
- Use VS Code CSS variables (`--vscode-*`) for theming
- `acquireVsCodeApi()` for message passing

3.4 **Screen implementations** (port from mockups)
- **Overview** — Status cards, active work, quick actions, alerts
- **Plugins** — Installed grid, recommended list, search
- **Plugin Detail** — Info, what's included (commands, skills, agents, hooks, MCP)
- **Project Context** — Empty state / Configured state with stack, modules, conventions
- **Work** — Empty → Create Form → Active Work (Brief/Plan/Review tabs)
- **History** — Completed work by month, decision records

3.5 **Webview ↔ Extension messaging**
```typescript
// Webview → Extension
vscode.postMessage({ type: 'openInChat', prompt: 'Start new feature: ...' });
vscode.postMessage({ type: 'getStatus' });
vscode.postMessage({ type: 'switchScreen', screen: 'work' });

// Extension → Webview
webview.postMessage({ type: 'statusUpdate', data: { ... } });
webview.postMessage({ type: 'workItemChanged', data: { ... } });
```

3.6 **"Continue in Chat" / "Open in Chat" buttons**
- All CTA buttons call `executeCommand('workbench.action.chat.open', { query })`
- Pre-crafted prompts based on context (e.g., "Continue working on FEAT-001: User Dashboard")

3.7 **Onboarding webview panel**
- Show as editor panel on first activation (no `.sdlc/` found)
- Greenfield: title + idea → sends init prompt to chat
- Brownfield: scan workspace → sends scan prompt to chat

### Deliverable
Full sidebar UI matching mockups, all screens navigable, buttons trigger chat prompts.

---

## Phase 4 — Bundled Skills + Agents + Instructions

**Goal:** Ship SDLC intelligence with the extension.

### Skills (via `contributes.chatSkills`)

| Skill | SKILL.md | Purpose |
|-------|----------|---------|
| `init-sdlc` | Scan workspace, detect stack, create `.sdlc/` | Greenfield + brownfield init |
| `plan-feature` | Break feature into work items with acceptance criteria | Feature planning |
| `implement-task` | Guide implementation of a single work item | Task execution |
| `review-work` | Review changes against requirements | Code review |
| `log-decision` | Structured ADR creation | Decision logging |

### Agents (via `contributes.chatAgents`)

| Agent | File | Purpose |
|-------|------|---------|
| `sdlc-workflow` | `agents/sdlc-workflow.agent.md` | Pre-configured SDLC persona with tools restricted to sdlc-workflow_* |

### Instructions (via `contributes.chatInstructions`)

| File | Purpose |
|------|---------|
| `prompts/sdlc-conventions.instructions.md` | Always-on rules: check `.sdlc/` before starting work, log decisions, update work items |

### Tasks

4.1 **Create skill folders** — `extension/skills/{name}/SKILL.md`
4.2 **Create agent file** — `extension/agents/sdlc-workflow.agent.md`
4.3 **Create instructions file** — `extension/prompts/sdlc-conventions.instructions.md`
4.4 **Register in `package.json`** — `contributes.chatSkills`, `chatAgents`, `chatInstructions`

### Deliverable
Agent automatically uses SDLC skills when relevant. Custom `sdlc-workflow` agent available in agent dropdown.

---

## Phase 5 — Status Bar + File Watcher + Polish

**Goal:** Real-time status, auto-refresh, production quality.

### Tasks

5.1 **Status bar items**
- Active project name
- Current work item (click → open Work screen)
- Phase indicator

5.2 **File watcher**
- Watch `.sdlc/` directory for changes
- Auto-refresh sidebar webview when data changes
- Debounced updates

5.3 **Walkthrough**
- `contributes.walkthroughs` — Getting Started with SDLC Workflow
- Steps: Initialize, Create first work item, Review, Complete

5.4 **Extension settings**
- `sdlc-workflow.autoSync` — Auto-sync on file changes
- `sdlc-workflow.showStatusBar` — Toggle status bar items

5.5 **Error handling + logging**
- Output channel for extension logs
- Graceful degradation when `.sdlc/` is missing

5.6 **Packaging**
- `.vscodeignore` for clean VSIX
- `vsce package` build script

### Deliverable
Production-ready extension with real-time updates, walkthrough, settings, clean packaging.

---

## File Structure

```
packages/extension/
├── package.json
├── tsconfig.json
├── esbuild.config.ts
├── src/
│   ├── extension.ts                 # activate() — registers everything
│   ├── services/
│   │   ├── sdlc-service.ts          # SDK wrapper
│   │   ├── file-watcher.ts          # .sdlc/ watcher
│   │   └── state.ts                 # Extension state
│   ├── tools/
│   │   ├── index.ts                 # Register all tools
│   │   ├── base-tool.ts             # Shared tool base
│   │   ├── get-project-status.ts
│   │   ├── get-project-context.ts
│   │   ├── list-work-items.ts
│   │   ├── get-work-item.ts
│   │   ├── create-work-item.ts
│   │   ├── update-work-item.ts
│   │   ├── complete-work-item.ts
│   │   └── log-decision.ts
│   ├── prompts/                     # prompt-tsx components
│   │   ├── project-status.tsx
│   │   ├── work-item.tsx
│   │   └── project-context.tsx
│   ├── views/
│   │   └── main-view-provider.ts    # WebviewViewProvider
│   ├── commands/
│   │   └── index.ts                 # Register all commands
│   └── utils/
│       ├── webview-utils.ts         # HTML gen, CSP, theming
│       └── constants.ts
├── webview/                          # Webview frontend assets
│   ├── index.html                   # Shell with sidebar nav
│   ├── screens/
│   │   ├── overview.html
│   │   ├── plugins.html
│   │   ├── plugin-detail.html
│   │   ├── context.html
│   │   ├── work.html
│   │   └── history.html
│   ├── standalone/
│   │   └── onboarding.html
│   └── css/
│       ├── base.css
│       ├── components.css
│       └── layout.css
├── skills/
│   ├── init-sdlc/SKILL.md
│   ├── plan-feature/SKILL.md
│   ├── implement-task/SKILL.md
│   ├── review-work/SKILL.md
│   └── log-decision/SKILL.md
├── agents/
│   └── sdlc-workflow.agent.md
├── prompts/
│   └── sdlc-conventions.instructions.md
└── media/
    └── sdlc-icon.svg
```

---

## Execution Order

| Phase | What | Depends On | Status |
|-------|------|------------|--------|
| **1** | Scaffold + SDK integration | SDK (done ✅) | ✅ **DONE** (Jul 9) |
| **2** | Language Model Tools + prompt-tsx | Phase 1 | ⬜ Next |
| **3** | Sidebar Webview UI (rich screens) | Phase 1 | ⬜ |
| **4** | Skills + Agents + Instructions | Phase 2 | ⬜ |
| **5** | Polish + Packaging | Phase 3, 4 | ⬜ |

**Note:** Phase 1 also delivered the sidebar webview shell, status bar, and file watcher (originally planned for Phase 3/5). Phases 2 & 3 can run in parallel.

**Phases 2 and 3 can run in parallel** after Phase 1 is complete.

**Total: ~8-13 days**
