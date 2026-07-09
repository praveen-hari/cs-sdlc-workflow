import { openFile } from '../vscode';
import type { WorkIndexData, DecisionsIndexData, ReleasesIndexData } from '../types';

interface HistoryProps {
  workIndex: WorkIndexData | null;
  decisionsIndex: DecisionsIndexData | null;
  releasesIndex: ReleasesIndexData | null;
}

const TYPE_BADGE: Record<string, { variant: string; label: string }> = {
  feature: { variant: 'accent', label: 'Feature' },
  bug: { variant: 'error', label: 'Bug' },
  refactor: { variant: 'info', label: 'Refactor' },
  performance: { variant: 'info', label: 'Perf' },
  security: { variant: 'info', label: 'Security' },
  docs: { variant: 'info', label: 'Docs' },
};

export function History({ workIndex, decisionsIndex, releasesIndex }: HistoryProps) {
  const recentCount = workIndex?.recent?.length ?? 0;
  const decisionCount = decisionsIndex?.entries?.length ?? 0;
  const releaseCount = releasesIndex?.entries?.length ?? 0;
  const hasContent = recentCount > 0 || decisionCount > 0 || releaseCount > 0;

  // Subtitle
  const subtitleParts: string[] = [];
  if (recentCount > 0) subtitleParts.push(`${recentCount} completed`);
  if (decisionCount > 0) subtitleParts.push(`${decisionCount} decision${decisionCount > 1 ? 's' : ''}`);
  if (releaseCount > 0) subtitleParts.push(`${releaseCount} release${releaseCount > 1 ? 's' : ''}`);

  return (
    <div class="screen is-active">
      <div>
        <div class="view-title">History</div>
        <div class="view-subtitle">{subtitleParts.length > 0 ? subtitleParts.join(' · ') : 'No history yet'}</div>
      </div>

      {!hasContent ? (
        <div class="list-item" style="justify-content:center; padding:40px; flex-direction:column; align-items:center; gap:8px;">
          <span class="codicon codicon-history" style="font-size:32px; color:var(--vscode-descriptionForeground);" />
          <div style="font-size:14px; font-weight:600;">No History Yet</div>
          <div class="text-secondary text-sm">Completed work items, decisions, and releases will appear here</div>
        </div>
      ) : (
        <>
          {/* Completed Work */}
          {recentCount > 0 && (
            <div class="section">
              <div class="section-header">
                <span class="section-title">Completed Work</span>
                <span class="text-secondary text-sm">{recentCount} items</span>
              </div>
              {workIndex!.recent.map((w) => {
                const typeBadge = TYPE_BADGE[w.type || 'feature'] || TYPE_BADGE.feature;
                return (
                  <div key={w.id} class="list-item">
                    <span class="codicon codicon-pass-filled" style="font-size:16px; color:var(--vscode-testing-iconPassed);" />
                    <div class="list-info">
                      <div class="flex gap-sm" style="align-items:center;">
                        <span class="list-name">{w.title}</span>
                        <span class={`badge badge-${typeBadge.variant}`}>{typeBadge.label}</span>
                      </div>
                      <div class="list-desc">
                        {w.completedAt ? formatRelativeTime(w.completedAt) : 'Completed'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Releases */}
          {releaseCount > 0 && (
            <div class="section">
              <div class="section-header">
                <span class="section-title">Releases</span>
                <span class="text-secondary text-sm">{releaseCount} releases</span>
              </div>
              {releasesIndex!.entries.map((r) => (
                <div key={r.version} class="list-item" style="cursor:pointer;" onClick={() => openFile(`releases/v${r.version}.md`)}>
                  <span class="codicon codicon-tag" style="font-size:16px; color:var(--vscode-progressBar-background);" />
                  <div class="list-info">
                    <div class="list-name">v{r.version}{r.title ? ` — ${r.title}` : ''}</div>
                    <div class="list-desc">{r.date || ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Decisions */}
          {decisionCount > 0 && (
            <div class="section">
              <div class="section-header">
                <span class="section-title">Decisions</span>
                <span class="text-secondary text-sm">{decisionCount} records</span>
              </div>
              {decisionsIndex!.entries.map((d) => (
                <div key={d.id} class="list-item" style="cursor:pointer;" onClick={() => openFile(d.path || `decisions/${d.id}.md`)}>
                  <span style="font-size:10px; font-weight:700; color:var(--vscode-descriptionForeground); min-width:28px; text-align:center;">
                    {d.id}
                  </span>
                  <div class="list-info">
                    <div class="list-name">{d.title}</div>
                    <div class="list-desc">
                      <span class="badge badge-success" style="margin-right:4px;">{d.status || 'accepted'}</span>
                      {d.date || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
