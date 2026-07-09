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
  listPlanTasks,
} from '@syncfusion/cs-sdlc';
import type {
  Manifest,
  WorkIndex,
  DecisionsIndex,
  ReleasesIndex,
  LatestSnapshot,
  ContextDocument,
  WorkItem,
  PlanSummary,
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
  private _planSummaries: Map<string, PlanSummary> = new Map();
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

  getPlanSummary(id: string): PlanSummary | undefined {
    return this._planSummaries.get(id);
  }

  // ── Load / Refresh ───────────────────────────────────────────────────

  async tryLoad(): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return false;
    }

    const rootPath = workspaceFolders[0]!.uri.fsPath;

    try {
      const sdlcRoot = await discoverSdlc(rootPath);
      const projectRoot = projectRootFromSdlc(sdlcRoot);

      this._sdlcRoot = projectRoot;
      await this._loadData(projectRoot);
      this._loaded = true;
      this._onDidChange.fire();
      return true;
    } catch {
      this._loaded = false;
      return false;
    }
  }

  async refresh(): Promise<void> {
    if (!this._sdlcRoot) {
      return;
    }

    try {
      await this._loadData(this._sdlcRoot);
      this._onDidChange.fire();
    } catch (err) {
      this._output.appendLine(`Failed to refresh .sdlc/: ${err}`);
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
    const activeWorkDetails: Record<string, ActiveWorkDetail> = {};
    for (const [id, item] of this._activeWorkItems) {
      const planSummary = this._planSummaries.get(id);
      activeWorkDetails[id] = {
        id,
        briefFrontMatter: item.brief.frontMatter as Record<string, unknown> | null,
        briefBody: item.brief.body,
        hasPlan: item.plan !== null,
        planBody: item.plan?.body ?? null,
        planFrontMatter: item.plan?.frontMatter as Record<string, unknown> | null,
        totalTasks: planSummary?.totalTasks ?? 0,
        completedTasks: planSummary?.completedTasks ?? 0,
        tasks: planSummary?.tasks ?? [],
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
    // Core data (always needed)
    this._manifest = await readManifest(projectRoot);
    this._workIndex = await readWorkIndex(projectRoot);

    // Indexes (may not exist)
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
    this._planSummaries.clear();
    if (this._workIndex) {
      for (const entry of this._workIndex.active) {
        try {
          const item = await readWorkItem(projectRoot, entry.id);
          this._activeWorkItems.set(entry.id, item);
        } catch {
          this._output.appendLine(`Failed to read work item: ${entry.id}`);
        }

        try {
          const plan = await listPlanTasks(projectRoot, entry.id);
          this._planSummaries.set(entry.id, plan);
        } catch {
          // No plan or parse error — skip
        }
      }
    }
  }
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
  briefFrontMatter: Record<string, unknown> | null;
  briefBody: string;
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

export interface FullSdlcData {
  isLoaded: boolean;
  status: ProjectStatusSummary | undefined;
  workIndex: { active: unknown[]; recent: unknown[] } | null;
  decisionsIndex: { entries: unknown[] } | null;
  releasesIndex: { entries: unknown[] } | null;
  snapshot: SnapshotData | null;
  contextDocs: Record<string, ContextDocData>;
  activeWorkDetails: Record<string, ActiveWorkDetail>;
}
