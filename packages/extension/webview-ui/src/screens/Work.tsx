import { useState } from 'preact/hooks';
import { Button } from '../components/Button';
import { openFile, openInChat } from '../vscode';
import type { ProjectStatus, WorkIndexData, ActiveWorkDetail } from '../types';

interface WorkProps {
  status: ProjectStatus | null;
  workIndex: WorkIndexData | null;
  activeWorkDetails: Record<string, ActiveWorkDetail>;
}

type WorkView = 'empty' | 'create' | 'active';

export function Work({ workIndex, activeWorkDetails }: WorkProps) {
  const hasActive = workIndex && workIndex.active.length > 0;
  const [view, setView] = useState<WorkView>(hasActive ? 'active' : 'empty');
  const [tab, setTab] = useState<'brief' | 'plan' | 'review'>('plan');

  // Form state
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState('feature');
  const [formPriority, setFormPriority] = useState('medium');

  // Sync view with data
  if (hasActive && view === 'empty') setView('active');
  if (!hasActive && view === 'active') setView('empty');

  // ── Empty State ──────────────────────────────────────
  if (view === 'empty') {
    return (
      <div class="screen is-active">
        <div><div class="view-title">Work</div></div>
        <div style="display:flex; flex-direction:column; align-items:center; padding:40px 20px; gap:12px;">
          <div style="width:56px; height:56px; display:flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--vscode-progressBar-background) 10%, transparent); border-radius:8px; margin-bottom:4px;">
            <span class="codicon codicon-tools" style="font-size:28px; color:var(--vscode-progressBar-background);" />
          </div>
          <div style="font-size:15px; font-weight:600;">No Active Work</div>
          <div class="text-secondary text-sm" style="text-align:center; max-width:360px; line-height:1.5;">
            Start a new work item to begin development. Describe what you want to build and the agent will create a brief and implementation plan.
          </div>
          <Button
            variant="primary"
            icon="codicon-add"
            style="margin-top:8px; height:32px; padding:0 20px;"
            onClick={() => setView('create')}
          >
            Start New Work
          </Button>

          {/* Recently completed */}
          {workIndex && workIndex.recent.length > 0 && (
            <div style="margin-top:24px; width:100%; max-width:400px;">
              <div class="text-xs text-secondary" style="font-weight:600; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px;">
                Recently Completed
              </div>
              {workIndex.recent.slice(0, 3).map(w => (
                <div key={w.id} class="list-item" style="margin-bottom:4px;">
                  <span class="status-dot success" />
                  <div class="list-info">
                    <div class="list-name">{w.title}</div>
                    <div class="list-desc">{w.type || 'feature'}{w.completedAt ? ` · ${formatRelativeTime(w.completedAt)}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Create Form ──────────────────────────────────────
  if (view === 'create') {
    const handleCreate = () => {
      if (!formDesc.trim()) return;
      openInChat(
        `Create a new SDLC ${formType} work item with ${formPriority} priority: ${formDesc.trim()}\n\n` +
        `Generate a brief with What, Why, and Acceptance Criteria, then create an implementation plan with task breakdown.`
      );
      setFormDesc('');
      setView('empty');
    };

    return (
      <div class="screen is-active">
        <div>
          <div class="view-title">Start New Work</div>
          <div class="view-subtitle">Describe what you want to work on — the agent will generate a brief and plan</div>
        </div>

        <div class="flex flex-col gap-lg">
          {/* Description */}
          <div class="form-group">
            <label class="form-label">What do you want to work on?</label>
            <textarea
              class="form-textarea"
              rows={3}
              placeholder="e.g., Add dark mode toggle to the navigation bar with system preference detection and localStorage persistence"
              value={formDesc}
              onInput={(e) => setFormDesc((e.target as HTMLTextAreaElement).value)}
            />
            <div class="form-hint">Be specific — the agent uses this to generate requirements, acceptance criteria, and an implementation plan.</div>
          </div>

          {/* Type + Priority */}
          <div class="flex gap-md">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Type</label>
              <select class="form-select" value={formType} onChange={(e) => setFormType((e.target as HTMLSelectElement).value)}>
                <option value="feature">✨ Feature</option>
                <option value="bug">🐛 Bug Fix</option>
                <option value="refactor">🔧 Refactor</option>
                <option value="performance">⚡ Performance</option>
                <option value="security">🔒 Security</option>
                <option value="docs">📝 Documentation</option>
                <option value="tech-debt">🧹 Tech Debt</option>
                <option value="infrastructure">🏗️ Infrastructure</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Priority</label>
              <select class="form-select" value={formPriority} onChange={(e) => setFormPriority((e.target as HTMLSelectElement).value)}>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          {/* What the agent will do */}
          <div class="list-item" style="flex-direction:column; align-items:flex-start; gap:6px; background:color-mix(in srgb, var(--vscode-progressBar-background) 5%, var(--vscode-editor-background)); border-color:color-mix(in srgb, var(--vscode-progressBar-background) 20%, var(--vscode-panel-border));">
            <div class="flex gap-sm" style="align-items:center; font-size:13px; font-weight:600;">
              <span class="codicon codicon-sparkle" style="color:var(--vscode-progressBar-background);" /> The agent will:
            </div>
            <div class="text-sm text-secondary" style="line-height:1.6;">
              1. Generate a <strong>brief</strong> with What, Why, and Acceptance Criteria<br />
              2. Create an <strong>implementation plan</strong> with task breakdown<br />
              3. Wait for your <strong>review and approval</strong> before starting
            </div>
          </div>

          {/* Actions */}
          <div class="flex gap-sm">
            <Button
              variant="primary"
              icon="codicon-rocket"
              style="height:32px; padding:0 20px;"
              onClick={handleCreate}
              disabled={!formDesc.trim()}
            >
              Create & Open in Chat
            </Button>
            <Button
              style="height:32px;"
              onClick={() => { setFormDesc(''); setView('empty'); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const w = workIndex.active[0];
  const detail = activeWorkDetails[w.id];
  const progress = detail
    ? (detail.totalTasks > 0 ? Math.round((detail.completedTasks / detail.totalTasks) * 100) : 0)
    : 0;
  const nextTask = detail?.tasks?.find(t => !t.completed);
  const remainingTasks = detail ? detail.totalTasks - detail.completedTasks : 0;

  return (
    <div class="screen is-active">

      {/* Work Item Header */}
      <div class="list-item" style="flex-direction:column; align-items:stretch; gap:8px; border-color:color-mix(in srgb, var(--vscode-progressBar-background) 20%, var(--vscode-panel-border));">
        <div class="flex gap-sm" style="align-items:center;">
          <span class="badge badge-accent">{w.type || 'feature'}</span>
          <span class="badge badge-info">{w.priority || 'medium'}</span>
          {w.modules?.map(m => <span key={m} class="chip" style="font-size:10px; padding:1px 6px;">{m}</span>)}
          <span class="badge badge-success" style="margin-left:auto;">Active</span>
        </div>
        <div style="font-size:16px; font-weight:600;">{w.title}</div>
        <div class="flex gap-md" style="align-items:center;">
          <div class="progress-bar" style="height:4px;">
            <div class="progress-fill" style={`width:${progress}%`} />
          </div>
          <span style="font-size:12px; font-weight:600;">{progress}%</span>
          <span class="text-xs text-secondary">{detail?.completedTasks ?? 0} / {detail?.totalTasks ?? 0} tasks</span>
        </div>
        <div class="flex gap-sm">
          <Button
            variant="primary"
            size="sm"
            icon="codicon-comment-discussion"
            prompt={`Continue working on SDLC work item ${w.id}: ${w.title}. Show me the current progress and next steps.`}
          >
            Continue in Chat
          </Button>
          <Button
            size="sm"
            icon="codicon-go-to-file"
            onClick={() => openFile(`work/active/${w.id}/brief.md`)}
          >
            Open Brief
          </Button>
          <Button
            size="sm"
            icon="codicon-go-to-file"
            onClick={() => openFile(`work/active/${w.id}/plan.md`)}
          >
            Open Plan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div class="work-tabs">
        <button class={`work-tab ${tab === 'brief' ? 'is-active' : ''}`} onClick={() => setTab('brief')}>
          <span class="codicon codicon-file-text" style="font-size:14px;" /> Brief
        </button>
        <button class={`work-tab ${tab === 'plan' ? 'is-active' : ''}`} onClick={() => setTab('plan')}>
          <span class="codicon codicon-checklist" style="font-size:14px;" /> Plan
        </button>
        <button class={`work-tab ${tab === 'review' ? 'is-active' : ''}`} onClick={() => setTab('review')}>
          <span class="codicon codicon-shield" style="font-size:14px;" /> Review
        </button>
      </div>

      {/* TAB: Brief */}
      {tab === 'brief' && (
        <div class="flex flex-col gap-lg">
          {detail?.briefBody ? (
            <div class="brief-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(detail.briefBody) }} />
          ) : (
            <div class="text-secondary text-sm">No brief content yet. Open the brief file to edit.</div>
          )}
        </div>
      )}

      {/* TAB: Plan */}
      {tab === 'plan' && (
        <div class="flex flex-col gap-md">
          {detail?.tasks && detail.tasks.length > 0 ? (
            <>
              {detail.tasks.map((task) => {
                const isCurrent = !task.completed && !detail.tasks.slice(0, task.number - 1).some(t => !t.completed);
                return (
                  <div key={task.number} class={`task-item ${task.completed ? 'is-complete' : isCurrent ? 'is-current' : 'is-pending'}`}>
                    <div class="task-indicator">
                      {task.completed ? (
                        <span class="codicon codicon-pass-filled" style="font-size:16px; color:var(--vscode-testing-iconPassed);" />
                      ) : isCurrent ? (
                        <span class="codicon codicon-play-circle" style="font-size:16px; color:var(--vscode-progressBar-background);" />
                      ) : (
                        <span class="codicon codicon-circle-large-outline" style="font-size:16px; color:var(--vscode-descriptionForeground);" />
                      )}
                    </div>
                    <div class="task-content">
                      <div class="flex gap-sm" style="align-items:center;">
                        <span style={`font-size:13px; font-weight:500; ${task.completed ? 'text-decoration:line-through; opacity:0.6;' : ''} ${!task.completed && !isCurrent ? 'color:var(--vscode-descriptionForeground);' : ''}`}>
                          {task.text}
                        </span>
                        {isCurrent && <span class="badge badge-accent">Current</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div class="flex gap-sm mt-md">
                <Button
                  variant="primary"
                  icon="codicon-comment-discussion"
                  prompt={`Continue implementing the current task for ${w.id}: ${nextTask?.text || 'next task'}. Follow the plan and update checkboxes as you complete sub-tasks.`}
                >
                  Continue Current Task
                </Button>
              </div>
            </>
          ) : (
            <div class="text-secondary text-sm">No plan tasks found. Open plan.md to add tasks.</div>
          )}
        </div>
      )}

      {/* TAB: Review */}
      {tab === 'review' && (
        <div class="flex flex-col gap-lg">
          <div class="list-item" style="gap:12px;">
            <span class="codicon codicon-info" style={`font-size:20px; color:${remainingTasks > 0 ? 'var(--vscode-editorWarning-foreground)' : 'var(--vscode-testing-iconPassed)'};`} />
            <div>
              <div style="font-size:13px; font-weight:600;">
                {remainingTasks > 0 ? 'Awaiting Completion' : 'Ready for Review'}
              </div>
              <div class="text-secondary text-sm">
                {remainingTasks > 0
                  ? `Complete all tasks before requesting review. ${remainingTasks} task${remainingTasks > 1 ? 's' : ''} remaining.`
                  : 'All tasks completed. Verify acceptance criteria and approve.'}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Review Actions</div>
            <div class="flex gap-sm flex-wrap">
              <Button
                variant="primary"
                icon="codicon-shield"
                prompt={`Verify the acceptance criteria for SDLC work item ${w.id}: ${w.title}. Check each criterion and report pass/fail.`}
              >
                Verify in Chat
              </Button>
              <Button
                icon="codicon-check"
                command="sdlc-workflow.done"
                disabled={remainingTasks > 0}
              >
                Complete Work Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Simple markdown to HTML converter for brief content */
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- \[x\] (.+)$/gm, '<li style="list-style:none;">✅ $1</li>')
    .replace(/^- \[ \] (.+)$/gm, '<li style="list-style:none;">☐ $1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hluop])/gm, '')
    .replace(/^\s*$/gm, '');
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
