import { executeCommand } from '../vscode';

export function Settings() {
  return (
    <div class="screen is-active">
      <div>
        <div class="view-title">Settings</div>
        <div class="view-subtitle">Extension preferences</div>
      </div>

      {/* Settings list */}
      <div class="section">
        <div class="section-title">Preferences</div>
        <div class="list-item" style="cursor:pointer;" onClick={() => executeCommand('workbench.action.openSettings', '@ext:syncfusion.cs-sdlc-extension')}>
          <span class="codicon codicon-settings-gear" style="font-size:16px; color:var(--vscode-descriptionForeground);" />
          <div class="list-info">
            <div class="list-name">Open Extension Settings</div>
            <div class="list-desc">Auto sync, status bar visibility, and more</div>
          </div>
          <span class="codicon codicon-arrow-right" style="color:var(--vscode-descriptionForeground);" />
        </div>
      </div>

      {/* About */}
      <div class="section">
        <div class="section-title">About</div>
        <div class="list-item" style="flex-direction:column; align-items:flex-start; gap:4px;">
          <div class="flex gap-lg" style="width:100%;">
            <div class="list-info">
              <div class="list-name">SDLC Workflow</div>
              <div class="list-desc">AI-powered SDLC project management</div>
            </div>
            <span class="badge badge-info">v0.1.0</span>
          </div>
          <div class="text-xs text-secondary" style="margin-top:4px;">
            SDK: @syncfusion/cs-sdlc v0.1.0 · .sdlc/ spec v1.0
          </div>
        </div>
      </div>

      {/* Links */}
      <div class="section">
        <div class="section-title">Resources</div>
        <div class="list-item" style="cursor:pointer;" onClick={() => executeCommand('workbench.action.openOutputChannel', 'SDLC Workflow')}>
          <span class="codicon codicon-output" style="font-size:16px; color:var(--vscode-descriptionForeground);" />
          <div class="list-info">
            <div class="list-name">View Logs</div>
            <div class="list-desc">Open the SDLC Workflow output channel</div>
          </div>
          <span class="codicon codicon-arrow-right" style="color:var(--vscode-descriptionForeground);" />
        </div>
      </div>
    </div>
  );
}
