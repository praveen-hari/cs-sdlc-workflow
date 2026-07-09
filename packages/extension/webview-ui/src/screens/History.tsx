import { EmptyState } from '../components/EmptyState';
import type { WorkIndexData, DecisionsIndexData, ReleasesIndexData } from '../types';

interface HistoryProps {
  workIndex: WorkIndexData | null;
  decisionsIndex: DecisionsIndexData | null;
  releasesIndex: ReleasesIndexData | null;
}

export function History({ workIndex, decisionsIndex, releasesIndex }: HistoryProps) {
  const hasContent =
    (workIndex?.recent?.length ?? 0) > 0 ||
    (decisionsIndex?.entries?.length ?? 0) > 0 ||
    (releasesIndex?.entries?.length ?? 0) > 0;

  return (
    <div class="screen is-active">
      <div>
        <div class="view-title">History</div>
        <div class="view-subtitle">Completed work and decisions</div>
      </div>

      {!hasContent ? (
        <EmptyState
          icon="codicon-history"
          title="No History Yet"
          subtitle="Completed work items and decisions will appear here"
        />
      ) : (
        <>
          {/* Completed Work */}
          {workIndex && workIndex.recent.length > 0 && (
            <div class="section">
              <div class="section-title">Completed Work</div>
              {workIndex.recent.map((w) => (
                <div key={w.id} class="list-item">
                  <span class="status-dot success" />
                  <div class="list-info">
                    <div class="list-name">{w.id}: {w.title}</div>
                    <div class="list-desc">
                      {w.type || ''}{w.completedAt ? ` · ${new Date(w.completedAt).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Decisions */}
          {decisionsIndex && decisionsIndex.entries.length > 0 && (
            <div class="section">
              <div class="section-title">Decisions</div>
              {decisionsIndex.entries.map((d) => (
                <div key={d.id} class="list-item">
                  <span style="font-size:10px;font-weight:700;color:var(--vscode-descriptionForeground);min-width:28px;">
                    {d.id}
                  </span>
                  <div class="list-info">
                    <div class="list-name">{d.title}</div>
                    <div class="list-desc">{d.status || 'accepted'} · {d.date || ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Releases */}
          {releasesIndex && releasesIndex.entries.length > 0 && (
            <div class="section">
              <div class="section-title">Releases</div>
              {releasesIndex.entries.map((r) => (
                <div key={r.version} class="list-item">
                  <span class="codicon codicon-tag" style="color:var(--vscode-progressBar-background);" />
                  <div class="list-info">
                    <div class="list-name">v{r.version}{r.title ? ` — ${r.title}` : ''}</div>
                    <div class="list-desc">{r.date || ''}</div>
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
