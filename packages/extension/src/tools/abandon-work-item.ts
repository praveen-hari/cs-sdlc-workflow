import * as vscode from 'vscode';
import { abandonWork } from '@syncfusion/cs-sdlc';
import type { SdlcService } from '../services/sdlc-service.js';

interface AbandonWorkItemInput {
  id: string;
}

export class AbandonWorkItemTool implements vscode.LanguageModelTool<AbandonWorkItemInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<AbandonWorkItemInput>,
    _token: vscode.CancellationToken,
  ) {
    return {
      invocationMessage: `Abandoning work item ${options.input.id}...`,
      confirmationMessages: {
        title: 'Abandon SDLC Work Item',
        message: new vscode.MarkdownString(
          `Abandon work item **${options.input.id}**?\n\n` +
          `This will archive the work item as "abandoned" and remove it from active work.`,
        ),
      },
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<AbandonWorkItemInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const projectRoot = this._sdlcService.sdlcRoot;
    if (!projectRoot || !this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No SDLC project found. Initialize first.'),
      ]);
    }

    try {
      await abandonWork(projectRoot, options.input.id);

      // Refresh service state
      await this._sdlcService.refresh();

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `# Work Item Abandoned\n\n` +
          `**${options.input.id}** has been abandoned and archived.\n\n` +
          `The work item has been moved from \`work/active/\` to \`work/archive/\` with status "abandoned".\n` +
          `Project counters have been updated.`,
        ),
      ]);
    } catch (err) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to abandon work item "${options.input.id}": ${err instanceof Error ? err.message : String(err)}`,
        ),
      ]);
    }
  }
}
