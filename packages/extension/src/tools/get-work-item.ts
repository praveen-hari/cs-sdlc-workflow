import * as vscode from 'vscode';
import { readWorkItem } from '@syncfusion/cs-sdlc';
import type { SdlcService } from '../services/sdlc-service.js';

interface GetWorkItemInput {
  id: string;
}

export class GetWorkItemTool implements vscode.LanguageModelTool<GetWorkItemInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<GetWorkItemInput>,
    _token: vscode.CancellationToken,
  ) {
    return {
      invocationMessage: `Reading work item ${options.input.id}...`,
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<GetWorkItemInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const projectRoot = this._sdlcService.sdlcRoot;
    if (!projectRoot || !this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No SDLC project found. Initialize first.'),
      ]);
    }

    try {
      const workItem = await readWorkItem(projectRoot, options.input.id);

      const lines: string[] = [
        `# Work Item: ${workItem.id}`,
        '',
      ];

      // Brief
      if (workItem.brief) {
        const fm = workItem.brief.frontMatter as Record<string, unknown> | undefined;
        lines.push(`## Brief`);
        if (fm) {
          lines.push(`- **Title:** ${fm.title ?? workItem.id}`);
          lines.push(`- **Type:** ${fm.type ?? 'unknown'}`);
          lines.push(`- **Priority:** ${fm.priority ?? 'medium'}`);
          lines.push(`- **Status:** ${fm.status ?? 'active'}`);
          lines.push(`- **Created:** ${fm.createdAt ?? 'unknown'}`);
          if (fm.modules) {
            lines.push(`- **Modules:** ${(fm.modules as string[]).join(', ')}`);
          }
        }
        if (workItem.brief.body) {
          lines.push('', workItem.brief.body);
        }
        lines.push('');
      }

      // Plan
      if (workItem.plan) {
        lines.push(`## Plan`);
        const pfm = workItem.plan.frontMatter as Record<string, unknown> | undefined;
        if (pfm) {
          lines.push(`- **Phase:** ${pfm.phase ?? 'unknown'}`);
          lines.push(`- **Tasks:** ${pfm.totalTasks ?? '?'} total, ${pfm.completedTasks ?? '?'} completed`);
        }
        if (workItem.plan.body) {
          lines.push('', workItem.plan.body);
        }
        lines.push('');
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(lines.join('\n')),
      ]);
    } catch (err) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Work item "${options.input.id}" not found. ` +
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        ),
      ]);
    }
  }
}
