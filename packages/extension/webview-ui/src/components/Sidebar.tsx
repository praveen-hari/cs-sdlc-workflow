import type { WorkIndexData, ContextDocData } from '../types';

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  workIndex: WorkIndexData | null;
  contextDocs: Record<string, ContextDocData>;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  dot?: 'success' | 'active';
  badge?: number;
}

export function Sidebar({ activeScreen, onNavigate, workIndex, contextDocs }: SidebarProps) {
  // Context dot: green if at least 2 docs have content (architecture + conventions)
  const configuredDocs = ['architecture', 'conventions', 'requirements', 'stack']
    .filter(name => contextDocs[name]?.hasContent);
  const contextReady = configuredDocs.length >= 2;

  const items: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: 'codicon-home' },
    { id: 'context', label: 'Project Context', icon: 'codicon-file-text', dot: contextReady ? 'success' : undefined },
    { id: 'work', label: 'Work', icon: 'codicon-tools', dot: workIndex?.active.length ? 'active' : undefined },
    { id: 'history', label: 'History', icon: 'codicon-history', badge: workIndex?.recent.length || undefined },
  ];

  return (
    <nav class="sidebar">
      <div class="sidebar-items">
        {items.map((item) => (
          <button
            key={item.id}
            class={`nav-btn ${activeScreen === item.id ? 'is-active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span class={`codicon ${item.icon}`} />
            <span class="nav-btn-label">{item.label}</span>
            {item.dot && <span class={`nav-dot ${item.dot}`} />}
            {item.badge !== undefined && item.badge > 0 && (
              <span class="nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div class="sidebar-footer">
        <button
          class={`nav-btn ${activeScreen === 'settings' ? 'is-active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <span class="codicon codicon-settings-gear" />
          <span class="nav-btn-label">Settings</span>
        </button>
      </div>
    </nav>
  );
}
