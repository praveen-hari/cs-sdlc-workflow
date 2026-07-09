import { EmptyState } from '../components/EmptyState';

export function Plugins() {
  return (
    <div class="screen is-active">
      <div>
        <div class="view-title">Plugins</div>
        <div class="view-subtitle">Equip your agent with the right tools for your project</div>
      </div>
      <EmptyState
        icon="codicon-extensions"
        title="Plugin Marketplace"
        subtitle="Browse and install agent plugins — coming soon"
      />
    </div>
  );
}
