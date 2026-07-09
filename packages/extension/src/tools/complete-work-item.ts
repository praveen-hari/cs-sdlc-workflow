import * as vscode from 'vscode';
import { completeWork } from '@syncfusion/cs-sdlc';
import type { SdlcService } from '../services/sdlc-service.js';

interface CompleteWorkItemInput {
  id: string;
}

export class CompleteWorkItemTool implements vscode.LanguageModelTool<CompleteWorkItemInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<CompleteWorkItemInput>,
    _token: vscode.CancellationToken,
  ) {
    return {
      invocationMessage: `Completing work item ${options.input.id}...`,
      confirmationMessages: {
        title: 'Complete SDLC Work Item',
        message: new vscode.MarkdownString(
          `Mark work item **${options.input.id}** as completed?\n\n` +
          `This will archive the work item and update the project counters.`,
        ),
      },
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<CompleteWorkItemInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const projectRoot = this._sdlcService.sdlcRoot;
    if (!projectRoot || !this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No SDLC project found. Initialize first.'),
      ]);
    }

    try {
      await completeWork(projectRoot, options.input.id);

      // Refresh service state
      await this._sdlcService.refresh();

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `# Work Item Completed\n\n` +
          `**${options.input.id}** has been marked as completed and archived.\n\n` +
          `The work item has been moved from \`work/active/\` to \`work/archive/\`.\n` +
          `Project counters have been updated.`,
        ),
      ]);
    } catch (err) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to complete work item "${options.input.id}": ${err instanceof Error ? err.message : String(err)}`,
        ),
      ]);
    }
  }
}
