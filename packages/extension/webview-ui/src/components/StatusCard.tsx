interface StatusCardProps {
  title: string;
  icon: string;
  badge: string;
  badgeType?: 'success' | 'accent' | 'info';
  details: Array<{ icon: string; text: string }>;
  onClick?: () => void;
  ready?: boolean;
}

export function StatusCard({ title, icon, badge, badgeType = 'success', details, onClick, ready }: StatusCardProps) {
  return (
    <div
      class={`status-card ${ready ? 'is-ready' : ''}`}
      style={onClick ? 'cursor:pointer' : 'cursor:default'}
      onClick={onClick}
    >
      <div class="status-card-top">
        <div
          class="status-card-icon"
          style={`background:color-mix(in srgb, var(--vscode-testing-iconPassed) 12%, transparent); color:var(--vscode-testing-iconPassed);`}
        >
          <span class={`codicon ${icon}`} />
        </div>
        <span class={`badge badge-${badgeType}`}>{badge}</span>
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
    </div>
  );
}
