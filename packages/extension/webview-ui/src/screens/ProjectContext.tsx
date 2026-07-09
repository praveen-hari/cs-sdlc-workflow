import { Button } from '../components/Button';
import type { ProjectStatus } from '../types';

interface ProjectContextProps {
  status: ProjectStatus | null;
}

export function ProjectContext({ status }: ProjectContextProps) {
  const s = status;

  return (
    <div class="screen is-active">
      <div>
        <div class="view-title">Project Context</div>
        <div class="view-subtitle">{s ? `${s.projectName} · ${s.projectMode}` : 'Not configured'}</div>
      </div>

      {/* Tech Stack */}
      <div class="section">
        <div class="section-title">Tech Stack</div>
        <div class="flex gap-sm flex-wrap">
          {s?.stack ? (
            Object.values(s.stack)
              .filter(Boolean)
              .map((v, i) => (
                <span
                  key={i}
                  style="display:inline-flex;padding:3px 10px;font-size:12px;border-radius:12px;background:var(--vscode-textCodeBlock-background);border:1px solid var(--vscode-panel-border);color:var(--vscode-foreground);"
                >
                  {v}
                </span>
              ))
          ) : (
            <span class="text-secondary">Not detected</span>
          )}
        </div>
      </div>

      {/* Modules */}
      <div class="section">
        <div class="section-title">Modules</div>
        <div class="text-secondary text-sm">{s?.modules?.length || 0} modules detected</div>
      </div>

      <Button
        icon="codicon-comment-discussion"
        prompt="Show me the full SDLC project context — tech stack, modules, architecture, and conventions."
      >
        View Full Context in Chat
      </Button>
    </div>
  );
}
