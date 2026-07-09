# SDLC Workflow — Application Architecture

## Navigation

### Pattern: VS Code Extension — Activity Bar + Sidebar + Editor Panels

This is a VS Code extension, not a standalone web app. Navigation follows VS Code's native patterns:

**Activity Bar (left icon strip):**
- 🚀 **SDLC Workflow** icon → Opens the primary sidebar with all views

**Primary Sidebar (tree views + webview views):**
- Project Explorer (tree view)
- SDLC Progress (webview view)
- Work Items (tree view)
- Agent Plugins (tree view)
- Quick Actions (webview view)

**Editor Area (webview panels — opened on demand):**
- Dashboard, Task Board, Work Item Detail, Requirement Editor, AI Plan Review, Plugin Marketplace, Active Agent Context, File Impact, Test Summary, Approval History, Settings

**Top Bar (within each webview panel):**
- Panel title + breadcrumb
- Search (contextual)
- Action buttons (contextual per panel)

**Status Bar (bottom):**
- Active project name
- Current SDLC phase
- Active work item count
- Active plugin count

**Context Menus & Command Palette:**
- Right-click actions on tree items
- `Cmd+Shift+P` → "SDLC Workflow: ..." commands

---

## Screen Inventory

| #  | Screen                  | Type      | Priority | Description |
|----|-------------------------|-----------|----------|-------------|
| 1  | `dashboard`             | dashboard | P0       | Project KPIs, SDLC phase progress ring, recent activity feed, quick action cards, work item summary by status |
| 2  | `task-board`            | kanban    | P0       | Kanban columns: Backlog, Planned, In Progress, In Review, Testing, Approved, Completed, Blocked. Drag-and-drop cards with priority badges, assignee avatars, type icons |
| 3  | `work-item-detail`      | detail    | P0       | Full work item view with tabs: Overview, Requirements, Implementation Plan, Files & Impact, Tests, Reviews & Approvals. Header with status, priority, type, assignee, phase |
| 4  | `work-item-create`      | form      | P0       | Create new work item: type selector (feature/bug/enhancement/refactor/docs/test/deploy), title, description, requirements, acceptance criteria, priority, assignee, related files, dependencies |
| 5  | `ai-plan-review`        | detail    | P0       | Agent's proposed implementation plan: step-by-step breakdown, impacted files, estimated changes, risk assessment. Approve/Reject/Request Changes/Pause action bar |
| 6  | `plugin-marketplace`    | list      | P0       | Browse agent plugins: card grid with icon, name, description, install count, compatibility badge. Filter by category (framework, testing, deployment, linting, etc.), search bar, installed/available tabs |
| 7  | `active-agent-context`  | detail    | P0       | Current agent session context: active project info, active work item, loaded skills list, loaded plugins list, custom rules, token budget bar. Edit toggles to enable/disable individual context items |
| 8  | `settings-project`      | settings  | P0       | Project context configuration: project name, description, business goal, target users, tech stack chips, frameworks, coding standards, deployment env, repo structure mapping |
| 9  | `requirement-editor`    | form      | P1       | Rich requirement editor: title, description (markdown), user stories, acceptance criteria checklist, priority, linked work items, attachments, approval status |
| 10 | `file-impact`           | detail    | P1       | Files affected by a work item: file tree with change indicators (added/modified/deleted), inline diff previews, dependency graph, risk highlights |
| 11 | `test-summary`          | detail    | P1       | Test & validation results: pass/fail counts, coverage percentage bar, test list with status icons, failing test details, validation checklist |
| 12 | `approval-history`      | list      | P1       | Timeline of all review decisions: reviewer name, action (approved/rejected/changes requested), timestamp, comments, linked work item, phase gate |
| 13 | `plugin-detail`         | detail    | P1       | Single plugin view: description, documentation, configuration options, compatibility matrix, changelog, install/uninstall/configure actions |
| 14 | `plugin-settings`       | settings  | P1       | Per-plugin configuration: enable/disable toggle, scope selector (project/workspace), plugin-specific settings form, reset to defaults |
| 15 | `sdlc-phase-detail`     | detail    | P2       | Single SDLC phase view: entry criteria checklist, exit criteria checklist, associated work items, phase-specific documentation, approval gate status |
| 16 | `work-item-edit`        | form      | P2       | Edit existing work item (same layout as create, pre-filled) |
| 17 | `onboarding`            | empty     | P2       | First-run experience: welcome message, "Create your first project" CTA, quick setup wizard steps |
| 18 | `dependency-graph`      | detail    | P2       | Visual dependency map between work items: node graph showing blockers, dependencies, critical path highlighting |

**Total: 18 screens** (8 P0, 6 P1, 4 P2)

---

## Sidebar Views (Tree Views & Webview Views)

### 1. Project Explorer (Tree View)
```
📁 SDLC Workflow
  └─ 📦 my-saas-app                    ← project name
       ├─ 📋 Plan                       ← SDLC phase (with progress %)
       │    ├─ ✅ Define requirements    ← completed work item
       │    └─ 🔵 Break down tasks      ← in-progress work item
       ├─ 🔨 Implement
       │    ├─ 🔵 AUTH-001: Login flow   ← active work item
       │    ├─ ⬜ AUTH-002: OAuth setup   ← planned
       │    └─ ⬜ UI-003: Dashboard       ← backlog
       ├─ 🧪 Test
       ├─ 👁️ Review
       └─ 🚀 Deploy
```

**Interactions:**
- Click project → opens Dashboard
- Click phase → opens SDLC Phase Detail
- Click work item → opens Work Item Detail
- Right-click project → "New Work Item", "Open Dashboard", "Open Task Board", "Settings"
- Right-click work item → "Edit", "Change Status", "Assign", "View Plan", "Delete"
- Right-click phase → "View Phase", "Add Work Item to Phase"

### 2. SDLC Progress (Webview View — compact)
```
┌─────────────────────────────┐
│  SDLC Progress              │
│                             │
│  Plan        ████████░░ 80% │
│  Implement   ███░░░░░░░ 30% │
│  Test        ░░░░░░░░░░  0% │
│  Review      ░░░░░░░░░░  0% │
│  Deploy      ░░░░░░░░░░  0% │
│                             │
│  Overall     ███░░░░░░░ 22% │
└─────────────────────────────┘
```

### 3. Work Items (Tree View)
```
📋 Work Items (12)
  ├─ 🔵 In Progress (2)
  │    ├─ 🐛 BUG-004: Fix auth redirect
  │    └─ ✨ FEAT-001: User dashboard
  ├─ 👁️ In Review (1)
  │    └─ ✨ FEAT-002: Task board
  ├─ ⬜ Backlog (6)
  │    ├─ ✨ FEAT-003: Plugin marketplace
  │    ├─ 🔧 REFAC-001: Extract utils
  │    └─ ... 4 more
  └─ ✅ Completed (3)
       ├─ ✨ FEAT-000: Project setup
       └─ ... 2 more
```

**Grouped by:** Status (default), Phase, Type, Priority, Assignee

### 4. Agent Plugins (Tree View)
```
🧩 Agent Plugins
  ├─ ✅ Active (3)
  │    ├─ 🟢 react-components     v2.1.0
  │    ├─ 🟢 jest-testing         v1.4.2
  │    └─ 🟢 eslint-rules         v3.0.1
  ├─ 💤 Installed (2)
  │    ├─ ⚪ docker-deploy         v1.0.0
  │    └─ ⚪ api-design            v2.3.0
  └─ 💡 Recommended (4)
       ├─ ⭐ tailwind-css          "Matches your stack"
       ├─ ⭐ github-actions        "For CI/CD phase"
       └─ ... 2 more
```

**Interactions:**
- Click plugin → opens Plugin Detail
- Right-click → "Activate", "Deactivate", "Configure", "Uninstall"
- Click "Recommended" item → opens Plugin Detail with install CTA
- "Browse All" link → opens Plugin Marketplace panel

### 5. Quick Actions (Webview View — compact)
```
┌─────────────────────────────┐
│  Quick Actions              │
│                             │
│  [+ New Work Item]          │
│  [▶ Start Work]             │
│  [📸 Take Snapshot]         │
│  [🔄 Sync Status]           │
│  [📊 Open Dashboard]        │
│  [🧩 Browse Plugins]        │
└─────────────────────────────┘
```

---

## Key User Journeys

### Journey 1: First-Time Setup
`onboarding` → `settings-project` → `dashboard`

User installs the extension, sees the onboarding welcome screen. Clicks "Create Project" which opens the project settings form. They fill in project name, description, tech stack, and goals. On save, the `.sdlc/` folder is initialized and the dashboard opens showing an empty project ready for work.

### Journey 2: Plan a New Feature
`dashboard` → `work-item-create` → `work-item-detail` → `ai-plan-review` → `work-item-detail`

From the dashboard, user clicks "+ New Work Item". They select type "Feature", fill in the requirement and acceptance criteria. After saving, the work item detail opens. They click "Generate Plan" which triggers the AI agent. The AI Plan Review panel opens showing the agent's proposed implementation steps, impacted files, and test cases. User reviews, requests one change, agent revises, user approves. The plan is saved to the work item.

### Journey 3: Review AI Agent Work
`work-item-detail` (notification) → `ai-plan-review` → `file-impact` → `test-summary` → `approval-history`

User receives a notification: "FEAT-001 ready for review". They click it to open the work item detail. The "Reviews" tab shows the agent has completed implementation. User clicks "View Changes" to see the File Impact view with diffs. Then checks the Test Summary to see all tests passing. Finally approves the work item, which logs the decision in Approval History and advances the item to "Approved" status.

### Journey 4: Configure Agent Plugins for a Task
`work-item-detail` → `plugin-marketplace` → `plugin-detail` → `active-agent-context`

User opens a work item for building a React component. The sidebar shows a "Recommended: react-components" plugin suggestion. User clicks it, reviews the plugin detail (docs, compatibility), and installs it. They then open the Active Agent Context panel to verify the plugin is loaded alongside the project context. They toggle off an irrelevant plugin (docker-deploy) since this task doesn't involve deployment.

### Journey 5: Track Progress Across Phases
`dashboard` → `task-board` → `sdlc-phase-detail` → `approval-history`

Team lead opens the dashboard to see overall project health. The SDLC progress ring shows "Implement" phase at 60%. They click into the Task Board to see which items are blocked or in review. They open the "Test" phase detail to check if entry criteria are met. Finally, they review the Approval History to see recent decisions and ensure nothing was auto-approved without human review.

### Journey 6: Bug Fix Workflow
`work-item-create` (type: Bug) → `work-item-detail` → `ai-plan-review` → `file-impact` → `test-summary` → `work-item-detail`

Developer discovers a bug, creates a work item with type "Bug", describes the issue and expected behavior. The AI agent analyzes the codebase and proposes a fix plan. Developer reviews the plan, approves it. Agent implements the fix. Developer checks the File Impact view (only 2 files changed), verifies the Test Summary (regression tests pass, new test added), and marks the bug as resolved.

---

## Standalone Pages
These screens have a different layout (no sidebar — they are full-panel webviews or modal-like experiences):
- `onboarding` — Full-panel welcome screen with setup wizard
- `settings-project` — Can also open as a full editor tab (no sidebar context needed)

---

## VS Code Integration Points

| VS Code Surface | Integration |
|----------------|-------------|
| **Activity Bar** | Custom icon for SDLC Workflow — opens the sidebar |
| **Sidebar** | 5 views: Project Explorer, SDLC Progress, Work Items, Agent Plugins, Quick Actions |
| **Editor Area** | Webview panels for all detail/form/dashboard/kanban screens |
| **Status Bar** | 4 items: project name, phase, work item count, plugin count |
| **Command Palette** | ~20 commands: "SDLC Workflow: New Work Item", "SDLC Workflow: Open Dashboard", etc. |
| **Context Menus** | Explorer: "Add to Work Item", SCM: "Link Commit to Work Item" |
| **Notifications** | Review requests, phase completions, blocker alerts, plugin recommendations |
| **Settings** | Extension settings for defaults, theme, notification preferences |
| **Git Integration** | Auto-link commits to work items via branch naming or commit message conventions |
| **Problems Panel** | Surface validation issues (missing acceptance criteria, unsigned approvals) |
