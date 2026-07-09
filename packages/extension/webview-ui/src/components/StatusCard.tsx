interface StatusCardProps {
  title: string;
  icon: string;
  badge: string;
  badgeVariant?: 'success' | 'accent' | 'info';
  details: Array<{ icon: string; text: string }>;
  progress?: number;
  onClick?: () => void;
  ready?: boolean;
}

export function StatusCard({ title, icon, badge, badgeVariant = 'success', details, progress, onClick, ready }: StatusCardProps) {
  const iconColor = ready
    ? 'var(--vscode-testing-iconPassed)'
    : 'var(--vscode-descriptionForeground)';

  return (
    <div
      class={`status-card ${ready ? 'is-ready' : ''}`}
      style={onClick ? 'cursor:pointer' : 'cursor:default'}
      onClick={onClick}
    >
      <div class="status-card-top">
        <div
          class="status-card-icon"
          style={`background:color-mix(in srgb, ${iconColor} 12%, transparent); color:${iconColor};`}
        >
          <span class={`codicon ${icon}`} />
        </div>
        <span class={`badge badge-${badgeVariant}`}>{badge}</span>
      </div>
      <div class="status-card-title">{title}</div>
      <div class="status-card-details">
        {details.map((d, i) => (
          <span key={i}>
            <span class={`codicon ${d.icon}`} />
            {d.text}
          </span>
        ))}
      </div>
      {progress !== undefined && progress > 0 && (
        <div class="status-card-bar">
          <div class="progress-bar">
            <div class={`progress-fill ${ready ? 'is-success' : ''}`} style={`width:${progress}%`} />
          </div>
          <span class="text-xs text-secondary">{progress}%</span>
        </div>
      )}
    </div>
  );
}
