import * as vscode from 'vscode';
import { initSdlc } from '@syncfusion/cs-sdlc';
import type { SdlcService } from '../services/sdlc-service.js';

interface InitProjectInput {
  name: string;
  description?: string;
}

export class InitProjectTool implements vscode.LanguageModelTool<InitProjectInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<InitProjectInput>,
    _token: vscode.CancellationToken,
  ) {
    return {
      invocationMessage: `Initializing SDLC project: ${options.input.name}`,
      confirmationMessages: {
        title: 'Initialize SDLC Project',
        message: new vscode.MarkdownString(
          `Create a new \`.sdlc/\` directory for **${options.input.name}**?\n\n` +
          `This will create manifest.json, context/architecture.md, and context/conventions.md.`,
        ),
      },
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<InitProjectInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No workspace folder open. Open a folder first.'),
      ]);
    }

    const projectRoot = workspaceFolders[0]!.uri.fsPath;

    try {
      const manifest = await initSdlc({
        projectRoot,
        name: options.input.name,
        description: options.input.description,
      });

      // Reload the service so the extension picks up the new .sdlc/
      await this._sdlcService.tryLoad();

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `# SDLC Project Initialized\n\n` +
          `**Project:** ${manifest.project.name}\n` +
          `**Location:** \`.sdlc/\`\n\n` +
          `Created:\n` +
          `- \`.sdlc/manifest.json\` — project identity and counters\n` +
          `- \`.sdlc/context/architecture.md\` — system architecture (template)\n` +
          `- \`.sdlc/context/conventions.md\` — coding conventions (template)\n` +
          `- \`.sdlc/index/\` — work, decisions, releases indexes\n\n` +
          `Next steps:\n` +
          `1. Fill in \`.sdlc/context/architecture.md\` with your system design\n` +
          `2. Fill in \`.sdlc/context/conventions.md\` with your coding standards\n` +
          `3. Start your first work item`,
        ),
      ]);
    } catch (err) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to initialize SDLC project: ${err instanceof Error ? err.message : String(err)}`,
        ),
      ]);
    }
  }
}
