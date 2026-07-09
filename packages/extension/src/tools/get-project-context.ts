import * as vscode from 'vscode';
import { readContextDoc } from '@syncfusion/cs-sdlc';
import type { SdlcService } from '../services/sdlc-service.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface GetProjectContextInput {}

export class GetProjectContextTool implements vscode.LanguageModelTool<GetProjectContextInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    _options: vscode.LanguageModelToolInvocationPrepareOptions<GetProjectContextInput>,
    _token: vscode.CancellationToken,
  ) {
    return {
      invocationMessage: 'Reading SDLC project context...',
    };
  }

  async invoke(
    _options: vscode.LanguageModelToolInvocationOptions<GetProjectContextInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const projectRoot = this._sdlcService.sdlcRoot;
    if (!projectRoot || !this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No SDLC project found. Initialize first.'),
      ]);
    }

    const lines: string[] = ['# SDLC Project Context', ''];

    // Read each context document
    const contextNames = ['brief', 'architecture', 'conventions', 'requirements', 'stack'];
    for (const name of contextNames) {
      try {
        const doc = await readContextDoc(projectRoot, name);
        lines.push(`## ${name.charAt(0).toUpperCase() + name.slice(1)}`);
        if (doc.document.frontMatter) {
          lines.push('```yaml', JSON.stringify(doc.document.frontMatter, null, 2), '```');
        }
        if (doc.document.body) {
          lines.push('', doc.document.body);
        }
        lines.push('');
      } catch {
        // Context doc doesn't exist — skip
      }
    }

    if (lines.length <= 2) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          'No context documents found in .sdlc/context/. ' +
          'The project context has not been set up yet.',
        ),
      ]);
    }

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(lines.join('\n')),
    ]);
  }
}
