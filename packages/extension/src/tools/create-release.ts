import * as vscode from 'vscode';
import { createRelease } from '@syncfusion/cs-sdlc';
import type { SdlcService } from '../services/sdlc-service.js';

interface CreateReleaseInput {
  version: string;
  title?: string;
  highlights?: string;
  features?: string;
  bugFixes?: string;
  breakingChanges?: string;
}

export class CreateReleaseTool implements vscode.LanguageModelTool<CreateReleaseInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<CreateReleaseInput>,
    _token: vscode.CancellationToken,
  ) {
    return {
      invocationMessage: `Creating release v${options.input.version}...`,
      confirmationMessages: {
        title: 'Create SDLC Release',
        message: new vscode.MarkdownString(
          `Create release **v${options.input.version}**?\n\n` +
          (options.input.title ? `**Title:** ${options.input.title}\n\n` : '') +
          `This will create a release record and update the releases index.`,
        ),
      },
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<CreateReleaseInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const projectRoot = this._sdlcService.sdlcRoot;
    if (!projectRoot || !this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No SDLC project found. Initialize first.'),
      ]);
    }

    try {
      const result = await createRelease(projectRoot, {
        version: options.input.version,
        title: options.input.title,
        highlights: options.input.highlights,
        features: options.input.features,
        bugFixes: options.input.bugFixes,
        breakingChanges: options.input.breakingChanges,
      });

      // Refresh service state
      await this._sdlcService.refresh();

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `# Release Created\n\n` +
          `**Version:** v${result.version}\n` +
          (options.input.title ? `**Title:** ${options.input.title}\n` : '') +
          `**File:** \`${result.path}\`\n\n` +
          `The release record has been created and the releases index has been updated.`,
        ),
      ]);
    } catch (err) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to create release: ${err instanceof Error ? err.message : String(err)}`,
        ),
      ]);
    }
  }
}
