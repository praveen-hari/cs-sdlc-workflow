/**
 * Start work operation per §7.3.1.
 *
 * Creates a new active work item: directory, brief.md, optional plan.md,
 * updates work index and manifest counters.
 *
 * @module
 */

import { join } from 'node:path';
import { readdir, mkdir } from 'node:fs/promises';
import type { Manifest, WorkIndex, ActiveWorkEntry, BriefFrontMatter } from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { workIndexSchema } from '../schemas/indexes.js';
import { readJson } from '../core/reader.js';
import { writeJsonAtomic, writeMarkdown } from '../core/writer.js';
import { serializeFrontMatter } from '../core/frontmatter.js';
import { generateWorkItemId, resolveIdConflict } from '../core/identifiers.js';
import { nowISO } from '../utils/dates.js';
import {
  SDLC_DIR, MANIFEST_FILE, INDEX_DIR, WORK_INDEX_FILE,
  WORK_DIR, ACTIVE_DIR, BRIEF_FILE, PLAN_FILE,
} from '../core/constants.js';

export interface StartWorkOptions {
  /** What the work is about. Used to generate the ID slug. */
  description: string;
  /** Work type. Default: "feature". */
  type?: string;
  /** Priority level. */
  priority?: string;
  /** Module IDs this work item affects. */
  modules?: string[];
  /** Whether to create a plan.md template. Default: true. */
  createPlan?: boolean;
}

export interface StartWorkResult {
  id: string;
  manifest: Manifest;
  workIndex: WorkIndex;
}

/**
 * Create a new active work item.
 */
export async function startWork(
  projectRoot: string,
  options: StartWorkOptions,
): Promise<StartWorkResult> {
  const sdlcDir = join(projectRoot, SDLC_DIR);

  // Read current state
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);
  const workIndex = await readJson(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndexSchema);

  // Generate unique ID
  const baseId = generateWorkItemId(options.description);
  const existingIds = new Set<string>();
  try {
    const dirs = await readdir(join(sdlcDir, WORK_DIR, ACTIVE_DIR));
    for (const d of dirs) existingIds.add(d);
  } catch {
    // Directory may not exist yet
  }
  const id = resolveIdConflict(baseId, existingIds);

  const createdAt = nowISO();
  const type = options.type ?? 'feature';

  // Create work item directory
  const workItemDir = join(sdlcDir, WORK_DIR, ACTIVE_DIR, id);
  await mkdir(workItemDir, { recursive: true });

  // Write brief.md
  const briefFrontMatter: BriefFrontMatter = {
    type,
    title: options.description,
    createdAt,
    ...(options.priority && { priority: options.priority }),
    ...(options.modules && { modules: options.modules }),
  };

  const briefBody = `# ${options.description}

## What

<!-- Description of the work. -->

## Why

<!-- Motivation and context. -->

## Acceptance Criteria

<!-- How to know when it's done. -->
`;

  await writeMarkdown(
    join(workItemDir, BRIEF_FILE),
    serializeFrontMatter(briefFrontMatter as Record<string, unknown>, briefBody),
  );

  // Optionally create plan.md
  if (options.createPlan !== false) {
    const planBody = `# Implementation Plan

## Task 1: TODO
- [ ] Describe the first task
`;
    await writeMarkdown(
      join(workItemDir, PLAN_FILE),
      serializeFrontMatter({ totalTasks: 0, completedTasks: 0 }, planBody),
    );
  }

  // Update work index
  const entry: ActiveWorkEntry = {
    id,
    title: options.description,
    type,
    createdAt,
    path: `work/active/${id}`,
    ...(options.priority && { priority: options.priority }),
    ...(options.modules && { modules: options.modules }),
  };
  workIndex.active.push(entry);

  // Update manifest counters
  manifest.counters.activeWork = workIndex.active.length;

  // Write updated files
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndex);
  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);

  return { id, manifest, workIndex };
}
