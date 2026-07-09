import { EmptyState } from '../components/EmptyState';

export function Settings() {
  return (
    <div class="screen is-active">
      <div>
        <div class="view-title">Settings</div>
        <div class="view-subtitle">Project configuration and preferences</div>
      </div>
      <EmptyState
        icon="codicon-settings-gear"
        title="Coming Soon"
        subtitle="Project settings will be available here"
      />
    </div>
  );
}
