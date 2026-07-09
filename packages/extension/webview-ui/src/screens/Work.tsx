import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import type { ProjectStatus, WorkIndexData } from '../types';

interface WorkProps {
  status: ProjectStatus | null;
  workIndex: WorkIndexData | null;
}

export function Work({ workIndex }: WorkProps) {
  if (!workIndex || workIndex.active.length === 0) {
    return (
      <div class="screen is-active">
        <div><div class="view-title">Work</div></div>
        <EmptyState
          icon="codicon-tools"
          title="No Active Work"
          subtitle="Start a new work item to begin development"
        >
          <Button variant="primary" class="mt-lg" icon="codicon-add" command="sdlc-workflow.start">
            Start New Work
          </Button>
        </EmptyState>
      </div>
    );
  }

  const w = workIndex.active[0];

  return (
    <div class="screen is-active">
      <div><div class="view-title">Work</div></div>

      <div class="list-item" style="flex-direction:column;align-items:stretch;gap:8px;">
        <div class="flex gap-sm" style="align-items:center;">
          <span class="badge badge-accent">{w.type || 'feature'}</span>
          <span class="badge badge-info">{w.priority || 'medium'}</span>
          <span class="badge badge-success" style="margin-left:auto;">Active</span>
        </div>
        <div class="view-title" style="font-size:16px;">{w.id}: {w.title}</div>
        <div class="flex gap-md" style="align-items:center;">
          <div class="progress-bar" style="max-width:200px;">
            <div class="progress-fill" style={`width:${w.progress || 0}%`} />
          </div>
          <span class="text-xs text-secondary">{w.completedTasks || 0}/{w.totalTasks || 0} tasks</span>
        </div>
        <div class="flex gap-sm mt-sm">
          <Button
            variant="primary"
            icon="codicon-comment-discussion"
            prompt={`Continue working on ${w.id}: ${w.title}. Show progress and next steps.`}
          >
            Continue in Chat
          </Button>
          <Button icon="codicon-check" command="sdlc-workflow.done">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
