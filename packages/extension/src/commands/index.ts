import * as vscode from 'vscode';
import type { SdlcService } from '../services/sdlc-service.js';
import type { ExtensionState } from '../services/state.js';

/**
 * Register all extension commands.
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  sdlcService: SdlcService,
  _state: ExtensionState,
  openDashboard: () => void,
  output: vscode.OutputChannel,
): void {
  // ── Init ─────────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.init', async () => {
      if (sdlcService.isLoaded) {
        const choice = await vscode.window.showWarningMessage(
          'SDLC tracking is already initialized for this workspace.',
          'Open Dashboard',
          'Re-initialize',
        );
        if (choice === 'Open Dashboard') {
          openDashboard();
          return;
        }
        if (choice !== 'Re-initialize') {
          return;
        }
      }

      await openInChat(
        'Initialize SDLC tracking for this workspace. ' +
        'Scan the project to detect the tech stack, modules, and conventions, ' +
        'then create the .sdlc/ directory with the project context.',
      );
    }),
  );

  // ── Start work ───────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.start', async () => {
      const description = await vscode.window.showInputBox({
        title: 'Start New Work Item',
        prompt: 'Describe what you want to work on',
        placeHolder: 'e.g., Add dark mode toggle with system preference detection',
      });

      if (!description) {
        return;
      }

      await openInChat(
        `Start a new SDLC work item: ${description}\n\n` +
        'Generate a brief with What, Why, and Acceptance Criteria, ' +
        'then create an implementation plan with task breakdown.',
      );
    }),
  );

  // ── Status ───────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.status', async () => {
      await openInChat(
        'Show me the current SDLC project status — ' +
        'active work items, project health, recent completions, and any alerts.',
      );
    }),
  );

  // ── Done ─────────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.done', async () => {
      const summary = await vscode.window.showInputBox({
        title: 'Complete Work Item',
        prompt: 'Brief summary of what was accomplished',
        placeHolder: 'e.g., Implemented dark mode with localStorage persistence',
      });

      if (!summary) {
        return;
      }

      await openInChat(
        `Complete the active SDLC work item with summary: ${summary}\n\n` +
        'Verify acceptance criteria, update the work index, and archive the work item.',
      );
    }),
  );

  // ── Abandon ───────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.abandon', async () => {
      const confirm = await vscode.window.showWarningMessage(
        'Are you sure you want to abandon the active work item?',
        { modal: true },
        'Abandon',
      );

      if (confirm !== 'Abandon') {
        return;
      }

      await openInChat(
        'Abandon the active SDLC work item. ' +
        'Archive it as "abandoned" and remove it from active work.',
      );
    }),
  );

  // ── Release ──────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.release', async () => {
      const version = await vscode.window.showInputBox({
        title: 'Create Release',
        prompt: 'Semantic version for this release',
        placeHolder: 'e.g., 1.0.0, 0.2.0',
        validateInput: (v) => /^\d+\.\d+\.\d+/.test(v) ? null : 'Enter a valid semver (e.g., 1.0.0)',
      });

      if (!version) {
        return;
      }

      await openInChat(
        `Create SDLC release v${version}. ` +
        'Summarize the completed work items and decisions since the last release, ' +
        'then create the release record with highlights, features, and bug fixes.',
      );
    }),
  );

  // ── Open Dashboard ───────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.openDashboard', () => {
      openDashboard();
    }),
  );

  // ── Open in Chat ─────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.openInChat', async () => {
      await openInChat('Show me the SDLC project status and suggest what to work on next.');
    }),
  );

  // ── Sync ─────────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.sync', async () => {
      output.appendLine('Manual sync triggered');
      await sdlcService.refresh();
      vscode.window.showInformationMessage('SDLC data synced');
    }),
  );

  // ── Snapshot ─────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('sdlc-workflow.snapshot', async () => {
      await openInChat(
        'Take an SDLC snapshot — capture the current project state ' +
        'including all work items, decisions, and metrics.',
      );
    }),
  );
}

/**
 * Open the chat panel with a pre-crafted prompt.
 */
async function openInChat(prompt: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.chat.open', {
    query: prompt,
  });
}
