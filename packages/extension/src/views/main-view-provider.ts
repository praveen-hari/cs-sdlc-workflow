import * as vscode from 'vscode';
import type { SdlcService } from '../services/sdlc-service.js';
import type { ExtensionState } from '../services/state.js';

/**
 * Provides the main sidebar webview for SDLC Workflow.
 * Uses VS Code theme colors and codicons exclusively.
 */
export class MainViewProvider implements vscode.WebviewViewProvider {
  private _view: vscode.WebviewView | undefined;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _sdlcService: SdlcService,
    private readonly _state: ExtensionState,
    private readonly _output: vscode.OutputChannel,
  ) {
    // Refresh webview when SDLC data changes
    this._sdlcService.onDidChange(() => {
      this._sendDataToWebview();
    });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this._handleMessage(message);
    });

    // Send initial data once webview is ready
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this._sendDataToWebview();
      }
    });
  }

  /**
   * Switch the active screen in the webview.
   */
  switchScreen(screen: string): void {
    this._state.setActiveScreen(screen);
    this._view?.webview.postMessage({
      type: 'switchScreen',
      screen,
    });
  }

  // ── Private ──────────────────────────────────────────────────────────

  private async _handleMessage(message: { type: string; [key: string]: unknown }): Promise<void> {
    switch (message.type) {
      case 'ready':
        this._sendDataToWebview();
        break;

      case 'switchScreen':
        await this._state.setActiveScreen(message.screen as string);
        break;

      case 'openInChat': {
        const prompt = message.prompt as string;
        await vscode.commands.executeCommand('workbench.action.chat.open', {
          query: prompt,
        });
        break;
      }

      case 'executeCommand': {
        const commandId = message.command as string;
        const args = message.args as unknown[] | undefined;
        await vscode.commands.executeCommand(commandId, ...(args ?? []));
        break;
      }

      case 'getStatus':
        this._sendDataToWebview();
        break;

      default:
        this._output.appendLine(`Unknown webview message: ${message.type}`);
    }
  }

  private _sendDataToWebview(): void {
    if (!this._view?.visible) {
      return;
    }

    const status = this._sdlcService.getStatusSummary();
    this._view.webview.postMessage({
      type: 'dataUpdate',
      isLoaded: this._sdlcService.isLoaded,
      activeScreen: this._state.activeScreen,
      status,
    });
  }

  private _getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();

    // Codicons are provided by VS Code automatically in webviews

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
      style-src ${webview.cspSource} 'unsafe-inline';
      script-src 'nonce-${nonce}';
      font-src ${webview.cspSource};
      img-src ${webview.cspSource} https:;" />
  <style>
    /* ── Reset ─────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      line-height: 1.4;
      overflow-x: hidden;
    }

    /* ── Sidebar Nav ──────────────────────────────────────────── */
    .nav {
      display: flex;
      gap: 2px;
      padding: 4px 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background);
      overflow-x: auto;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--vscode-foreground);
      font-family: inherit;
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
      opacity: 0.7;
      transition: opacity 0.1s, background 0.1s;
    }

    .nav-btn:hover {
      opacity: 1;
      background: var(--vscode-list-hoverBackground);
    }

    .nav-btn.is-active {
      opacity: 1;
      background: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
    }

    .nav-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .nav-dot.success { background: var(--vscode-testing-iconPassed); }
    .nav-dot.active { background: var(--vscode-progressBar-background); }
    .nav-dot.warning { background: var(--vscode-editorWarning-foreground); }

    /* ── Content Area ─────────────────────────────────────────── */
    .content {
      padding: 12px;
      overflow-y: auto;
      height: calc(100vh - 36px);
    }

    .screen { display: none; }
    .screen.is-active { display: flex; flex-direction: column; gap: 12px; }

    /* ── Typography ───────────────────────────────────────────── */
    .title {
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .subtitle {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-foreground);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ── Cards ────────────────────────────────────────────────── */
    .card {
      padding: 10px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
    }

    .card:hover {
      border-color: var(--vscode-focusBorder);
    }

    .card-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      font-size: 16px;
      flex-shrink: 0;
    }

    /* ── Buttons ──────────────────────────────────────────────── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border: none;
      border-radius: 4px;
      font-family: inherit;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.1s;
    }

    .btn:hover { opacity: 0.9; }

    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .btn-ghost {
      background: transparent;
      color: var(--vscode-textLink-foreground);
      padding: 2px 6px;
    }

    /* ── Badge ────────────────────────────────────────────────── */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 500;
    }

    .badge-info {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }

    .badge-success {
      background: color-mix(in srgb, var(--vscode-testing-iconPassed) 20%, transparent);
      color: var(--vscode-testing-iconPassed);
    }

    .badge-warning {
      background: color-mix(in srgb, var(--vscode-editorWarning-foreground) 20%, transparent);
      color: var(--vscode-editorWarning-foreground);
    }

    .badge-error {
      background: color-mix(in srgb, var(--vscode-editorError-foreground) 20%, transparent);
      color: var(--vscode-editorError-foreground);
    }

    /* ── Progress Bar ─────────────────────────────────────────── */
    .progress {
      height: 3px;
      background: var(--vscode-progressBar-background);
      border-radius: 2px;
      opacity: 0.2;
    }

    .progress-fill {
      height: 100%;
      background: var(--vscode-progressBar-background);
      border-radius: 2px;
      opacity: 1;
    }

    /* ── List Items ───────────────────────────────────────────── */
    .list-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
    }

    .list-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-dot.success { background: var(--vscode-testing-iconPassed); }
    .status-dot.active { background: var(--vscode-progressBar-background); }
    .status-dot.warning { background: var(--vscode-editorWarning-foreground); }
    .status-dot.error { background: var(--vscode-editorError-foreground); }

    /* ── Empty State ──────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 32px 16px;
      min-height: 200px;
    }

    .empty-state .codicon {
      font-size: 32px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
    }

    /* ── Utilities ────────────────────────────────────────────── */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .gap-sm { gap: 4px; }
    .gap-md { gap: 8px; }
    .gap-lg { gap: 12px; }
    .text-secondary { color: var(--vscode-descriptionForeground); }
    .text-link { color: var(--vscode-textLink-foreground); cursor: pointer; }
    .text-xs { font-size: 10px; }
    .text-sm { font-size: 11px; }
    .font-mono { font-family: var(--vscode-editor-font-family); }
    .w-full { width: 100%; }
    .mt-sm { margin-top: 4px; }
    .mt-md { margin-top: 8px; }
    .mt-lg { margin-top: 12px; }
  </style>
</head>
<body>

  <!-- Navigation -->
  <nav class="nav" id="nav">
    <button class="nav-btn is-active" data-screen="overview">
      <span class="codicon codicon-home"></span> Overview
    </button>
    <button class="nav-btn" data-screen="plugins">
      <span class="codicon codicon-extensions"></span> Plugins
    </button>
    <button class="nav-btn" data-screen="context">
      <span class="codicon codicon-file-text"></span> Context
    </button>
    <button class="nav-btn" data-screen="work">
      <span class="codicon codicon-tools"></span> Work
    </button>
    <button class="nav-btn" data-screen="history">
      <span class="codicon codicon-history"></span> History
    </button>
  </nav>

  <!-- Content -->
  <div class="content" id="content">

    <!-- Overview Screen -->
    <div class="screen is-active" id="screen-overview">
      <div>
        <div class="title" id="project-name">SDLC Workflow</div>
        <div class="subtitle" id="project-subtitle">No project loaded</div>
      </div>

      <div class="flex flex-col gap-md" id="status-cards">
        <!-- Populated by JS -->
      </div>

      <div>
        <div class="section-header">
          <span class="section-title">Quick Actions</span>
        </div>
        <div class="flex gap-sm" style="flex-wrap: wrap;">
          <button class="btn btn-secondary" data-action="openInChat" data-prompt="Start a new feature work item">
            <span class="codicon codicon-add"></span> New Feature
          </button>
          <button class="btn btn-secondary" data-action="openInChat" data-prompt="Start a new bug fix work item">
            <span class="codicon codicon-bug"></span> Fix Bug
          </button>
          <button class="btn btn-secondary" data-action="command" data-command="sdlc-workflow.sync">
            <span class="codicon codicon-sync"></span> Sync
          </button>
          <button class="btn btn-secondary" data-action="command" data-command="sdlc-workflow.snapshot">
            <span class="codicon codicon-device-camera"></span> Snapshot
          </button>
        </div>
      </div>
    </div>

    <!-- Plugins Screen -->
    <div class="screen" id="screen-plugins">
      <div class="title">Plugins</div>
      <div class="subtitle">Equip your agent with the right tools</div>
      <div class="empty-state mt-lg">
        <span class="codicon codicon-extensions"></span>
        <div class="title">Plugin Marketplace</div>
        <div class="subtitle mt-sm">Coming in Phase 3</div>
      </div>
    </div>

    <!-- Context Screen -->
    <div class="screen" id="screen-context">
      <div class="title">Project Context</div>
      <div class="subtitle" id="context-subtitle">Not configured</div>
      <div id="context-content">
        <!-- Populated by JS based on state -->
      </div>
    </div>

    <!-- Work Screen -->
    <div class="screen" id="screen-work">
      <div class="title">Work</div>
      <div id="work-content">
        <!-- Populated by JS based on state -->
      </div>
    </div>

    <!-- History Screen -->
    <div class="screen" id="screen-history">
      <div class="title">History</div>
      <div class="subtitle">Completed work and decisions</div>
      <div class="empty-state mt-lg">
        <span class="codicon codicon-history"></span>
        <div class="title">No History Yet</div>
        <div class="subtitle mt-sm">Completed work items will appear here</div>
      </div>
    </div>

    <!-- Onboarding (shown when no .sdlc/) -->
    <div class="screen" id="screen-onboarding">
      <div class="empty-state">
        <span class="codicon codicon-rocket" style="font-size: 40px; color: var(--vscode-progressBar-background); margin-bottom: 16px;"></span>
        <div class="title" style="font-size: 14px;">Welcome to SDLC Workflow</div>
        <div class="subtitle mt-md" style="max-width: 280px; line-height: 1.5;">
          Track your development workflow with AI-powered project management.
        </div>

        <div class="flex flex-col gap-md mt-lg w-full" style="max-width: 300px;">
          <button class="btn btn-primary w-full" style="justify-content: center; padding: 8px;"
            data-action="openInChat"
            data-prompt="Initialize a new SDLC project for this workspace. Ask me for the project name and description, then create the .sdlc/ directory.">
            <span class="codicon codicon-add"></span> New Project
          </button>
          <button class="btn btn-secondary w-full" style="justify-content: center; padding: 8px;"
            data-action="openInChat"
            data-prompt="Scan this workspace and initialize SDLC tracking. Detect the tech stack, modules, and conventions automatically.">
            <span class="codicon codicon-search"></span> Scan Existing Project
          </button>
        </div>
      </div>
    </div>

  </div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();

      // ── Navigation ─────────────────────────────────────────────
      const navBtns = document.querySelectorAll('.nav-btn');
      const screens = document.querySelectorAll('.screen');

      function switchScreen(name) {
        screens.forEach(s => s.classList.remove('is-active'));
        navBtns.forEach(b => b.classList.remove('is-active'));

        const screen = document.getElementById('screen-' + name);
        const btn = document.querySelector('[data-screen="' + name + '"]');
        if (screen) screen.classList.add('is-active');
        if (btn) btn.classList.add('is-active');

        vscode.postMessage({ type: 'switchScreen', screen: name });
      }

      navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          switchScreen(btn.dataset.screen);
        });
      });

      // ── Action buttons ─────────────────────────────────────────
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        if (action === 'openInChat') {
          vscode.postMessage({ type: 'openInChat', prompt: btn.dataset.prompt });
        } else if (action === 'command') {
          vscode.postMessage({ type: 'executeCommand', command: btn.dataset.command });
        } else if (action === 'switchScreen') {
          switchScreen(btn.dataset.screen);
        }
      });

      // ── Data updates from extension ────────────────────────────
      window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'dataUpdate') {
          updateUI(msg);
        } else if (msg.type === 'switchScreen') {
          switchScreen(msg.screen);
        }
      });

      function updateUI(data) {
        if (!data.isLoaded) {
          // Show onboarding
          switchScreen('onboarding');
          document.getElementById('nav').style.display = 'none';
          return;
        }

        document.getElementById('nav').style.display = 'flex';

        if (data.status) {
          document.getElementById('project-name').textContent = data.status.projectName || 'SDLC Workflow';
          document.getElementById('project-subtitle').textContent =
            data.status.projectMode + ' project' +
            (data.status.activeWorkCount > 0 ? ' · ' + data.status.activeWorkCount + ' active' : '');

          renderStatusCards(data.status);
          renderContextScreen(data.status);
          renderWorkScreen(data.status);
        }

        // Restore last active screen
        if (data.activeScreen && data.activeScreen !== 'onboarding') {
          switchScreen(data.activeScreen);
        }
      }

      function renderStatusCards(status) {
        const container = document.getElementById('status-cards');
        container.innerHTML = '';

        // Active work card
        if (status.activeWorkCount > 0) {
          const work = status.activeWork[0];
          container.innerHTML += '<div class="card" data-action="switchScreen" data-screen="work" style="cursor:pointer;">' +
            '<div class="card-row">' +
              '<span class="status-dot active"></span>' +
              '<div style="flex:1;min-width:0;">' +
                '<div class="text-sm" style="font-weight:500;">' + (work.id || 'Active Work') + '</div>' +
                '<div class="text-xs text-secondary">' + (work.title || 'In progress') + '</div>' +
              '</div>' +
              '<span class="badge badge-info">' + status.activeWorkCount + ' active</span>' +
            '</div>' +
            '<div class="mt-sm">' +
              '<button class="btn btn-primary" data-action="openInChat" data-prompt="Continue working on the active SDLC work item. Show me the current progress and next steps.">' +
                '<span class="codicon codicon-comment-discussion"></span> Continue in Chat' +
              '</button>' +
            '</div>' +
          '</div>';
        }

        // Stats row
        container.innerHTML +=
          '<div class="flex gap-sm">' +
            '<div class="card" style="flex:1;text-align:center;">' +
              '<div class="text-sm" style="font-weight:600;">' + (status.counters?.work ?? 0) + '</div>' +
              '<div class="text-xs text-secondary">Work Items</div>' +
            '</div>' +
            '<div class="card" style="flex:1;text-align:center;">' +
              '<div class="text-sm" style="font-weight:600;">' + status.totalDecisions + '</div>' +
              '<div class="text-xs text-secondary">Decisions</div>' +
            '</div>' +
            '<div class="card" style="flex:1;text-align:center;">' +
              '<div class="text-sm" style="font-weight:600;">' + status.totalReleases + '</div>' +
              '<div class="text-xs text-secondary">Releases</div>' +
            '</div>' +
          '</div>';
      }

      function renderContextScreen(status) {
        const subtitle = document.getElementById('context-subtitle');
        const content = document.getElementById('context-content');

        subtitle.textContent = status.projectName + ' · ' + status.projectMode;
        content.innerHTML =
          '<div class="card">' +
            '<div class="section-title" style="margin-bottom:6px;">Tech Stack</div>' +
            '<div class="text-sm">' + JSON.stringify(status.stack || {}, null, 0).slice(0, 200) + '</div>' +
          '</div>' +
          '<div class="card mt-md">' +
            '<div class="section-title" style="margin-bottom:6px;">Modules</div>' +
            '<div class="text-sm">' + (status.modules?.length || 0) + ' modules detected</div>' +
          '</div>' +
          '<button class="btn btn-secondary mt-md" data-action="openInChat" data-prompt="Show me the full SDLC project context — tech stack, modules, architecture, and conventions.">' +
            '<span class="codicon codicon-comment-discussion"></span> View Full Context in Chat' +
          '</button>';
      }

      function renderWorkScreen(status) {
        const content = document.getElementById('work-content');

        if (status.activeWorkCount === 0) {
          content.innerHTML =
            '<div class="empty-state">' +
              '<span class="codicon codicon-tools"></span>' +
              '<div class="title">No Active Work</div>' +
              '<div class="subtitle mt-sm">Start a new work item to begin</div>' +
              '<button class="btn btn-primary mt-lg" data-action="command" data-command="sdlc-workflow.start">' +
                '<span class="codicon codicon-add"></span> Start New Work' +
              '</button>' +
            '</div>';
          return;
        }

        const work = status.activeWork[0];
        content.innerHTML =
          '<div class="card mt-md">' +
            '<div class="flex gap-sm" style="align-items:center;margin-bottom:6px;">' +
              '<span class="badge badge-info">' + (work.type || 'feature') + '</span>' +
              '<span class="badge badge-success">Active</span>' +
            '</div>' +
            '<div class="title">' + (work.id || '') + ': ' + (work.title || 'Untitled') + '</div>' +
            '<div class="text-xs text-secondary mt-sm">' + (work.description || '') + '</div>' +
            '<div class="flex gap-sm mt-md">' +
              '<button class="btn btn-primary" data-action="openInChat" data-prompt="Continue working on ' + (work.id || 'the active work item') + '. Show progress and next steps.">' +
                '<span class="codicon codicon-comment-discussion"></span> Continue in Chat' +
              '</button>' +
              '<button class="btn btn-secondary" data-action="command" data-command="sdlc-workflow.done">' +
                '<span class="codicon codicon-check"></span> Done' +
              '</button>' +
            '</div>' +
          '</div>';
      }

      // ── Init ───────────────────────────────────────────────────
      vscode.postMessage({ type: 'ready' });
    })();
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
