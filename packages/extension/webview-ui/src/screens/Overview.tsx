import { StatusCard } from '../components/StatusCard';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import type { ProjectStatus, WorkIndexData, SnapshotData, ContextDocData, ActiveWorkDetail } from '../types';

interface OverviewProps {
  status: ProjectStatus | null;
  workIndex: WorkIndexData | null;
  snapshot: SnapshotData | null;
  contextDocs: Record<string, ContextDocData>;
  activeWorkDetails?: Record<string, ActiveWorkDetail>;
  onNavigate: (screen: string) => void;
}

export function Overview({ status, workIndex, snapshot, contextDocs, activeWorkDetails, onNavigate }: OverviewProps) {
  const s = status;

  // Compute context completeness
  const contextDocNames = ['architecture', 'conventions', 'requirements', 'stack'];
  const configuredDocs = contextDocNames.filter(name => contextDocs[name]?.hasContent);
  const contextPct = contextDocNames.length > 0
    ? Math.round((configuredDocs.length / contextDocNames.length) * 100)
    : 0;
  const contextReady = configuredDocs.length >= 2; // at least architecture + conventions

  // Compute health status
  const hasSnapshot = snapshot && snapshot.grade;
  const healthPct = snapshot?.score ?? 0;

  // Stack subtitle
  const stackParts: string[] = [];
  if (s?.stack) {
    const stack = s.stack as Record<string, string>;
    if (stack.language) stackParts.push(stack.language);
    if (stack.framework) stackParts.push(stack.framework);
    if (stack.runtime) stackParts.push(stack.runtime);
  }
  const subtitle = s
    ? [
        s.projectMode,
        stackParts.length > 0 ? stackParts.join(' + ') : null,
        s.activeWorkCount > 0 ? `${s.activeWorkCount} active` : null,
      ].filter(Boolean).join(' · ') || 'Project loaded'
    : 'No project loaded';

  // Find next task for active work
  const activeWork = workIndex?.active?.[0];
  const activeDetail = activeWork ? activeWorkDetails?.[activeWork.id] : undefined;
  const nextTask = activeDetail?.tasks?.find(t => !t.completed);
  const progress = activeDetail
    ? (activeDetail.totalTasks > 0 ? Math.round((activeDetail.completedTasks / activeDetail.totalTasks) * 100) : 0)
    : 0;

  // Generate alerts
  const alerts: Array<{ icon: string; title: string; desc: string; action?: string; actionLabel?: string }> = [];
  if (Object.keys(contextDocs).length === 0) {
    alerts.push({
      icon: 'warning',
      title: 'Project context not configured',
      desc: 'Fill in architecture.md and conventions.md so the agent understands your project',
      action: 'context',
      actionLabel: 'Configure',
    });
  } else if (!contextReady) {
    alerts.push({
      icon: 'warning',
      title: 'Project context incomplete',
      desc: `${configuredDocs.length}/${contextDocNames.length} context documents configured`,
      action: 'context',
      actionLabel: 'Complete',
    });
  }
  if (!hasSnapshot) {
    alerts.push({
      icon: 'warning',
      title: 'No quality snapshot',
      desc: 'Take a snapshot to track project health, coverage, and test results',
    });
  }

  return (
    <div class="screen is-active">
      {/* Header */}
      <div>
        <div class="view-title">{s?.projectName || 'SDLC Workflow'}</div>
        <div class="view-subtitle">{subtitle}</div>
      </div>

      {/* Status Cards */}
      <div class="status-cards">
        {/* Plugins Card */}
        <StatusCard
          title="Plugins"
          icon="codicon-extensions"
          badge="Setup"
          badgeVariant="info"
          details={[{ icon: 'codicon-gear', text: 'Browse plugins to get started' }]}
          onClick={() => onNavigate('plugins')}
        />

        {/* Context Card */}
        <StatusCard
          title="Project Context"
          icon="codicon-file-text"
          badge={contextReady ? 'Complete' : configuredDocs.length > 0 ? `${configuredDocs.length}/${contextDocNames.length}` : 'Setup'}
          badgeVariant={contextReady ? 'success' : configuredDocs.length > 0 ? 'accent' : 'info'}
          details={[
            ...(contextDocs['architecture']?.hasContent
              ? [{ icon: 'codicon-symbol-structure', text: 'Architecture' }]
              : []),
            ...(contextDocs['conventions']?.hasContent
              ? [{ icon: 'codicon-symbol-ruler', text: 'Conventions' }]
              : []),
            { icon: 'codicon-layers', text: `${s?.modules?.length || 0} modules` },
            ...(!contextDocs['architecture']?.hasContent && !contextDocs['conventions']?.hasContent
              ? [{ icon: 'codicon-gear', text: 'Configure context docs' }]
              : []),
          ]}
          progress={contextPct}
          onClick={() => onNavigate('context')}
          ready={contextReady}
        />

        {/* Health Card */}
        <StatusCard
          title="Project Health"
          icon="codicon-heart"
          badge={hasSnapshot ? (snapshot.grade ?? 'N/A') : 'No data'}
          badgeVariant={hasSnapshot ? 'success' : 'info'}
          details={
            hasSnapshot
              ? [
                  { icon: 'codicon-shield', text: snapshot.coverage ? `${snapshot.coverage}% coverage` : 'No coverage' },
                  { icon: 'codicon-beaker', text: snapshot.tests ? `${snapshot.tests.passing}/${snapshot.tests.total} tests` : 'No tests' },
                  ...(snapshot.vulnerabilities !== null ? [{ icon: 'codicon-lock', text: `${snapshot.vulnerabilities} vulns` }] : []),
                ]
              : [{ icon: 'codicon-gear', text: 'Run tests and take a snapshot' }]
          }
          progress={hasSnapshot ? healthPct : undefined}
        />
      </div>

      {/* Active Work */}
      <div class="section">
        <div class="section-header">
          <span class="section-title">Active Work</span>
          {activeWork && <span class="badge badge-accent">In Progress</span>}
        </div>

        {activeWork ? (
          <div
            class="list-item"
            style="border-color:color-mix(in srgb, var(--vscode-progressBar-background) 30%, var(--vscode-panel-border)); cursor:pointer;"
            onClick={() => onNavigate('work')}
          >
            <span class="status-dot active" />
            <div class="list-info">
              <div class="list-name">{activeWork.title}</div>
              <div class="list-desc">{activeWork.type || 'feature'} · {activeWork.priority || 'medium'} priority</div>
              <div class="flex gap-md mt-sm" style="align-items:center;">
                <div class="progress-bar" style="max-width:160px;">
                  <div class="progress-fill" style={`width:${progress}%`} />
                </div>
                <span class="text-xs text-secondary">
                  {activeDetail?.completedTasks ?? 0}/{activeDetail?.totalTasks ?? 0} tasks
                </span>
              </div>
              {nextTask && (
                <div class="mt-sm" style="font-size:12px; color:var(--vscode-progressBar-background);">
                  <span class="codicon codicon-arrow-right" style="font-size:11px;" /> Next: {nextTask.text}
                </div>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              icon="codicon-comment-discussion"
              prompt={`Continue working on SDLC work item ${activeWork.id}: ${activeWork.title}. Show me the current progress and next steps.`}
            >
              Continue in Chat
            </Button>
          </div>
        ) : (
          <div class="list-item" style="justify-content:center; padding:14px;">
            <span class="text-secondary text-sm">No active work — go to <button class="btn-ghost" style="font-size:12px;" onClick={() => onNavigate('work')}>Work</button> to start</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div class="section">
        <div class="section-header">
          <span class="section-title">Quick Actions</span>
        </div>
        <div class="flex gap-sm flex-wrap">
          <Button icon="codicon-device-camera" command="sdlc-workflow.snapshot">
            Snapshot
          </Button>
          <Button icon="codicon-sync" command="sdlc-workflow.sync">
            Sync
          </Button>
          <Button icon="codicon-verified" prompt="Verify the acceptance criteria for the active SDLC work item.">
            Verify
          </Button>
        </div>
      </div>

      {/* Needs Attention */}
      {alerts.length > 0 && (
        <div class="section">
          <div class="section-header">
            <span class="section-title">Needs Attention</span>
          </div>
          {alerts.map((alert, i) => (
            <div key={i} class="list-item" style="border-color:color-mix(in srgb, var(--vscode-editorWarning-foreground) 30%, var(--vscode-panel-border));">
              <span class="status-dot warning" />
              <div class="list-info">
                <div class="list-name">{alert.title}</div>
                <div class="list-desc">{alert.desc}</div>
              </div>
              {alert.action && (
                <button class="btn btn-sm btn-secondary" onClick={() => onNavigate(alert.action!)}>
                  {alert.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recently Completed */}
      {workIndex && workIndex.recent.length > 0 && (
        <div class="section">
          <div class="section-header">
            <span class="section-title">Recently Completed</span>
            <button class="btn-ghost text-sm" onClick={() => onNavigate('history')}>View all</button>
          </div>
          {workIndex.recent.slice(0, 3).map((w) => (
            <div key={w.id} class="list-item">
              <span class="status-dot success" />
              <div class="list-info">
                <div class="list-name">{w.title}</div>
                <div class="list-desc">
                  {w.type || 'feature'}
                  {w.completedAt ? ` · ${formatRelativeTime(w.completedAt)}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
