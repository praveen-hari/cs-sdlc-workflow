import * as vscode from 'vscode';
import type { SdlcService } from '../services/sdlc-service.js';
import { GetProjectStatusTool } from './get-project-status.js';
import { GetProjectContextTool } from './get-project-context.js';
import { ListWorkItemsTool } from './list-work-items.js';
import { GetWorkItemTool } from './get-work-item.js';
import { CreateWorkItemTool } from './create-work-item.js';
import { CompleteWorkItemTool } from './complete-work-item.js';
import { LogDecisionTool } from './log-decision.js';

/**
 * Register all Language Model Tools.
 */
export function registerTools(
  context: vscode.ExtensionContext,
  sdlcService: SdlcService,
): void {
  context.subscriptions.push(
    vscode.lm.registerTool('sdlc-workflow_getProjectStatus', new GetProjectStatusTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_getProjectContext', new GetProjectContextTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_listWorkItems', new ListWorkItemsTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_getWorkItem', new GetWorkItemTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_createWorkItem', new CreateWorkItemTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_completeWorkItem', new CompleteWorkItemTool(sdlcService)),
    vscode.lm.registerTool('sdlc-workflow_logDecision', new LogDecisionTool(sdlcService)),
  );
}
