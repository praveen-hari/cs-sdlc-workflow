import * as vscode from 'vscode';
import type { SdlcService } from '../services/sdlc-service.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface GetProjectStatusInput {}

export class GetProjectStatusTool implements vscode.LanguageModelTool<GetProjectStatusInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    _options: vscode.LanguageModelToolInvocationPrepareOptions<GetProjectStatusInput>,
    _token: vscode.CancellationToken,
  ) {
    return {
      invocationMessage: 'Reading SDLC project status...',
    };
  }

  async invoke(
    _options: vscode.LanguageModelToolInvocationOptions<GetProjectStatusInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          'No SDLC project found in this workspace. ' +
          'The user needs to initialize SDLC tracking first by running the "SDLC Workflow: Initialize" command ' +
          'or by creating a .sdlc/ directory.',
        ),
      ]);
    }

    await this._sdlcService.refresh();
    const status = this._sdlcService.getStatusSummary();

    if (!status) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('Failed to read SDLC project status.'),
      ]);
    }

    const manifest = this._sdlcService.getManifest();
    const workIndex = this._sdlcService.getWorkIndex();

    const lines: string[] = [
      `# SDLC Project Status`,
      ``,
      `**Project:** ${status.projectName}`,
      `**Mode:** ${status.projectMode}`,
      ``,
      `## Tech Stack`,
      `\`\`\`json`,
      JSON.stringify(status.stack, null, 2),
      `\`\`\``,
      ``,
      `## Modules`,
      status.modules.length > 0
        ? status.modules.map((m: unknown) => {
            const mod = m as { path?: string; type?: string };
            return `- **${mod.path ?? 'unknown'}** (${mod.type ?? 'unknown'})`;
          }).join('\n')
        : '_No modules defined_',
      ``,
      `## Work Items`,
      `- **Active:** ${status.activeWorkCount}`,
      `- **Total created:** ${(manifest?.counters as Record<string, unknown>)?.work ?? 0}`,
      `- **Decisions:** ${status.totalDecisions}`,
      `- **Releases:** ${status.totalReleases}`,
    ];

    if (status.activeWorkCount > 0 && workIndex?.active) {
      lines.push(``, `## Active Work`);
      for (const item of workIndex.active) {
        lines.push(`- **${item.id}**: ${item.title} (${item.type}, ${item.priority ?? 'medium'})`);
      }
    }

    if (workIndex?.recent && workIndex.recent.length > 0) {
      lines.push(``, `## Recently Completed`);
      for (const item of workIndex.recent) {
        lines.push(`- **${item.id}**: ${item.title} (${item.status})`);
      }
    }

    if (status.health) {
      lines.push(``, `## Health`, `\`\`\`json`, JSON.stringify(status.health, null, 2), `\`\`\``);
    }

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(lines.join('\n')),
    ]);
  }
}
