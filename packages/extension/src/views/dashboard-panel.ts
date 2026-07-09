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
    private readonly _extensionUri: vscode.Uri,
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

    // URIs for the Preact webview bundle
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'webview.js'),
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'webview.css'),
    );

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
      style-src ${webview.cspSource};
      script-src 'nonce-${nonce}';
      font-src ${webview.cspSource};
      img-src ${webview.cspSource} https:;" />
  <title>SDLC Workflow</title>
  <link rel="stylesheet" href="${cssUri}" />
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

// ── OLD INLINE HTML REMOVED — Now using Preact webview-ui bundle ──

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
// END OF FILE
