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
  const [tab, setTab] = useState<'spec' | 'plan' | 'todo' | 'review'>('todo');

  // Determine which tabs to show based on work type + content
  const workType = (workIndex?.active[0]?.type) || 'feature';
  const isFeature = workType === 'feature';
  const hasSpecContent = !!(activeWorkDetails[workIndex?.active[0]?.id ?? '']?.specBody);
  const hasPlanContent = !!(activeWorkDetails[workIndex?.active[0]?.id ?? '']?.planBody);
  const activeDetail = activeWorkDetails[workIndex?.active[0]?.id ?? ''];
  const showSpecTab = isFeature || hasSpecContent;
  const showPlanTab = isFeature || hasPlanContent;
  const showReviewTab = (activeDetail?.tasks?.length ?? 0) > 0;

  // Reset tab if current tab is hidden
  if (tab === 'spec' && !showSpecTab) setTab('todo');
  if (tab === 'plan' && !showPlanTab) setTab('todo');
  if (tab === 'review' && !showReviewTab) setTab('todo');

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
        `Generate a spec with What, Why, and Acceptance Criteria, then create a todo with task breakdown.`
      );
      setFormDesc('');
      setView('empty');
    };

    return (
      <div class="screen is-active">
        <div>
          <div class="view-title">Start New Work</div>
          <div class="view-subtitle">Describe what you want to work on — the agent will generate a spec and todo</div>
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
              1. Generate a <strong>spec</strong> with What, Why, and Acceptance Criteria<br />
              2. Create a <strong>todo</strong> with task breakdown<br />
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

  if (!workIndex) return null;
  const w = workIndex.active[0];
  const detail = activeWorkDetails[w.id];

  // Count from actual parsed tasks (not front matter which may be stale)
  const tasks = detail?.tasks ?? [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const remainingTasks = totalTasks - completedTasks;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const nextTask = tasks.find(t => !t.completed);

  // Type-aware phases — not every type needs the full lifecycle
  const isFullLifecycle = workType === 'feature';

  const phases = isFullLifecycle
    ? (['SPEC', 'PLAN', 'BUILD', 'REVIEW'] as const)
    : (['BUILD', 'REVIEW'] as const);

  // Determine current phase
  const phase = (() => {
    if (isFullLifecycle) {
      if (!detail?.hasPlan) return 'SPEC';
      if (totalTasks === 0) return 'PLAN';
      if (remainingTasks > 0) return 'BUILD';
      if (progress === 100) return 'REVIEW';
      return 'BUILD';
    }
    // Lightweight types: just BUILD → REVIEW
    if (remainingTasks > 0 || totalTasks === 0) return 'BUILD';
    return 'REVIEW';
  })();

  const phaseIcons: Record<string, string> = {
    SPEC: 'codicon-note', PLAN: 'codicon-list-tree', BUILD: 'codicon-tools',
    REVIEW: 'codicon-shield',
  };

  return (
    <div class="screen is-active">

      {/* Phase Indicator */}
      <div class="flex gap-xs" style="align-items:center; padding:4px 0 8px;">
        {phases.map((p, i) => {
          const isCurrent = p === phase;
          const isPast = phases.indexOf(phase) > i;
          const color = isCurrent
            ? 'var(--vscode-progressBar-background)'
            : isPast
              ? 'var(--vscode-testing-iconPassed)'
              : 'var(--vscode-descriptionForeground)';
          return (
            <div key={p} class="flex gap-xs" style="align-items:center;">
              {i > 0 && <span style={`width:16px; height:1px; background:${isPast ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-panel-border)'};`} />}
              <div class="flex gap-xs" style={`align-items:center; font-size:11px; font-weight:${isCurrent ? '700' : '500'}; color:${color}; ${isCurrent ? 'background:color-mix(in srgb, var(--vscode-progressBar-background) 12%, transparent); padding:2px 8px; border-radius:10px;' : ''}`}>
                <span class={`codicon ${phaseIcons[p]}`} style="font-size:12px;" />
                {p}
              </div>
            </div>
          );
        })}
      </div>

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
          <span class="text-xs text-secondary">{completedTasks} / {totalTasks} tasks</span>
        </div>
        <div class="flex gap-sm flex-wrap">
          <Button
            variant="primary"
            size="sm"
            icon="codicon-comment-discussion"
            prompt={`Continue working on SDLC work item ${w.id}: ${w.title}. Show me the current progress and next steps.`}
          >
            Continue in Chat
          </Button>
          {remainingTasks > 1 && (
            <Button
              size="sm"
              icon="codicon-run-all"
              prompt={`Implement ALL remaining tasks for ${w.id}: ${w.title} autonomously. I approve the plan — execute every remaining task using test-driven-development (RED→GREEN→REFACTOR), run tests after each, commit per task, and stop only if tests fail or you hit an ambiguous requirement. Summarize at the end.`}
            >
              Build All (auto)
            </Button>
          )}
          <Button
            size="sm"
            icon="codicon-go-to-file"
            onClick={() => openFile(`work/active/${w.id}/spec.md`)}
          >
            Open Spec
          </Button>
          <Button
            size="sm"
            icon="codicon-go-to-file"
            onClick={() => openFile(`work/active/${w.id}/todo.md`)}
          >
            Open Todo
          </Button>
          {remainingTasks === 0 && totalTasks > 0 && (
            <Button
              size="sm"
              icon="codicon-shield"
              prompt={`All tasks are complete for ${w.id}: ${w.title}. Verify acceptance criteria, do a 5-axis review (correctness, readability, architecture, security, performance), and report findings.`}
            >
              Review
            </Button>
          )}
          {remainingTasks === 0 && totalTasks > 0 && (
            <Button
              size="sm"
              icon="codicon-check"
              command="sdlc-workflow.done"
            >
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs — dynamic based on work type */}
      <div class="work-tabs">
        {showSpecTab && (
          <button class={`work-tab ${tab === 'spec' ? 'is-active' : ''}`} onClick={() => setTab('spec')}>
            <span class="codicon codicon-file-text" style="font-size:14px;" /> Spec
          </button>
        )}
        {showPlanTab && (
          <button class={`work-tab ${tab === 'plan' ? 'is-active' : ''}`} onClick={() => setTab('plan')}>
            <span class="codicon codicon-list-tree" style="font-size:14px;" /> Plan
          </button>
        )}
        <button class={`work-tab ${tab === 'todo' ? 'is-active' : ''}`} onClick={() => setTab('todo')}>
          <span class="codicon codicon-checklist" style="font-size:14px;" /> Todo
        </button>
        {showReviewTab && (
          <button class={`work-tab ${tab === 'review' ? 'is-active' : ''}`} onClick={() => setTab('review')}>
            <span class="codicon codicon-shield" style="font-size:14px;" /> Review
          </button>
        )}
      </div>

      {/* TAB: Spec */}
      {tab === 'spec' && (
        <div class="flex flex-col gap-lg">
          {detail?.specBody ? (
            <div class="spec-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(detail.specBody) }} />
          ) : (
            <div class="text-secondary text-sm">No spec content yet. Open the spec file to edit.</div>
          )}
        </div>
      )}

      {/* TAB: Plan */}
      {tab === 'plan' && (
        <div class="flex flex-col gap-lg">
          {detail?.planBody ? (
            <div class="spec-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(detail.planBody) }} />
          ) : (
            <div class="text-secondary text-sm">No plan content yet. Open the plan file to edit.</div>
          )}
          <Button
            size="sm"
            icon="codicon-go-to-file"
            onClick={() => openFile(`work/active/${w.id}/plan.md`)}
          >
            Open Plan
          </Button>
        </div>
      )}

      {/* TAB: Todo */}
      {tab === 'todo' && (
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
                          Task {task.number}: {task.text}
                        </span>
                        {isCurrent && <span class="badge badge-accent">Current</span>}
                        {task.completed && <span class="codicon codicon-check" style="font-size:11px; color:var(--vscode-testing-iconPassed);" />}
                      </div>
                      {/* Show "implement this task" link for current task */}
                      {isCurrent && (
                        <div class="mt-sm">
                          <button
                            class="btn btn-sm btn-primary"
                            style="height:20px; font-size:11px; padding:0 8px;"
                            onClick={() => openInChat(
                              `Implement Task ${task.number} for ${w.id}: ${task.text}. ` +
                              `Follow test-driven-development (write failing test first, then implement, then refactor). ` +
                              `Run tests and build after implementing. Mark done with #sdlcTodoToggle when complete.`
                            )}
                          >
                            <span class="codicon codicon-play" style="font-size:11px;" /> Implement This Task
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div class="flex gap-sm mt-md flex-wrap">
                {nextTask && (
                  <Button
                    variant="primary"
                    icon="codicon-comment-discussion"
                    prompt={`Continue implementing the current task for ${w.id}: Task ${nextTask.number}: ${nextTask.text}. Follow test-driven-development and run tests after implementing.`}
                  >
                    Continue Current Task
                  </Button>
                )}
                {remainingTasks > 1 && (
                  <Button
                    icon="codicon-run-all"
                    prompt={`Implement ALL remaining tasks for ${w.id}: ${w.title} autonomously. I approve the plan — execute every remaining task using test-driven-development (RED→GREEN→REFACTOR), run tests after each, commit per task, and stop only if tests fail or you hit an ambiguous requirement. Summarize at the end.`}
                  >
                    Build All (auto)
                  </Button>
                )}
                {!nextTask && (
                  <Button
                    variant="primary"
                    icon="codicon-shield"
                    prompt={`All tasks are complete for ${w.id}: ${w.title}. Run the review-work skill — verify acceptance criteria, do a 5-axis review (correctness, readability, architecture, security, performance), and report findings.`}
                  >
                    Start Review
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div class="text-secondary text-sm">No tasks found. Open todo.md to add tasks.</div>
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
                disabled={remainingTasks > 0}
              >
                Verify in Chat
              </Button>
              <Button
                icon="codicon-search"
                prompt={`Run a 5-axis code review for ${w.id}: ${w.title}. Review correctness, readability, architecture, security, and performance. Report findings.`}
                disabled={remainingTasks > 0}
              >
                5-Axis Review
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

/** Simple markdown to HTML converter for spec content */
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
