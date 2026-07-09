import * as vscode from 'vscode';
import { updatePlanTask, listPlanTasks } from '@syncfusion/cs-sdlc';
import type { SdlcService } from '../services/sdlc-service.js';

interface UpdatePlanProgressInput {
  id: string;
  taskNumber: number;
  completed?: boolean;
}

export class UpdatePlanProgressTool implements vscode.LanguageModelTool<UpdatePlanProgressInput> {
  constructor(private readonly _sdlcService: SdlcService) {}

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<UpdatePlanProgressInput>,
    _token: vscode.CancellationToken,
  ) {
    const action = options.input.completed === false ? 'Unmark' : 'Mark';
    return {
      invocationMessage: `${action}ing task ${options.input.taskNumber} in ${options.input.id}...`,
    };
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<UpdatePlanProgressInput>,
    _token: vscode.CancellationToken,
  ): Promise<vscode.LanguageModelToolResult> {
    const projectRoot = this._sdlcService.sdlcRoot;
    if (!projectRoot || !this._sdlcService.isLoaded) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('No SDLC project found. Initialize first.'),
      ]);
    }

    try {
      const completed = options.input.completed !== false;

      await updatePlanTask(projectRoot, options.input.id, options.input.taskNumber, completed);

      // Get updated summary
      const summary = await listPlanTasks(projectRoot, options.input.id);

      // Refresh service state so dashboard updates
      await this._sdlcService.refresh();

      const action = completed ? 'completed' : 'unchecked';
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Task ${options.input.taskNumber} ${action} in ${options.input.id}.\n\n` +
          `**Progress:** ${summary.completedTasks}/${summary.totalTasks} tasks (${Math.round((summary.completedTasks / Math.max(summary.totalTasks, 1)) * 100)}%)\n\n` +
          (summary.completedTasks === summary.totalTasks
            ? `🎉 All tasks complete! Ready for acceptance criteria review.`
            : `Next unchecked task: ${summary.tasks.find(t => !t.completed)?.text ?? 'none'}`),
        ),
      ]);
    } catch (err) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Failed to update plan progress: ${err instanceof Error ? err.message : String(err)}`,
        ),
      ]);
    }
  }
}
