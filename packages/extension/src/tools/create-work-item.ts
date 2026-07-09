import * as vscode from 'vscode';
import { startWork } from '@syncfusion/cs-sdlc';
import type { SdlcService } from '../services/sdlc-service.js';

interface CreateWorkItemInput {
  title: string;
  type?: string;
  priority?: string;
  modules?: string[];
}

export class CreateWorkItemTool implements vscode.LanguageModelTool<CreateWorkItemInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<CreateWorkItemInput>,
    _token: vscode.CancellationToken,
  ) {
    return {
      invocationMessage: `Creating work item: ${options.input.title}`,
      confirmationMessages: {
        title: 'Create SDLC Work Item',
        message: new vscode.MarkdownString(
          `Create a new **${options.input.type ?? 'feature'}** work item?\n\n` +
          `**Title:** ${options.input.title}\n` +
          `**Priority:** ${options.input.priority ?? 'medium'}`,
        ),
      },
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<CreateWorkItemInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const projectRoot = this._sdlcService.sdlcRoot;
    if (!projectRoot || !this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No SDLC project found. Initialize first.'),
      ]);
    }

    try {
      const result = await startWork(projectRoot, {
        description: options.input.title,
        type: options.input.type ?? 'feature',
        priority: options.input.priority ?? 'medium',
        modules: options.input.modules,
        createPlan: true,
      });

      // Refresh service state
      await this._sdlcService.refresh();

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `# Work Item Created\n\n` +
          `**ID:** ${result.id}\n` +
          `**Title:** ${options.input.title}\n` +
          `**Type:** ${options.input.type ?? 'feature'}\n` +
          `**Priority:** ${options.input.priority ?? 'medium'}\n\n` +
          `The work item has been created in \`.sdlc/work/active/${result.id}/\`.\n` +
          `A brief.md and plan.md template have been generated.\n\n` +
          `Next steps:\n` +
          `1. Review and refine the brief (acceptance criteria)\n` +
          `2. Fill in the implementation plan\n` +
          `3. Start implementing`,
        ),
      ]);
    } catch (err) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to create work item: ${err instanceof Error ? err.message : String(err)}`,
        ),
      ]);
    }
  }
}
