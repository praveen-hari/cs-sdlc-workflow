import * as vscode from 'vscode';
import { createDecision } from '@syncfusion/cs-sdlc';
import type { SdlcService } from '../services/sdlc-service.js';

interface LogDecisionInput {
  title: string;
  context?: string;
  decision?: string;
  rationale?: string;
  status?: string;
  modules?: string[];
}

export class LogDecisionTool implements vscode.LanguageModelTool<LogDecisionInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<LogDecisionInput>,
    _token: vscode.CancellationToken,
  ) {
    return {
      invocationMessage: `Logging decision: ${options.input.title}`,
      confirmationMessages: {
        title: 'Log SDLC Decision',
        message: new vscode.MarkdownString(
          `Create a new decision record?\n\n` +
          `**Title:** ${options.input.title}\n` +
          `**Status:** ${options.input.status ?? 'accepted'}`,
        ),
      },
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<LogDecisionInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const projectRoot = this._sdlcService.sdlcRoot;
    if (!projectRoot || !this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No SDLC project found. Initialize first.'),
      ]);
    }

    try {
      const result = await createDecision(projectRoot, {
        title: options.input.title,
        context: options.input.context,
        decision: options.input.decision,
        rationale: options.input.rationale,
        status: options.input.status ?? 'accepted',
        modules: options.input.modules,
      });

      // Refresh service state
      await this._sdlcService.refresh();

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `# Decision Recorded\n\n` +
          `**ID:** ${result.id}\n` +
          `**Title:** ${options.input.title}\n` +
          `**Status:** ${options.input.status ?? 'accepted'}\n` +
          `**File:** \`${result.path}\`\n\n` +
          `The decision has been recorded in the SDLC decisions directory.`,
        ),
      ]);
    } catch (err) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to log decision: ${err instanceof Error ? err.message : String(err)}`,
        ),
      ]);
    }
  }
}
