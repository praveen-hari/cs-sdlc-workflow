import type { ComponentChildren } from 'preact';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  children?: ComponentChildren;
}

export function EmptyState({ icon, title, subtitle, children }: EmptyStateProps) {
  return (
    <div class="empty-state">
      <span class={`codicon ${icon}`} />
      <div style="font-size:14px;font-weight:600;">{title}</div>
      {subtitle && <div class="text-secondary mt-sm">{subtitle}</div>}
      {children}
    </div>
  );
}
