import type { ComponentChildren } from 'preact';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  subtitle?: string;
  small?: boolean;
  children?: ComponentChildren;
}

export function EmptyState({ icon, title, description, subtitle, small, children }: EmptyStateProps) {
  const desc = description || subtitle;
  return (
    <div class="empty-state" style={small ? 'min-height:120px; padding:20px 16px;' : undefined}>
      <span class={`codicon ${icon}`} style={small ? 'font-size:28px; margin-bottom:8px;' : undefined} />
      <div style={`font-size:${small ? '13' : '14'}px;font-weight:600;`}>{title}</div>
      {desc && <div class="text-secondary mt-sm">{desc}</div>}
      {children && <div class="mt-md">{children}</div>}
    </div>
  );
}
