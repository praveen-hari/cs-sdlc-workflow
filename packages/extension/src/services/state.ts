import * as vscode from 'vscode';

/**
 * Manages extension-level state (persisted across sessions via workspaceState).
 */
export class ExtensionState {
  constructor(private readonly _context: vscode.ExtensionContext) {}

  // ── Active screen ────────────────────────────────────────────────────

  get activeScreen(): string {
    return this._context.workspaceState.get<string>('activeScreen', 'overview');
  }

  async setActiveScreen(screen: string): Promise<void> {
    await this._context.workspaceState.update('activeScreen', screen);
  }

  // ── Onboarding ───────────────────────────────────────────────────────

  get hasCompletedOnboarding(): boolean {
    return this._context.workspaceState.get<boolean>('onboardingComplete', false);
  }

  async setOnboardingComplete(): Promise<void> {
    await this._context.workspaceState.update('onboardingComplete', true);
  }

  // ── Last active work item ────────────────────────────────────────────

  get lastActiveWorkItemId(): string | undefined {
    return this._context.workspaceState.get<string>('lastActiveWorkItemId');
  }

  async setLastActiveWorkItemId(id: string | undefined): Promise<void> {
    await this._context.workspaceState.update('lastActiveWorkItemId', id);
  }
}
