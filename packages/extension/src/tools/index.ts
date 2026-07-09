import * as vscode from 'vscode';
import type { SdlcService } from '../services/sdlc-service.js';
import { InitProjectTool } from './init-project.js';
import { GetProjectStatusTool } from './get-project-status.js';
import { CreateWorkItemTool } from './create-work-item.js';
import { CompleteWorkItemTool } from './complete-work-item.js';
import { AbandonWorkItemTool } from './abandon-work-item.js';
import { CreateReleaseTool } from './create-release.js';
import { LogDecisionTool } from './log-decision.js';
import { ToggleTodoTaskTool } from './toggle-todo-task.js';

/**
 * Register Language Model Tools.
 *
 * Tools perform multi-file coordinated operations with atomic index updates.
 * The agent can read/write individual .sdlc/ files directly using built-in
 * file tools — no LM tool needed for simple reads or edits.
 *
 * Tool visibility is controlled by `when` clauses in package.json:
 * - initProject: only when no .sdlc/ exists
 * - All others: only when .sdlc/ is loaded
 * - Work item tools: only when active work exists
 */
export function registerTools(
  context: vscode.ExtensionContext,
  sdlcService: SdlcService,
): void {
  context.subscriptions.push(
    // Project lifecycle
    vscode.lm.registerTool('sdlc-workflow_initProject', new InitProjectTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_getProjectStatus', new GetProjectStatusTool(sdlcService)),

    // Work item lifecycle
    vscode.lm.registerTool('sdlc-workflow_createWorkItem', new CreateWorkItemTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_completeWorkItem', new CompleteWorkItemTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_abandonWorkItem', new AbandonWorkItemTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_toggleTodoTask', new ToggleTodoTaskTool(sdlcService)),

    // Decisions & releases
    vscode.lm.registerTool('sdlc-workflow_logDecision', new LogDecisionTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_createRelease', new CreateReleaseTool(sdlcService)),
  );
}
