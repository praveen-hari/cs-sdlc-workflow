import * as vscode from 'vscode';
import type { SdlcService } from '../services/sdlc-service.js';
import type { ExtensionState } from '../services/state.js';

/**
 * Full-width webview panel for the SDLC Workflow dashboard.
 * Opens in the editor area with the two-column layout from the mockup.
 */
export class DashboardPanel {
  private static _instance: DashboardPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    _extensionUri: vscode.Uri,
    private readonly _sdlcService: SdlcService,
    private readonly _state: ExtensionState,
    private readonly _output: vscode.OutputChannel,
  ) {
    this._panel = panel;
    this._panel.webview.html = this._getHtml(this._panel.webview);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      (msg) => this._handleMessage(msg),
      null,
      this._disposables,
    );

    // Refresh when data changes
    this._sdlcService.onDidChange(
      () => this._sendDataToWebview(),
      null,
      this._disposables,
    );

    // Clean up on dispose
    this._panel.onDidDispose(
      () => this._dispose(),
      null,
      this._disposables,
    );

    // Send initial data
    this._sendDataToWebview();
  }

  /**
   * Open or focus the dashboard panel.
   */
  static open(
    extensionUri: vscode.Uri,
    sdlcService: SdlcService,
    state: ExtensionState,
    output: vscode.OutputChannel,
  ): DashboardPanel {
    // If panel already exists, focus it
    if (DashboardPanel._instance) {
      DashboardPanel._instance._panel.reveal(vscode.ViewColumn.One);
      return DashboardPanel._instance;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      'sdlc-workflow.dashboard',
      'SDLC Workflow',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      },
    );

    panel.iconPath = new vscode.ThemeIcon('rocket');

    DashboardPanel._instance = new DashboardPanel(
      panel,
      extensionUri,
      sdlcService,
      state,
      output,
    );

    return DashboardPanel._instance;
  }

  /**
   * Switch to a specific screen.
   */
  switchScreen(screen: string): void {
    this._panel.reveal(vscode.ViewColumn.One);
    this._panel.webview.postMessage({ type: 'switchScreen', screen });
    this._state.setActiveScreen(screen);
  }

  private _dispose(): void {
    DashboardPanel._instance = undefined;
    for (const d of this._disposables) {
      d.dispose();
    }
    this._disposables = [];
  }

  private async _handleMessage(message: { type: string; [key: string]: unknown }): Promise<void> {
    switch (message.type) {
      case 'ready':
        this._sendDataToWebview();
        break;

      case 'switchScreen':
        await this._state.setActiveScreen(message.screen as string);
        break;

      case 'openInChat':
        await vscode.commands.executeCommand('workbench.action.chat.open', {
          query: message.prompt as string,
        });
        break;

      case 'executeCommand':
        await vscode.commands.executeCommand(
          message.command as string,
          ...(message.args as unknown[] ?? []),
        );
        break;

      case 'refresh':
        await this._sdlcService.refresh();
        break;

      default:
        this._output.appendLine(`Unknown webview message: ${message.type}`);
    }
  }

  private _sendDataToWebview(): void {
    const status = this._sdlcService.getStatusSummary();
    const workIndex = this._sdlcService.getWorkIndex();
    const decisionsIndex = this._sdlcService.getDecisionsIndex();
    const releasesIndex = this._sdlcService.getReleasesIndex();

    this._panel.webview.postMessage({
      type: 'dataUpdate',
      isLoaded: this._sdlcService.isLoaded,
      activeScreen: this._state.activeScreen,
      status,
      workIndex: workIndex ? { active: workIndex.active, recent: workIndex.recent } : null,
      decisionsIndex: decisionsIndex ? { entries: decisionsIndex.entries } : null,
      releasesIndex: releasesIndex ? { entries: releasesIndex.entries } : null,
    });
  }

  private _getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();

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
  <title>SDLC Workflow</title>
  <style>
    /* ── Reset ─────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body { height: 100%; overflow: hidden; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }

    /* ── Shell: Sidebar Nav (200px) + Detail Area ─────────── */
    .shell {
      display: grid;
      grid-template-columns: 200px 1fr;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Sidebar Nav ──────────────────────────────────────── */
    .sidebar {
      background: var(--vscode-sideBar-background);
      border-right: 1px solid var(--vscode-panel-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      height: 40px;
      min-height: 40px;
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-foreground);
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .sidebar-items {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 4px 0;
      overflow-y: auto;
    }

    .sidebar-footer {
      border-top: 1px solid var(--vscode-panel-border);
      padding: 4px 0;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 12px;
      background: none;
      border: none;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      text-align: left;
      transition: color 0.1s, background 0.1s;
    }

    .nav-btn .codicon { font-size: 16px; width: 20px; text-align: center; }
    .nav-btn-label { flex: 1; }

    .nav-btn:hover {
      color: var(--vscode-foreground);
      background: var(--vscode-list-hoverBackground);
    }

    .nav-btn.is-active {
      color: var(--vscode-list-activeSelectionForeground);
      background: var(--vscode-list-activeSelectionBackground);
    }

    .nav-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .nav-dot.success { background: var(--vscode-testing-iconPassed); }
    .nav-dot.active { background: var(--vscode-progressBar-background); }

    .nav-badge {
      min-width: 18px; height: 16px; padding: 0 5px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-size: 10px; font-weight: 600;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── Detail Area ──────────────────────────────────────── */
    .detail {
      overflow-y: auto;
      overflow-x: hidden;
    }

    .screen {
      display: none;
      flex-direction: column;
      gap: 16px;
      padding: 20px 24px;
      max-width: 960px;
    }
    .screen.is-active { display: flex; }

    /* ── Typography ───────────────────────────────────────── */
    .view-title { font-size: 20px; font-weight: 600; color: var(--vscode-foreground); }
    .view-subtitle { font-size: 13px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
    .section-title { font-size: 16px; font-weight: 600; color: var(--vscode-foreground); }
    .text-secondary { color: var(--vscode-descriptionForeground); }
    .text-sm { font-size: 12px; }
    .text-xs { font-size: 11px; }

    /* ── Status Cards (3-column grid) ─────────────────────── */
    .status-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .status-card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .status-card:hover { border-color: var(--vscode-focusBorder); }
    .status-card.is-ready { border-color: color-mix(in srgb, var(--vscode-testing-iconPassed) 30%, var(--vscode-panel-border)); }

    .status-card-top { display: flex; align-items: center; justify-content: space-between; }

    .status-card-icon {
      width: 32px; height: 32px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }

    .status-card-title { font-size: 13px; font-weight: 600; color: var(--vscode-foreground); }

    .status-card-details {
      display: flex; flex-wrap: wrap; gap: 8px;
      font-size: 11px; color: var(--vscode-descriptionForeground);
    }
    .status-card-details span { display: inline-flex; align-items: center; gap: 3px; }

    .status-card-bar { display: flex; align-items: center; gap: 8px; margin-top: auto; }

    /* ── Progress Bar ─────────────────────────────────────── */
    .progress-bar {
      flex: 1; height: 3px;
      background: color-mix(in srgb, var(--vscode-progressBar-background) 20%, transparent);
      border-radius: 2px; overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--vscode-progressBar-background);
      border-radius: 2px;
    }
    .progress-fill.is-success { background: var(--vscode-testing-iconPassed); }

    /* ── Buttons ──────────────────────────────────────────── */
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; height: 26px;
      border: none; border-radius: 4px;
      font-family: inherit; font-size: 12px;
      cursor: pointer; white-space: nowrap;
      transition: opacity 0.1s;
    }
    .btn:hover { opacity: 0.9; }
    .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
    .btn-secondary { background: transparent; color: var(--vscode-foreground); border: 1px solid var(--vscode-panel-border); }
    .btn-secondary:hover { background: var(--vscode-list-hoverBackground); }
    .btn-ghost { background: transparent; color: var(--vscode-textLink-foreground); padding: 2px 6px; border: none; cursor: pointer; font-family: inherit; font-size: inherit; }
    .btn-sm { height: 22px; padding: 0 8px; font-size: 11px; }

    /* ── Badge ────────────────────────────────────────────── */
    .badge {
      display: inline-flex; align-items: center;
      padding: 1px 6px; border-radius: 10px;
      font-size: 10px; font-weight: 500;
    }
    .badge-success { background: color-mix(in srgb, var(--vscode-testing-iconPassed) 20%, transparent); color: var(--vscode-testing-iconPassed); }
    .badge-accent { background: color-mix(in srgb, var(--vscode-progressBar-background) 20%, transparent); color: var(--vscode-progressBar-background); }
    .badge-info { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }

    /* ── Section ──────────────────────────────────────────── */
    .section { display: flex; flex-direction: column; gap: 8px; }
    .section-header { display: flex; align-items: baseline; justify-content: space-between; }

    /* ── List Items ───────────────────────────────────────── */
    .list-item {
      display: flex; align-items: center; gap: 12px;
      padding: 8px 12px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
    }
    .list-item:hover { border-color: var(--vscode-focusBorder); }

    .list-info { flex: 1; min-width: 0; }
    .list-name { font-size: 13px; font-weight: 500; color: var(--vscode-foreground); }
    .list-desc { font-size: 11px; color: var(--vscode-descriptionForeground); }

    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .status-dot.success { background: var(--vscode-testing-iconPassed); }
    .status-dot.active { background: var(--vscode-progressBar-background); }
    .status-dot.warning { background: var(--vscode-editorWarning-foreground); }

    /* ── Empty State ──────────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; text-align: center;
      padding: 48px 24px; min-height: 300px;
    }
    .empty-state .codicon { font-size: 40px; color: var(--vscode-descriptionForeground); margin-bottom: 16px; }

    /* ── Plugin icon row ──────────────────────────────────── */
    .plugin-icons { display: flex; gap: 6px; flex-wrap: wrap; }
    .plugin-icon {
      width: 32px; height: 32px; border-radius: 4px;
      border: 1px solid var(--vscode-panel-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; cursor: pointer;
    }
    .plugin-icon:hover { border-color: var(--vscode-focusBorder); }

    /* ── Flex utilities ───────────────────────────────────── */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .gap-xs { gap: 4px; }
    .gap-sm { gap: 6px; }
    .gap-md { gap: 8px; }
    .gap-lg { gap: 12px; }
    .gap-xl { gap: 16px; }
    .mt-sm { margin-top: 4px; }
    .mt-md { margin-top: 8px; }
    .mt-lg { margin-top: 12px; }
    .w-full { width: 100%; }
  </style>
</head>
<body>

<div class="shell">

  <!-- ===== Sidebar Navigation ===== -->
  <nav class="sidebar">
    <div class="sidebar-header">
      <span class="codicon codicon-rocket" style="color: var(--vscode-progressBar-background);"></span>
      <span>SDLC Workflow</span>
    </div>
    <div class="sidebar-items">
      <button class="nav-btn is-active" data-screen="overview">
        <span class="codicon codicon-home"></span>
        <span class="nav-btn-label">Overview</span>
      </button>
      <button class="nav-btn" data-screen="plugins">
        <span class="codicon codicon-extensions"></span>
        <span class="nav-btn-label">Plugins</span>
        <span class="nav-dot success"></span>
      </button>
      <button class="nav-btn" data-screen="context">
        <span class="codicon codicon-file-text"></span>
        <span class="nav-btn-label">Project Context</span>
        <span class="nav-dot success"></span>
      </button>
      <button class="nav-btn" data-screen="work">
        <span class="codicon codicon-tools"></span>
        <span class="nav-btn-label">Work</span>
        <span class="nav-dot active"></span>
      </button>
      <button class="nav-btn" data-screen="history">
        <span class="codicon codicon-history"></span>
        <span class="nav-btn-label">History</span>
        <span class="nav-badge" id="history-badge" style="display:none;">0</span>
      </button>
    </div>
    <div class="sidebar-footer">
      <button class="nav-btn" data-screen="settings">
        <span class="codicon codicon-settings-gear"></span>
        <span class="nav-btn-label">Settings</span>
      </button>
    </div>
  </nav>

  <!-- ===== Detail Area ===== -->
  <main class="detail">

    <!-- ── Overview ──────────────────────────────────────── -->
    <div class="screen is-active" id="screen-overview">
      <div>
        <div class="view-title" id="project-name">SDLC Workflow</div>
        <div class="view-subtitle" id="project-subtitle">No project loaded</div>
      </div>

      <div class="status-cards" id="overview-cards"></div>

      <div class="section" id="active-work-section" style="display:none;">
        <div class="section-header">
          <span class="section-title">Active Work</span>
          <span class="badge badge-accent">In Progress</span>
        </div>
        <div id="active-work-content"></div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">Quick Actions</span>
        </div>
        <div class="flex gap-sm flex-wrap">
          <button class="btn btn-secondary" data-action="openInChat" data-prompt="Start a new SDLC feature work item. Ask me what I want to build.">
            <span class="codicon codicon-add"></span> New Feature
          </button>
          <button class="btn btn-secondary" data-action="openInChat" data-prompt="Start a new SDLC bug fix work item. Ask me what's broken.">
            <span class="codicon codicon-bug"></span> Fix Bug
          </button>
          <button class="btn btn-secondary" data-action="command" data-command="sdlc-workflow.snapshot">
            <span class="codicon codicon-device-camera"></span> Snapshot
          </button>
          <button class="btn btn-secondary" data-action="command" data-command="sdlc-workflow.sync">
            <span class="codicon codicon-sync"></span> Sync
          </button>
          <button class="btn btn-secondary" data-action="openInChat" data-prompt="Verify the acceptance criteria for the active SDLC work item.">
            <span class="codicon codicon-verified"></span> Verify
          </button>
        </div>
      </div>

      <div class="section" id="alerts-section" style="display:none;">
        <div class="section-header">
          <span class="section-title">Needs Attention</span>
        </div>
        <div id="alerts-content"></div>
      </div>

      <div class="section" id="recent-section" style="display:none;">
        <div class="section-header">
          <span class="section-title">Recently Completed</span>
          <button class="btn-ghost text-sm" data-action="switchScreen" data-screen="history">View all</button>
        </div>
        <div id="recent-content"></div>
      </div>
    </div>

    <!-- ── Plugins ───────────────────────────────────────── -->
    <div class="screen" id="screen-plugins">
      <div>
        <div class="view-title">Plugins</div>
        <div class="view-subtitle">Equip your agent with the right tools for your project</div>
      </div>
      <div class="empty-state">
        <span class="codicon codicon-extensions"></span>
        <div class="view-title" style="font-size:14px;">Plugin Marketplace</div>
        <div class="text-secondary mt-sm">Browse and install agent plugins — coming soon</div>
      </div>
    </div>

    <!-- ── Project Context ───────────────────────────────── -->
    <div class="screen" id="screen-context">
      <div>
        <div class="view-title">Project Context</div>
        <div class="view-subtitle" id="context-subtitle">Not configured</div>
      </div>
      <div id="context-content"></div>
    </div>

    <!-- ── Work ──────────────────────────────────────────── -->
    <div class="screen" id="screen-work">
      <div>
        <div class="view-title">Work</div>
      </div>
      <div id="work-content"></div>
    </div>

    <!-- ── History ───────────────────────────────────────── -->
    <div class="screen" id="screen-history">
      <div>
        <div class="view-title">History</div>
        <div class="view-subtitle">Completed work and decisions</div>
      </div>
      <div id="history-content"></div>
    </div>

    <!-- ── Settings ──────────────────────────────────────── -->
    <div class="screen" id="screen-settings">
      <div>
        <div class="view-title">Settings</div>
        <div class="view-subtitle">Project configuration and preferences</div>
      </div>
      <div class="empty-state">
        <span class="codicon codicon-settings-gear"></span>
        <div style="font-size:14px;font-weight:600;">Coming Soon</div>
        <div class="text-secondary mt-sm">Project settings will be available here</div>
      </div>
    </div>

    <!-- ── Onboarding (no .sdlc/) ────────────────────────── -->
    <div class="screen" id="screen-onboarding">
      <div class="empty-state" style="min-height: 400px;">
        <span class="codicon codicon-rocket" style="font-size:48px; color: var(--vscode-progressBar-background); margin-bottom: 20px;"></span>
        <div class="view-title">Welcome to SDLC Workflow</div>
        <div class="text-secondary mt-sm" style="max-width: 360px; line-height: 1.5;">
          Set up AI-assisted development for your project. The agent will understand your codebase, follow your conventions, and track work from idea to completion.
        </div>
        <div class="flex flex-col gap-md mt-lg" style="width: 300px;">
          <button class="btn btn-primary w-full" style="justify-content:center; height:32px;"
            data-action="openInChat"
            data-prompt="Scan this workspace and initialize SDLC tracking. Detect the tech stack, modules, and conventions automatically, then create the .sdlc/ directory.">
            <span class="codicon codicon-search"></span> Set Up Existing Project
          </button>
          <button class="btn btn-secondary w-full" style="justify-content:center; height:32px;"
            data-action="openInChat"
            data-prompt="Initialize a new SDLC project for this workspace. Ask me for the project name and what I want to build.">
            <span class="codicon codicon-sparkle"></span> Start New Project
          </button>
        </div>
        <div class="text-secondary text-xs mt-lg">
          You can also type <code style="background:var(--vscode-textCodeBlock-background); padding:1px 4px; border-radius:3px;">/project-setup</code> in chat
        </div>
      </div>
    </div>

  </main>
</div>

<script nonce="${nonce}">
(function() {
  const vscode = acquireVsCodeApi();

  // ── Navigation ─────────────────────────────────────────────
  const navBtns = document.querySelectorAll('.nav-btn[data-screen]');
  const screens = document.querySelectorAll('.screen');

  function switchScreen(name) {
    screens.forEach(s => s.classList.remove('is-active'));
    navBtns.forEach(b => b.classList.remove('is-active'));
    const screen = document.getElementById('screen-' + name);
    const btn = document.querySelector('.nav-btn[data-screen="' + name + '"]');
    if (screen) screen.classList.add('is-active');
    if (btn) btn.classList.add('is-active');
    vscode.postMessage({ type: 'switchScreen', screen: name });
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
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

  // ── Data updates ───────────────────────────────────────────
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'dataUpdate') updateUI(msg);
    else if (msg.type === 'switchScreen') switchScreen(msg.screen);
  });

  function updateUI(data) {
    if (!data.isLoaded) {
      switchScreen('onboarding');
      return;
    }

    const s = data.status;
    if (!s) return;

    // Project header
    document.getElementById('project-name').textContent = s.projectName || 'SDLC Workflow';
    document.getElementById('project-subtitle').textContent =
      (s.projectMode || '') + ' · ' + (s.activeWorkCount > 0 ? s.activeWorkCount + ' active' : 'No active work');

    // Status cards
    renderOverviewCards(s);
    renderActiveWork(s, data.workIndex);
    renderRecentWork(data.workIndex);
    renderContextScreen(s);
    renderWorkScreen(s, data.workIndex);
    renderHistoryScreen(data.workIndex, data.decisionsIndex, data.releasesIndex);

    // Restore screen
    if (data.activeScreen && data.activeScreen !== 'onboarding') {
      switchScreen(data.activeScreen);
    } else {
      switchScreen('overview');
    }
  }

  function renderOverviewCards(s) {
    const el = document.getElementById('overview-cards');
    el.innerHTML =
      '<div class="status-card is-ready" data-action="switchScreen" data-screen="plugins">' +
        '<div class="status-card-top">' +
          '<div class="status-card-icon" style="background:color-mix(in srgb, var(--vscode-testing-iconPassed) 12%, transparent); color:var(--vscode-testing-iconPassed);"><span class="codicon codicon-extensions"></span></div>' +
          '<span class="badge badge-success">Ready</span>' +
        '</div>' +
        '<div class="status-card-title">Plugins</div>' +
        '<div class="status-card-details"><span><span class="codicon codicon-extensions"></span> Installed</span></div>' +
      '</div>' +
      '<div class="status-card is-ready" data-action="switchScreen" data-screen="context">' +
        '<div class="status-card-top">' +
          '<div class="status-card-icon" style="background:color-mix(in srgb, var(--vscode-testing-iconPassed) 12%, transparent); color:var(--vscode-testing-iconPassed);"><span class="codicon codicon-file-text"></span></div>' +
          '<span class="badge badge-success">Complete</span>' +
        '</div>' +
        '<div class="status-card-title">Project Context</div>' +
        '<div class="status-card-details">' +
          '<span><span class="codicon codicon-symbol-structure"></span> Architecture</span>' +
          '<span><span class="codicon codicon-symbol-ruler"></span> Conventions</span>' +
          '<span><span class="codicon codicon-layers"></span> ' + (s.modules?.length || 0) + ' modules</span>' +
        '</div>' +
      '</div>' +
      '<div class="status-card" style="cursor:default;">' +
        '<div class="status-card-top">' +
          '<div class="status-card-icon" style="background:color-mix(in srgb, var(--vscode-testing-iconPassed) 12%, transparent); color:var(--vscode-testing-iconPassed);"><span class="codicon codicon-heart"></span></div>' +
          '<span class="badge badge-success">' + (s.health?.grade || '--') + '</span>' +
        '</div>' +
        '<div class="status-card-title">Project Health</div>' +
        '<div class="status-card-details">' +
          '<span><span class="codicon codicon-shield"></span> ' + (s.health?.coverage ? s.health.coverage + '%' : '--') + '</span>' +
          '<span><span class="codicon codicon-beaker"></span> ' + (s.health?.tests?.passing ?? '--') + '/' + (s.health?.tests?.total ?? '--') + '</span>' +
        '</div>' +
      '</div>';
  }

  function renderActiveWork(s, workIndex) {
    const section = document.getElementById('active-work-section');
    const content = document.getElementById('active-work-content');
    if (!workIndex || workIndex.active.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'flex';
    const w = workIndex.active[0];
    content.innerHTML =
      '<div class="list-item" style="border-color:color-mix(in srgb, var(--vscode-progressBar-background) 30%, var(--vscode-panel-border)); cursor:pointer;" data-action="switchScreen" data-screen="work">' +
        '<span class="status-dot active"></span>' +
        '<div class="list-info">' +
          '<div class="list-name">' + w.id + ': ' + w.title + '</div>' +
          '<div class="list-desc">' + (w.type || 'feature') + ' · ' + (w.priority || 'medium') + ' priority</div>' +
          '<div class="flex gap-md mt-sm" style="align-items:center;">' +
            '<div class="progress-bar" style="max-width:160px;"><div class="progress-fill" style="width:' + (w.progress || 0) + '%;"></div></div>' +
            '<span class="text-xs text-secondary">' + (w.completedTasks || 0) + '/' + (w.totalTasks || 0) + ' tasks</span>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary btn-sm" data-action="openInChat" data-prompt="Continue working on SDLC work item ' + w.id + ': ' + w.title + '. Show me the current progress and next steps.">' +
          '<span class="codicon codicon-comment-discussion"></span> Continue in Chat' +
        '</button>' +
      '</div>';
  }

  function renderRecentWork(workIndex) {
    const section = document.getElementById('recent-section');
    const content = document.getElementById('recent-content');
    if (!workIndex || workIndex.recent.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'flex';
    content.innerHTML = workIndex.recent.slice(0, 3).map(w =>
      '<div class="list-item">' +
        '<span class="status-dot success"></span>' +
        '<div class="list-info">' +
          '<div class="list-name">' + w.id + ': ' + w.title + '</div>' +
          '<div class="list-desc">Completed' + (w.completedAt ? ' · ' + new Date(w.completedAt).toLocaleDateString() : '') + '</div>' +
        '</div>' +
      '</div>'
    ).join('');

    // Update history badge
    const badge = document.getElementById('history-badge');
    if (workIndex.recent.length > 0) {
      badge.style.display = 'flex';
      badge.textContent = workIndex.recent.length;
    }
  }

  function renderContextScreen(s) {
    const subtitle = document.getElementById('context-subtitle');
    const content = document.getElementById('context-content');
    subtitle.textContent = s.projectName + ' · ' + (s.projectMode || 'unknown');

    const stackStr = s.stack ? Object.entries(s.stack).filter(([,v]) => v).map(([k,v]) => k + ': ' + v).join(', ') : 'Not detected';

    content.innerHTML =
      '<div class="section">' +
        '<div class="section-title">Tech Stack</div>' +
        '<div class="flex gap-sm flex-wrap">' +
          (s.stack ? Object.values(s.stack).filter(Boolean).map(v =>
            '<span style="display:inline-flex;padding:3px 10px;font-size:12px;border-radius:12px;background:var(--vscode-textCodeBlock-background);border:1px solid var(--vscode-panel-border);color:var(--vscode-foreground);">' + v + '</span>'
          ).join('') : '<span class="text-secondary">Not detected</span>') +
        '</div>' +
      '</div>' +
      '<div class="section mt-lg">' +
        '<div class="section-title">Modules</div>' +
        '<div class="text-secondary text-sm">' + (s.modules?.length || 0) + ' modules detected</div>' +
      '</div>' +
      '<button class="btn btn-secondary mt-lg" data-action="openInChat" data-prompt="Show me the full SDLC project context — tech stack, modules, architecture, and conventions.">' +
        '<span class="codicon codicon-comment-discussion"></span> View Full Context in Chat' +
      '</button>';
  }

  function renderWorkScreen(s, workIndex) {
    const content = document.getElementById('work-content');
    if (!workIndex || workIndex.active.length === 0) {
      content.innerHTML =
        '<div class="empty-state">' +
          '<span class="codicon codicon-tools"></span>' +
          '<div style="font-size:14px;font-weight:600;">No Active Work</div>' +
          '<div class="text-secondary mt-sm">Start a new work item to begin development</div>' +
          '<button class="btn btn-primary mt-lg" data-action="command" data-command="sdlc-workflow.start">' +
            '<span class="codicon codicon-add"></span> Start New Work' +
          '</button>' +
        '</div>';
      return;
    }

    const w = workIndex.active[0];
    content.innerHTML =
      '<div class="list-item mt-md" style="flex-direction:column;align-items:stretch;gap:8px;">' +
        '<div class="flex gap-sm" style="align-items:center;">' +
          '<span class="badge badge-accent">' + (w.type || 'feature') + '</span>' +
          '<span class="badge badge-info">' + (w.priority || 'medium') + '</span>' +
          '<span class="badge badge-success" style="margin-left:auto;">Active</span>' +
        '</div>' +
        '<div class="view-title" style="font-size:16px;">' + w.id + ': ' + w.title + '</div>' +
        '<div class="flex gap-md" style="align-items:center;">' +
          '<div class="progress-bar" style="max-width:200px;"><div class="progress-fill" style="width:' + (w.progress || 0) + '%;"></div></div>' +
          '<span class="text-xs text-secondary">' + (w.completedTasks || 0) + '/' + (w.totalTasks || 0) + ' tasks</span>' +
        '</div>' +
        '<div class="flex gap-sm mt-sm">' +
          '<button class="btn btn-primary" data-action="openInChat" data-prompt="Continue working on ' + w.id + ': ' + w.title + '. Show progress and next steps.">' +
            '<span class="codicon codicon-comment-discussion"></span> Continue in Chat' +
          '</button>' +
          '<button class="btn btn-secondary" data-action="command" data-command="sdlc-workflow.done">' +
            '<span class="codicon codicon-check"></span> Done' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  function renderHistoryScreen(workIndex, decisionsIndex, releasesIndex) {
    const content = document.getElementById('history-content');
    const parts = [];

    // Recent work
    if (workIndex && workIndex.recent.length > 0) {
      parts.push('<div class="section"><div class="section-title">Completed Work</div>');
      parts.push(workIndex.recent.map(w =>
        '<div class="list-item">' +
          '<span class="status-dot success"></span>' +
          '<div class="list-info">' +
            '<div class="list-name">' + w.id + ': ' + w.title + '</div>' +
            '<div class="list-desc">' + (w.type || '') + (w.completedAt ? ' · ' + new Date(w.completedAt).toLocaleDateString() : '') + '</div>' +
          '</div>' +
        '</div>'
      ).join(''));
      parts.push('</div>');
    }

    // Decisions
    if (decisionsIndex && decisionsIndex.entries.length > 0) {
      parts.push('<div class="section mt-lg"><div class="section-title">Decisions</div>');
      parts.push(decisionsIndex.entries.map(d =>
        '<div class="list-item">' +
          '<span style="font-size:10px;font-weight:700;color:var(--vscode-descriptionForeground);min-width:28px;">' + d.id + '</span>' +
          '<div class="list-info">' +
            '<div class="list-name">' + d.title + '</div>' +
            '<div class="list-desc">' + (d.status || 'accepted') + ' · ' + (d.date || '') + '</div>' +
          '</div>' +
        '</div>'
      ).join(''));
      parts.push('</div>');
    }

    // Releases
    if (releasesIndex && releasesIndex.entries.length > 0) {
      parts.push('<div class="section mt-lg"><div class="section-title">Releases</div>');
      parts.push(releasesIndex.entries.map(r =>
        '<div class="list-item">' +
          '<span class="codicon codicon-tag" style="color:var(--vscode-progressBar-background);"></span>' +
          '<div class="list-info">' +
            '<div class="list-name">v' + r.version + (r.title ? ' — ' + r.title : '') + '</div>' +
            '<div class="list-desc">' + (r.date || '') + '</div>' +
          '</div>' +
        '</div>'
      ).join(''));
      parts.push('</div>');
    }

    if (parts.length === 0) {
      content.innerHTML =
        '<div class="empty-state">' +
          '<span class="codicon codicon-history"></span>' +
          '<div style="font-size:14px;font-weight:600;">No History Yet</div>' +
          '<div class="text-secondary mt-sm">Completed work items and decisions will appear here</div>' +
        '</div>';
    } else {
      content.innerHTML = parts.join('');
    }
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
