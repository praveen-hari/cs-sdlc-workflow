/**
 * Plan task operations — parse, toggle, and sync checkboxes in plan.md.
 *
 * @module
 */

import { join } from 'node:path';
import { readMarkdown, fileExists } from '../core/reader.js';
import { writeMarkdown } from '../core/writer.js';
import { serializeFrontMatter } from '../core/frontmatter.js';
import { planFrontMatterSchema } from '../schemas/objects.js';
import { ItemNotFoundError } from '../core/errors.js';
import {
  SDLC_DIR, WORK_DIR, ACTIVE_DIR, PLAN_FILE,
} from '../core/constants.js';

export interface PlanTask {
  /** 1-based task number (order of appearance in the file). */
  number: number;
  /** The task text (without the checkbox prefix). */
  text: string;
  /** Whether the task is completed. */
  completed: boolean;
  /** The original line number in the file (0-based). */
  lineIndex: number;
}

export interface PlanSummary {
  tasks: PlanTask[];
  totalTasks: number;
  completedTasks: number;
}

const CHECKBOX_REGEX = /^(\s*)-\s+\[([ xX])\]\s+(.*)$/;

/**
 * List all tasks (checkboxes) in a work item's plan.md.
 */
export async function listPlanTasks(
  projectRoot: string,
  workId: string,
): Promise<PlanSummary> {
  const planPath = resolvePlanPath(projectRoot, workId);
  if (!(await fileExists(planPath))) {
    throw new ItemNotFoundError('Plan', workId);
  }

  const doc = await readMarkdown(planPath);
  const tasks = parseCheckboxes(doc.body);

  return {
    tasks,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.completed).length,
  };
}

/**
 * Toggle a task checkbox in plan.md and sync front matter counters.
 *
 * @param taskNumber - 1-based task number
 * @param completed - true to check, false to uncheck
 */
export async function updatePlanTask(
  projectRoot: string,
  workId: string,
  taskNumber: number,
  completed: boolean,
): Promise<PlanSummary> {
  const planPath = resolvePlanPath(projectRoot, workId);
  if (!(await fileExists(planPath))) {
    throw new ItemNotFoundError('Plan', workId);
  }

  const doc = await readMarkdown(planPath, planFrontMatterSchema);
  const lines = doc.body.split('\n');
  const tasks = parseCheckboxes(doc.body);

  // Find the task by number (1-based)
  const task = tasks.find((t) => t.number === taskNumber);
  if (!task) {
    throw new ItemNotFoundError('Task', `#${taskNumber} in ${workId}`);
  }

  // Toggle the checkbox on the correct line
  const line = lines[task.lineIndex]!;
  const match = CHECKBOX_REGEX.exec(line);
  if (match) {
    const indent = match[1];
    const text = match[3];
    lines[task.lineIndex] = `${indent}- [${completed ? 'x' : ' '}] ${text}`;
  }

  // Rebuild body
  const newBody = lines.join('\n');

  // Recount and sync front matter
  const updatedTasks = parseCheckboxes(newBody);
  const totalTasks = updatedTasks.length;
  const completedTasks = updatedTasks.filter((t) => t.completed).length;

  // Find current task (first uncompleted)
  const currentTask = updatedTasks.find((t) => !t.completed)?.number ?? totalTasks;

  const frontMatter = {
    ...(doc.frontMatter ?? {}),
    totalTasks,
    completedTasks,
    currentTask,
  };

  await writeMarkdown(
    planPath,
    serializeFrontMatter(frontMatter as Record<string, unknown>, newBody),
  );

  return {
    tasks: updatedTasks.map((t) =>
      t.number === taskNumber ? { ...t, completed } : t,
    ),
    totalTasks,
    completedTasks,
  };
}

/**
 * Sync plan.md front matter counters by counting checkboxes.
 * Useful after manual edits to plan.md.
 */
export async function syncPlanProgress(
  projectRoot: string,
  workId: string,
): Promise<PlanSummary> {
  const planPath = resolvePlanPath(projectRoot, workId);
  if (!(await fileExists(planPath))) {
    throw new ItemNotFoundError('Plan', workId);
  }

  const doc = await readMarkdown(planPath, planFrontMatterSchema);
  const tasks = parseCheckboxes(doc.body);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const currentTask = tasks.find((t) => !t.completed)?.number ?? totalTasks;

  const frontMatter = {
    ...(doc.frontMatter ?? {}),
    totalTasks,
    completedTasks,
    currentTask,
  };

  await writeMarkdown(
    planPath,
    serializeFrontMatter(frontMatter as Record<string, unknown>, doc.body),
  );

  return { tasks, totalTasks, completedTasks };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolvePlanPath(projectRoot: string, workId: string): string {
  return join(projectRoot, SDLC_DIR, WORK_DIR, ACTIVE_DIR, workId, PLAN_FILE);
}

function parseCheckboxes(body: string): PlanTask[] {
  const lines = body.split('\n');
  const tasks: PlanTask[] = [];
  let taskNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = CHECKBOX_REGEX.exec(lines[i]!);
    if (match) {
      taskNumber++;
      tasks.push({
        number: taskNumber,
        text: match[3]!.trim(),
        completed: match[2] === 'x' || match[2] === 'X',
        lineIndex: i,
      });
    }
  }

  return tasks;
}
