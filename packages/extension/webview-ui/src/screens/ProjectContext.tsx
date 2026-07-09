import { Button } from '../components/Button';
import { openInChat, openFile } from '../vscode';
import type { ProjectStatus, ContextDocData } from '../types';

interface ProjectContextProps {
  status: ProjectStatus | null;
  contextDocs: Record<string, ContextDocData>;
}

// Context document definitions
const DOC_DEFS = [
  { name: 'architecture', label: 'Architecture', icon: 'codicon-symbol-structure', desc: 'System design, modules, data flow' },
  { name: 'conventions', label: 'Conventions', icon: 'codicon-symbol-ruler', desc: 'Coding standards, naming, testing patterns' },
  { name: 'requirements', label: 'Requirements', icon: 'codicon-checklist', desc: 'Project requirements and user stories' },
  { name: 'stack', label: 'Stack', icon: 'codicon-layers', desc: 'Technology choices with rationale' },
];

export function ProjectContext({ status, contextDocs }: ProjectContextProps) {
  const s = status;

  // Stack chips
  const stackEntries = s?.stack
    ? Object.entries(s.stack as Record<string, string>).filter(([, v]) => v)
    : [];

  // Modules
  const modules = (s?.modules ?? []) as Array<{ path?: string; type?: string; stack?: Record<string, string> }>;

  // Completeness
  const configuredCount = DOC_DEFS.filter(d => contextDocs[d.name]?.hasContent).length;
  const completePct = Math.round((configuredCount / DOC_DEFS.length) * 100);

  return (
    <div class="screen is-active">
      {/* Header */}
      <div>
        <div class="view-title">Project Context</div>
        <div class="view-subtitle">
          {s ? `${s.projectName} · ${s.projectMode}` : 'Not configured'}
        </div>
      </div>

      {/* Tech Stack */}
      <div class="section">
        <div class="section-title">Tech Stack</div>
        {stackEntries.length > 0 ? (
          <div class="flex gap-sm flex-wrap">
            {stackEntries.map(([, v]) => (
              <span key={v} class="chip">{v}</span>
            ))}
            {s?.projectMode && <span class="chip chip-dim">{s.projectMode}</span>}
          </div>
        ) : (
          <div class="text-secondary text-sm">No stack detected — update context in chat to detect</div>
        )}
      </div>

      {/* Context Documents */}
      <div class="section">
        <div class="section-header">
          <span class="section-title">Context Documents</span>
          <span class="text-secondary text-sm">{configuredCount} of {DOC_DEFS.length} configured</span>
        </div>
        <div class="flex flex-col gap-sm">
          {DOC_DEFS.map(def => {
            const doc = contextDocs[def.name];
            const hasContent = doc?.hasContent ?? false;
            const version = doc?.frontMatter?.version;
            const updatedAt = doc?.frontMatter?.updatedAt as string | undefined;

            return (
              <div key={def.name} class="list-item" style={!hasContent ? 'opacity:0.6;' : undefined}>
                <span class={`codicon ${hasContent ? 'codicon-pass-filled' : 'codicon-circle-large-outline'}`}
                  style={`font-size:16px; color:${hasContent ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-descriptionForeground)'};`}
                />
                <div class="list-info">
                  <div class="list-name" style={!hasContent ? 'color:var(--vscode-descriptionForeground);' : undefined}>
                    {def.label}
                  </div>
                  <div class="list-desc">
                    {hasContent
                      ? doc.body.split('\n').find(l => l.trim() && !l.startsWith('#'))?.trim().slice(0, 80) || def.desc
                      : def.desc
                    }
                  </div>
                </div>
                {hasContent && version && (
                  <span class="text-xs text-secondary" style="white-space:nowrap;">
                    v{version}{updatedAt ? ` · ${updatedAt}` : ''}
                  </span>
                )}
                {hasContent ? (
                  <button
                    class="btn btn-sm btn-secondary"
                    onClick={() => openFile(`context/${def.name}.md`)}
                  >
                    <span class="codicon codicon-go-to-file" style="font-size:12px;" /> Open
                  </button>
                ) : (
                  <button
                    class="btn btn-sm btn-secondary"
                    onClick={() => openInChat(`Create and fill in .sdlc/context/${def.name}.md with appropriate content for this project.`)}
                  >
                    Create
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modules */}
      <div class="section">
        <div class="section-header">
          <span class="section-title">Modules</span>
          <span class="text-secondary text-sm">{modules.length} detected</span>
        </div>
        {modules.length > 0 ? (
          <div class="flex flex-col gap-sm">
            {modules.map((mod, i) => (
              <div key={i} class="list-item">
                <span class="codicon codicon-package" style="font-size:14px; color:var(--vscode-descriptionForeground);" />
                <div class="list-info">
                  <div class="list-name" style="font-family:var(--vscode-editor-font-family);">
                    {mod.path || `module-${i}`}
                  </div>
                  <div class="list-desc">
                    {mod.type || 'unknown'}
                    {mod.stack ? ` · ${Object.values(mod.stack).filter(Boolean).join(', ')}` : ''}
                  </div>
                </div>
                <span class={`badge badge-${mod.type === 'frontend' ? 'accent' : mod.type === 'backend' ? 'success' : 'info'}`}>
                  {mod.type || 'other'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div class="text-secondary text-sm">No modules detected — single project</div>
        )}
      </div>

      {/* Context Completeness */}
      <div class="section">
        <div class="section-title">Context Completeness</div>
        <div class="list-item" style="flex-direction:column; align-items:stretch; gap:8px;">
          <div class="flex gap-md" style="align-items:center;">
            <div class="progress-bar" style="height:6px;">
              <div class={`progress-fill ${completePct === 100 ? 'is-success' : ''}`} style={`width:${completePct}%`} />
            </div>
            <span style="font-size:14px; font-weight:600; min-width:36px; text-align:right;">
              {completePct}%
            </span>
          </div>
          <div class="flex gap-lg flex-wrap">
            {DOC_DEFS.map(def => {
              const done = contextDocs[def.name]?.hasContent ?? false;
              return (
                <span key={def.name} class="flex gap-xs text-sm" style="align-items:center;">
                  <span
                    class={`codicon ${done ? 'codicon-pass-filled' : 'codicon-circle-large-outline'}`}
                    style={`font-size:12px; color:${done ? 'var(--vscode-testing-iconPassed)' : 'var(--vscode-descriptionForeground)'};`}
                  />
                  {def.label}
                  {!done && <span class="text-secondary">(missing)</span>}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
