import * as vscode from 'vscode';
import {
  discoverSdlc,
  projectRootFromSdlc,
  readManifest,
  readWorkIndex,
  readDecisionsIndex,
  readReleasesIndex,
  readLatestSnapshot,
  readContextDoc,
  readWorkItem,
  syncPlanProgress,
} from '@syncfusion/cs-sdlc';
import type {
  Manifest,
  WorkIndex,
  DecisionsIndex,
  ReleasesIndex,
  LatestSnapshot,
  ContextDocument,
  WorkItem,
} from '@syncfusion/cs-sdlc';

/**
 * Wraps the SDK to provide SDLC operations to the extension.
 * Reads ALL .sdlc/ data for the webview UI.
 */
export class SdlcService {
  private _sdlcRoot: string | undefined;
  private _manifest: Manifest | undefined;
  private _workIndex: WorkIndex | undefined;
  private _decisionsIndex: DecisionsIndex | undefined;
  private _releasesIndex: ReleasesIndex | undefined;
  private _snapshot: LatestSnapshot | undefined;
  private _contextDocs: Map<string, ContextDocument> = new Map();
  private _activeWorkItems: Map<string, WorkItem> = new Map();
  private _loaded = false;

  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private readonly _output: vscode.OutputChannel) {}

  // ── Getters ──────────────────────────────────────────────────────────

  get isLoaded(): boolean {
    return this._loaded;
  }

  get sdlcRoot(): string | undefined {
    return this._sdlcRoot;
  }

  getManifest(): Manifest | undefined {
    return this._manifest;
  }

  getWorkIndex(): WorkIndex | undefined {
    return this._workIndex;
  }

  getDecisionsIndex(): DecisionsIndex | undefined {
    return this._decisionsIndex;
  }

  getReleasesIndex(): ReleasesIndex | undefined {
    return this._releasesIndex;
  }

  getSnapshot(): LatestSnapshot | undefined {
    return this._snapshot;
  }

  getContextDoc(name: string): ContextDocument | undefined {
    return this._contextDocs.get(name);
  }

  getContextDocs(): Map<string, ContextDocument> {
    return this._contextDocs;
  }

  getActiveWorkItem(id: string): WorkItem | undefined {
    return this._activeWorkItems.get(id);
  }



  // ── Load / Refresh ───────────────────────────────────────────────────

  async tryLoad(): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return false;
    }

    const rootPath = workspaceFolders[0]!.uri.fsPath;

    // Step 1: Discover the .sdlc/ directory
    let sdlcRoot: string;
    let projectRoot: string;
    try {
      this._output.appendLine(`Searching for .sdlc/ from: ${rootPath}`);
      sdlcRoot = await discoverSdlc(rootPath);
      projectRoot = projectRootFromSdlc(sdlcRoot);
      this._output.appendLine(`Found .sdlc/ at: ${sdlcRoot}, project root: ${projectRoot}`);
    } catch (err) {
      this._output.appendLine(`No .sdlc/ directory found: ${err instanceof Error ? err.message : String(err)}`);
      this._loaded = false;
      return false;
    }

    // Step 2: Load data — manifest is required, everything else degrades gracefully
    try {
      this._sdlcRoot = projectRoot;
      await this._loadData(projectRoot);
      this._loaded = true;
      this._onDidChange.fire();
      return true;
    } catch (err) {
      // Even if _loadData fails (e.g., manifest is broken), we still found .sdlc/
      // Mark as loaded so the dashboard shows the project (with degraded data)
      this._output.appendLine(`Warning: .sdlc/ found but data loading had errors: ${err instanceof Error ? err.message : String(err)}`);
      this._sdlcRoot = projectRoot;
      this._loaded = true;
      this._onDidChange.fire();
      return true;
    }
  }

  async refresh(): Promise<void> {
    if (!this._sdlcRoot) {
      return;
    }

    try {
      await this._loadData(this._sdlcRoot);

      // Auto-sync: if agent edited todo.md directly (without #sdlcTodoToggle),
      // the frontmatter counters may be stale. Detect drift and fix silently.
      await this._autoSyncTodoCounters();

      this._onDidChange.fire();
    } catch (err) {
      this._output.appendLine(`Failed to refresh .sdlc/: ${err}`);
    }
  }

  /**
   * Detect and fix frontmatter counter drift in active work items.
   * If the checkbox count doesn't match the frontmatter, re-sync.
   */
  private async _autoSyncTodoCounters(): Promise<void> {
    if (!this._sdlcRoot) return;

    for (const [id, item] of this._activeWorkItems) {
      const todoDoc = item.todo ?? item.plan;
      if (!todoDoc) continue;

      const fm = todoDoc.frontMatter as Record<string, unknown> | null;
      const fmTotal = (fm?.totalTasks as number) ?? -1;
      const fmCompleted = (fm?.completedTasks as number) ?? -1;

      // Count actual checkboxes from body
      const lines = todoDoc.body.split('\n');
      let actualTotal = 0;
      let actualCompleted = 0;
      for (const line of lines) {
        const match = /^\s*-\s+\[([ xX])\]\s+/.exec(line);
        if (match) {
          actualTotal++;
          if (match[1] !== ' ') actualCompleted++;
        }
      }

      // If counters match, no drift
      if (fmTotal === actualTotal && fmCompleted === actualCompleted) continue;

      // Drift detected — sync silently
      try {
        this._output.appendLine(`Auto-sync: ${id} frontmatter drift (fm: ${fmCompleted}/${fmTotal}, actual: ${actualCompleted}/${actualTotal})`);
        await syncPlanProgress(this._sdlcRoot, id);
      } catch {
        // Non-critical — don't break refresh
      }
    }
  }

  // ── Status Summary ───────────────────────────────────────────────────

  getStatusSummary(): ProjectStatusSummary | undefined {
    if (!this._loaded || !this._manifest) {
      return undefined;
    }

    const workIndex = this._workIndex;
    const activeWork = workIndex?.active ?? [];
    const recentWork = workIndex?.recent ?? [];

    return {
      projectName: this._manifest.project.name,
      projectMode: this._manifest.project.mode ?? 'unknown',
      stack: this._manifest.stack,
      modules: this._manifest.modules ? Object.values(this._manifest.modules) : [],
      activeWorkCount: activeWork.length,
      activeWork,
      recentWork,
      totalDecisions: this._decisionsIndex?.entries?.length ?? 0,
      totalReleases: this._releasesIndex?.entries?.length ?? 0,
      counters: this._manifest.counters,
      health: this._manifest.health,
    };
  }

  /**
   * Get full data payload for the webview.
   */
  getFullData(): FullSdlcData {
    const status = this.getStatusSummary();

    // Serialize context docs
    const contextDocs: Record<string, ContextDocData> = {};
    for (const [name, doc] of this._contextDocs) {
      contextDocs[name] = {
        name,
        frontMatter: doc.document.frontMatter as Record<string, unknown> | null,
        body: doc.document.body,
        hasContent: doc.document.body.trim().length > 0 && !doc.document.body.includes('<!-- '),
      };
    }

    // Serialize active work items with plan details
    // Group sub-checkboxes by ## Task headings — a main task is "complete"
    // only when ALL its sub-checkboxes are checked.
    const activeWorkDetails: Record<string, ActiveWorkDetail> = {};
    for (const [id, item] of this._activeWorkItems) {
      // Parse tasks from todo.md (or plan.md for legacy items)
      const todoBody = item.todo?.body ?? item.plan?.body ?? '';
      const mainTasks = parsePlanMainTasks(todoBody);
      const totalTasks = mainTasks.length;
      const completedTasks = mainTasks.filter(t => t.completed).length;

      activeWorkDetails[id] = {
        id,
        specFrontMatter: item.spec.frontMatter as Record<string, unknown> | null,
        specBody: item.spec.body,
        hasPlan: item.plan !== null || item.todo !== null,
        planBody: item.plan?.body ?? null,
        planFrontMatter: item.plan?.frontMatter as Record<string, unknown> | null,
        totalTasks,
        completedTasks,
        tasks: mainTasks,
      };
    }

    // Serialize snapshot
    const snapshot: SnapshotData | null = this._snapshot
      ? {
          grade: (this._snapshot.overall as Record<string, unknown>)?.grade as string ?? null,
          score: (this._snapshot.overall as Record<string, unknown>)?.score as number ?? null,
          coverage: (this._snapshot.coverage as Record<string, unknown>)?.total as number ?? null,
          tests: this._snapshot.tests as { total: number; passing: number; failing: number } ?? null,
          vulnerabilities: (this._snapshot.security as Record<string, unknown>)?.vulnerabilities as number ?? null,
          generatedAt: this._snapshot.generatedAt,
        }
      : null;

    return {
      isLoaded: this._loaded,
      status,
      workIndex: this._workIndex
        ? { active: this._workIndex.active, recent: this._workIndex.recent }
        : null,
      decisionsIndex: this._decisionsIndex
        ? { entries: this._decisionsIndex.entries }
        : null,
      releasesIndex: this._releasesIndex
        ? { entries: this._releasesIndex.entries }
        : null,
      snapshot,
      contextDocs,
      activeWorkDetails,
    };
  }

  // ── Private ──────────────────────────────────────────────────────────

  private async _loadData(projectRoot: string): Promise<void> {
    // Manifest is required — if this fails, the project is truly broken
    this._manifest = await readManifest(projectRoot);

    // Indexes — gracefully degrade if any are missing or malformed
    try { this._workIndex = await readWorkIndex(projectRoot); }
    catch (err) {
      this._output.appendLine(`Warning: work.json failed validation, loading without work data: ${err instanceof Error ? err.message : String(err)}`);
      this._workIndex = undefined;
    }

    try { this._decisionsIndex = await readDecisionsIndex(projectRoot); }
    catch { this._decisionsIndex = undefined; }

    try { this._releasesIndex = await readReleasesIndex(projectRoot); }
    catch { this._releasesIndex = undefined; }

    // Snapshot (may not exist)
    try { this._snapshot = await readLatestSnapshot(projectRoot); }
    catch { this._snapshot = undefined; }

    // Context documents (may not exist)
    this._contextDocs.clear();
    for (const name of ['architecture', 'conventions', 'requirements', 'stack']) {
      try {
        const doc = await readContextDoc(projectRoot, name);
        this._contextDocs.set(name, doc);
      } catch {
        // Doc doesn't exist — skip
      }
    }

    // Active work item details + plan summaries
    this._activeWorkItems.clear();
    if (this._workIndex) {
      for (const entry of this._workIndex.active) {
        try {
          const item = await readWorkItem(projectRoot, entry.id);
          this._activeWorkItems.set(entry.id, item);
        } catch {
          this._output.appendLine(`Failed to read work item: ${entry.id}`);
        }
      }
    }
  }
}

// ── Plan Parsing ─────────────────────────────────────────────────────────

/**
 * Parse plan.md body into main tasks (## Task N: headings).
 * A main task is "completed" when ALL its sub-checkboxes are [x].
 * A main task with zero checkboxes is considered completed.
 */
function parsePlanMainTasks(planBody: string): Array<{ number: number; text: string; completed: boolean }> {
  const lines = planBody.split('\n');
  const tasks: Array<{ number: number; text: string; completed: boolean }> = [];

  let currentTask: { number: number; text: string; hasUnchecked: boolean; hasCheckboxes: boolean } | null = null;

  for (const line of lines) {
    // Match ## Task N: Title or ## Task N — Title
    const headingMatch = line.match(/^##\s+Task\s+(\d+)[:\s—–-]+(.*)$/i);
    if (headingMatch) {
      // Save previous task
      if (currentTask) {
        tasks.push({
          number: currentTask.number,
          text: currentTask.text,
          completed: currentTask.hasCheckboxes ? !currentTask.hasUnchecked : true,
        });
      }
      currentTask = {
        number: parseInt(headingMatch[1]!, 10),
        text: headingMatch[2]!.trim(),
        hasUnchecked: false,
        hasCheckboxes: false,
      };
      continue;
    }

    // Count checkboxes under current task
    if (currentTask) {
      if (/^\s*-\s+\[x\]/i.test(line)) {
        currentTask.hasCheckboxes = true;
      } else if (/^\s*-\s+\[\s\]/.test(line)) {
        currentTask.hasCheckboxes = true;
        currentTask.hasUnchecked = true;
      }
    }
  }

  // Save last task
  if (currentTask) {
    tasks.push({
      number: currentTask.number,
      text: currentTask.text,
      completed: currentTask.hasCheckboxes ? !currentTask.hasUnchecked : true,
    });
  }

  return tasks;
}

// ── Types ────────────────────────────────────────────────────────────────

export interface ProjectStatusSummary {
  projectName: string;
  projectMode: string;
  stack: unknown;
  modules: unknown[];
  activeWorkCount: number;
  activeWork: unknown[];
  recentWork: unknown[];
  totalDecisions: number;
  totalReleases: number;
  counters: unknown;
  health: unknown;
}

export interface ContextDocData {
  name: string;
  frontMatter: Record<string, unknown> | null;
  body: string;
  hasContent: boolean;
}

export interface ActiveWorkDetail {
  id: string;
  specFrontMatter: Record<string, unknown> | null;
  specBody: string;
  hasPlan: boolean;
  planBody: string | null;
  planFrontMatter: Record<string, unknown> | null;
  totalTasks: number;
  completedTasks: number;
  tasks: Array<{ number: number; text: string; completed: boolean }>;
}

export interface SnapshotData {
  grade: string | null;
  score: number | null;
  coverage: number | null;
  tests: { total: number; passing: number; failing: number } | null;
  vulnerabilities: number | null;
  generatedAt: string;
}

export interface WorkEntryData {
  id: string;
  title: string;
  type?: string;
  priority?: string;
  phase?: string;
  modules?: string[];
  progress?: number;
  totalTasks?: number;
  completedTasks?: number;
  status?: string;
  completedAt?: string;
  path?: string;
}

export interface DecisionEntryData {
  id: string;
  title: string;
  status?: string;
  date?: string;
  path?: string;
}

export interface ReleaseEntryData {
  version: string;
  title?: string;
  date?: string;
}

export interface FullSdlcData {
  isLoaded: boolean;
  status: ProjectStatusSummary | undefined;
  workIndex: { active: WorkEntryData[]; recent: WorkEntryData[] } | null;
  decisionsIndex: { entries: DecisionEntryData[] } | null;
  releasesIndex: { entries: ReleaseEntryData[] } | null;
  snapshot: SnapshotData | null;
  contextDocs: Record<string, ContextDocData>;
  activeWorkDetails: Record<string, ActiveWorkDetail>;
}
