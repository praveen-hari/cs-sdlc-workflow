import * as vscode from 'vscode';
import {
  discoverSdlc,
  projectRootFromSdlc,
  readManifest,
  readWorkIndex,
  readDecisionsIndex,
  readReleasesIndex,
} from '@syncfusion/cs-sdlc';
import type {
  Manifest,
  WorkIndex,
  DecisionsIndex,
  ReleasesIndex,
} from '@syncfusion/cs-sdlc';

/**
 * Wraps the SDK to provide SDLC operations to the extension.
 * All file I/O goes through this service.
 */
export class SdlcService {
  private _sdlcRoot: string | undefined;
  private _manifest: Manifest | undefined;
  private _workIndex: WorkIndex | undefined;
  private _decisionsIndex: DecisionsIndex | undefined;
  private _releasesIndex: ReleasesIndex | undefined;
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

  // ── Load / Refresh ───────────────────────────────────────────────────

  /**
   * Try to find and load .sdlc/ from the workspace.
   * Returns true if found and loaded.
   */
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
      // discoverSdlc throws NotFoundError if no .sdlc/ exists
      this._loaded = false;
      return false;
    }
  }

  /**
   * Reload all data from disk.
   */
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

  // ── Operations ───────────────────────────────────────────────────────

  /**
   * Get a summary of the current project status.
   */
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

  // ── Private ──────────────────────────────────────────────────────────

  private async _loadData(projectRoot: string): Promise<void> {
    this._manifest = await readManifest(projectRoot);
    this._workIndex = await readWorkIndex(projectRoot);

    try {
      this._decisionsIndex = await readDecisionsIndex(projectRoot);
    } catch {
      this._decisionsIndex = undefined;
    }

    try {
      this._releasesIndex = await readReleasesIndex(projectRoot);
    } catch {
      this._releasesIndex = undefined;
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
