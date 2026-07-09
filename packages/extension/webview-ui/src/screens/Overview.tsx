import { StatusCard } from '../components/StatusCard';
import { Button } from '../components/Button';
import { openInChat } from '../vscode';
import type { ProjectStatus, WorkIndexData } from '../types';

interface OverviewProps {
  status: ProjectStatus | null;
  workIndex: WorkIndexData | null;
  onNavigate: (screen: string) => void;
}

export function Overview({ status, workIndex, onNavigate }: OverviewProps) {
  const s = status;

  return (
    <div class="screen is-active">
      {/* Header */}
      <div>
        <div class="view-title">{s?.projectName || 'SDLC Workflow'}</div>
        <div class="view-subtitle">
          {s ? `${s.projectMode} · ${s.activeWorkCount > 0 ? `${s.activeWorkCount} active` : 'No active work'}` : 'No project loaded'}
        </div>
      </div>

      {/* Status Cards */}
      <div class="status-cards">
        <StatusCard
          title="Plugins"
          icon="codicon-extensions"
          badge="Ready"
          details={[{ icon: 'codicon-extensions', text: 'Installed' }]}
          onClick={() => onNavigate('plugins')}
          ready
        />
        <StatusCard
          title="Project Context"
          icon="codicon-file-text"
          badge="Complete"
          details={[
            { icon: 'codicon-symbol-structure', text: 'Architecture' },
            { icon: 'codicon-symbol-ruler', text: 'Conventions' },
            { icon: 'codicon-layers', text: `${s?.modules?.length || 0} modules` },
          ]}
          onClick={() => onNavigate('context')}
          ready
        />
        <StatusCard
          title="Project Health"
          icon="codicon-heart"
          badge={s?.health?.grade || '--'}
          details={[
            { icon: 'codicon-shield', text: s?.health?.coverage ? `${s.health.coverage}%` : '--' },
            { icon: 'codicon-beaker', text: `${s?.health?.tests?.passing ?? '--'}/${s?.health?.tests?.total ?? '--'}` },
          ]}
        />
      </div>

      {/* Active Work */}
      {workIndex && workIndex.active.length > 0 && (
        <div class="section">
          <div class="section-header">
            <span class="section-title">Active Work</span>
            <span class="badge badge-accent">In Progress</span>
          </div>
          {workIndex.active.map((w) => (
            <div
              key={w.id}
              class="list-item"
              style="border-color:color-mix(in srgb, var(--vscode-progressBar-background) 30%, var(--vscode-panel-border)); cursor:pointer;"
              onClick={() => onNavigate('work')}
            >
              <span class="status-dot active" />
              <div class="list-info">
                <div class="list-name">{w.id}: {w.title}</div>
                <div class="list-desc">{w.type || 'feature'} · {w.priority || 'medium'} priority</div>
                <div class="flex gap-md mt-sm" style="align-items:center;">
                  <div class="progress-bar" style="max-width:160px;">
                    <div class="progress-fill" style={`width:${w.progress || 0}%`} />
                  </div>
                  <span class="text-xs text-secondary">{w.completedTasks || 0}/{w.totalTasks || 0} tasks</span>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon="codicon-comment-discussion"
                prompt={`Continue working on SDLC work item ${w.id}: ${w.title}. Show me the current progress and next steps.`}
              >
                Continue in Chat
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div class="section">
        <div class="section-header">
          <span class="section-title">Quick Actions</span>
        </div>
        <div class="flex gap-sm flex-wrap">
          <Button icon="codicon-add" prompt="Start a new SDLC feature work item. Ask me what I want to build.">
            New Feature
          </Button>
          <Button icon="codicon-bug" prompt="Start a new SDLC bug fix work item. Ask me what's broken.">
            Fix Bug
          </Button>
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
                <div class="list-name">{w.id}: {w.title}</div>
                <div class="list-desc">
                  Completed{w.completedAt ? ` · ${new Date(w.completedAt).toLocaleDateString()}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
