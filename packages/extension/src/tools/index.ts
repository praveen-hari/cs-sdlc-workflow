import * as vscode from 'vscode';
import type { SdlcService } from '../services/sdlc-service.js';
import { InitProjectTool } from './init-project.js';
import { GetProjectStatusTool } from './get-project-status.js';
import { CreateWorkItemTool } from './create-work-item.js';
import { CompleteWorkItemTool } from './complete-work-item.js';
import { LogDecisionTool } from './log-decision.js';

/**
 * Register Language Model Tools.
 *
 * Only tools that perform multi-file coordinated operations are registered.
 * The agent can read/write individual .sdlc/ files directly using built-in
 * file tools — no LM tool needed for simple reads or edits.
 */
export function registerTools(
  context: vscode.ExtensionContext,
  sdlcService: SdlcService,
): void {
  context.subscriptions.push(
    vscode.lm.registerTool('sdlc-workflow_initProject', new InitProjectTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_getProjectStatus', new GetProjectStatusTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_createWorkItem', new CreateWorkItemTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_completeWorkItem', new CompleteWorkItemTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_logDecision', new LogDecisionTool(sdlcService)),
  );
}
