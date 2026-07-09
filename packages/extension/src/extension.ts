import * as vscode from 'vscode';
import { SdlcService } from './services/sdlc-service.js';
import { SdlcFileWatcher } from './services/file-watcher.js';
import { ExtensionState } from './services/state.js';
import { registerCommands } from './commands/index.js';
import { MainViewProvider } from './views/main-view-provider.js';

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('SDLC Workflow');
  outputChannel.appendLine('SDLC Workflow extension activating...');

  // ── Core services ──────────────────────────────────────────────────────
  const state = new ExtensionState(context);
  const sdlcService = new SdlcService(outputChannel);
  const fileWatcher = new SdlcFileWatcher(sdlcService, outputChannel);

  // ── Sidebar webview ────────────────────────────────────────────────────
  const mainViewProvider = new MainViewProvider(
    context.extensionUri,
    sdlcService,
    state,
    outputChannel,
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'sdlc-workflow.mainView',
      mainViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  // ── Commands ───────────────────────────────────────────────────────────
  registerCommands(context, sdlcService, state, mainViewProvider, outputChannel);

  // ── File watcher ───────────────────────────────────────────────────────
  fileWatcher.start(context);

  // ── Status bar ─────────────────────────────────────────────────────────
  const statusBarItem = vscode.window.createStatusBarItem(
    'sdlc-workflow.status',
    vscode.StatusBarAlignment.Left,
    50,
  );
  statusBarItem.command = 'sdlc-workflow.openDashboard';
  statusBarItem.text = '$(rocket) SDLC';
  statusBarItem.tooltip = 'SDLC Workflow — Click to open dashboard';

  const config = vscode.workspace.getConfiguration('sdlc-workflow');
  if (config.get<boolean>('showStatusBar', true)) {
    statusBarItem.show();
  }

  context.subscriptions.push(statusBarItem);

  // Update status bar when config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('sdlc-workflow.showStatusBar')) {
        const show = vscode.workspace
          .getConfiguration('sdlc-workflow')
          .get<boolean>('showStatusBar', true);
        if (show) {
          statusBarItem.show();
        } else {
          statusBarItem.hide();
        }
      }
    }),
  );

  // ── Initial load ───────────────────────────────────────────────────────
  sdlcService.tryLoad().then((loaded) => {
    if (loaded) {
      const manifest = sdlcService.getManifest();
      if (manifest) {
        statusBarItem.text = `$(rocket) ${manifest.project.name}`;
        statusBarItem.tooltip = `SDLC Workflow — ${manifest.project.name}`;
      }
      outputChannel.appendLine('SDLC project loaded successfully');
    } else {
      outputChannel.appendLine('No .sdlc/ directory found in workspace');
    }
  });

  outputChannel.appendLine('SDLC Workflow extension activated');
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
