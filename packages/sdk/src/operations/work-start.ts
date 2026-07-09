/**
 * Start work operation per §7.3.1.
 *
 * Creates a new active work item: directory, spec.md, plan.md, todo.md,
 * updates work index and manifest counters.
 *
 * @module
 */

import { join } from 'node:path';
import { readdir, mkdir } from 'node:fs/promises';
import type { Manifest, WorkIndex, ActiveWorkEntry, SpecFrontMatter } from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { workIndexSchema } from '../schemas/indexes.js';
import { readJson } from '../core/reader.js';
import { writeJsonAtomic, writeMarkdown } from '../core/writer.js';
import { serializeFrontMatter } from '../core/frontmatter.js';
import { generateWorkItemId, resolveIdConflict } from '../core/identifiers.js';
import { nowISO } from '../utils/dates.js';
import {
  SDLC_DIR, MANIFEST_FILE, INDEX_DIR, WORK_INDEX_FILE,
  WORK_DIR, ACTIVE_DIR, SPEC_FILE, PLAN_FILE, TODO_FILE,
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

  // Write spec.md (feature specification)
  const specFrontMatter: SpecFrontMatter = {
    type,
    title: options.description,
    createdAt,
    ...(options.priority && { priority: options.priority }),
    ...(options.modules && { modules: options.modules }),
  };

  const specBody = `# ${options.description}

## What

<!-- What are we building? One paragraph. -->

## Why

<!-- What problem does this solve? Who benefits? -->

## Acceptance Criteria

<!-- Specific, testable conditions (pass/fail). -->

## Testing Strategy

<!-- How will each criterion be verified? (unit test, integration test, manual check) -->

## Boundaries

### Always Do
<!-- Rules the agent must follow for this work item. -->

### Ask First
<!-- Things that need user approval before doing. -->

### Never Do
<!-- Hard constraints the agent must not violate. -->
`;

  await writeMarkdown(
    join(workItemDir, SPEC_FILE),
    serializeFrontMatter(specFrontMatter as Record<string, unknown>, specBody),
  );

  // Write plan.md (implementation plan)
  if (options.createPlan !== false) {
    const planBody = `# Implementation Plan

## Overview

<!-- One paragraph summary of the approach. -->

## Architecture Decisions

<!-- Key decisions and rationale for this feature. -->

## Dependencies

<!-- What must be built first? What depends on what? -->
`;
    await writeMarkdown(
      join(workItemDir, PLAN_FILE),
      serializeFrontMatter({}, planBody),
    );

    // Write todo.md (task checklist)
    const todoBody = `# Tasks

## Task 1: TODO
- [ ] Describe the first task
`;
    await writeMarkdown(
      join(workItemDir, TODO_FILE),
      serializeFrontMatter({ totalTasks: 0, completedTasks: 0 }, todoBody),
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
