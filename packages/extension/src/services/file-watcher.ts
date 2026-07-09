import * as vscode from 'vscode';
import type { SdlcService } from './sdlc-service.js';

/**
 * Watches the .sdlc/ directory for changes and triggers a refresh.
 */
export class SdlcFileWatcher {
  private _watcher: vscode.FileSystemWatcher | undefined;
  private _debounceTimer: NodeJS.Timeout | ReturnType<typeof globalThis.setTimeout> | undefined;

  constructor(
    private readonly _sdlcService: SdlcService,
    private readonly _output: vscode.OutputChannel,
  ) {}

  start(context: vscode.ExtensionContext): void {
    // Watch for .sdlc/**/*.json and .sdlc/**/*.md changes
    this._watcher = vscode.workspace.createFileSystemWatcher(
      '**/.sdlc/**',
    );

    const debouncedRefresh = () => {
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }
      this._debounceTimer = setTimeout(async () => {
        const config = vscode.workspace.getConfiguration('sdlc-workflow');
        if (!config.get<boolean>('autoSync', true)) {
          return;
        }

        if (!this._sdlcService.isLoaded) {
          // .sdlc/ was just created — try to load for the first time
          this._output.appendLine('.sdlc/ detected — loading project');
          await this._sdlcService.tryLoad();
        } else {
          // Already loaded — just refresh data
          this._output.appendLine('.sdlc/ changed — refreshing data');
          await this._sdlcService.refresh();
        }
      }, 500);
    };

    this._watcher.onDidChange(debouncedRefresh);
    this._watcher.onDidCreate(debouncedRefresh);
    this._watcher.onDidDelete(debouncedRefresh);

    context.subscriptions.push(this._watcher);
  }

  dispose(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this._watcher?.dispose();
  }
}
