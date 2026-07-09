import * as vscode from 'vscode';
import type { SdlcService } from '../services/sdlc-service.js';

interface ListWorkItemsInput {
  status?: 'active' | 'recent' | 'all';
}

export class ListWorkItemsTool implements vscode.LanguageModelTool<ListWorkItemsInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<ListWorkItemsInput>,
    _token: vscode.CancellationToken,
  ) {
    const filter = options.input.status ?? 'all';
    return {
      invocationMessage: `Listing ${filter} SDLC work items...`,
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ListWorkItemsInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No SDLC project found. Initialize first.'),
      ]);
    }

    await this._sdlcService.refresh();
    const workIndex = this._sdlcService.getWorkIndex();

    if (!workIndex) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('Failed to read work index.'),
      ]);
    }

    const filter = options.input.status ?? 'all';
    const lines: string[] = ['# SDLC Work Items', ''];

    if (filter === 'active' || filter === 'all') {
      lines.push(`## Active (${workIndex.active.length})`);
      if (workIndex.active.length === 0) {
        lines.push('_No active work items_');
      } else {
        for (const item of workIndex.active) {
          lines.push(`- **${item.id}**: ${item.title}`);
          lines.push(`  - Type: ${item.type} | Priority: ${item.priority ?? 'medium'} | Phase: ${item.phase ?? 'unknown'}`);
          if (item.modules && item.modules.length > 0) {
            lines.push(`  - Modules: ${item.modules.join(', ')}`);
          }
        }
      }
      lines.push('');
    }

    if (filter === 'recent' || filter === 'all') {
      lines.push(`## Recently Completed (${workIndex.recent.length})`);
      if (workIndex.recent.length === 0) {
        lines.push('_No recently completed work items_');
      } else {
        for (const item of workIndex.recent) {
          lines.push(`- **${item.id}**: ${item.title} (${item.status})`);
        }
      }
      lines.push('');
    }

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(lines.join('\n')),
    ]);
  }
}
