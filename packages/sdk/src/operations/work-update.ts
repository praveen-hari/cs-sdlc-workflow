/**
 * Update work item operation.
 *
 * Modifies an active work item's brief metadata (priority, modules, type)
 * and/or body content after creation.
 *
 * @module
 */

import { join } from 'node:path';
import type { Manifest, WorkIndex } from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { workIndexSchema } from '../schemas/indexes.js';
import { specFrontMatterSchema } from '../schemas/objects.js';
import { readJson, readMarkdown, fileExists } from '../core/reader.js';
import { writeJsonAtomic, writeMarkdown } from '../core/writer.js';
import { serializeFrontMatter } from '../core/frontmatter.js';
import { ItemNotFoundError } from '../core/errors.js';
import {
  SDLC_DIR, MANIFEST_FILE, INDEX_DIR, WORK_INDEX_FILE,
  WORK_DIR, ACTIVE_DIR, SPEC_FILE, BRIEF_FILE,
} from '../core/constants.js';

export interface UpdateWorkItemOptions {
  /** New title/description. */
  title?: string;
  /** New work type (feature, bugfix, chore, refactor, etc.). */
  type?: string;
  /** New priority level. */
  priority?: string;
  /** New module IDs. Pass empty array to clear. */
  modules?: string[];
  /** New body content for brief.md. If omitted, body is preserved. */
  body?: string;
  /** Additional front matter fields to merge. */
  frontMatter?: Record<string, unknown>;
}

export interface UpdateWorkItemResult {
  id: string;
  manifest: Manifest;
  workIndex: WorkIndex;
}

/**
 * Update an active work item's brief metadata and/or body.
 *
 * Only active work items can be updated. Archived items are immutable.
 *
 * @throws ItemNotFoundError if the work item is not in active/
 */
export async function updateWorkItem(
  projectRoot: string,
  id: string,
  options: UpdateWorkItemOptions,
): Promise<UpdateWorkItemResult> {
  const sdlcDir = join(projectRoot, SDLC_DIR);
  // Try spec.md (new) then brief.md (legacy)
  let specPath = join(sdlcDir, WORK_DIR, ACTIVE_DIR, id, SPEC_FILE);
  if (!(await fileExists(specPath))) {
    specPath = join(sdlcDir, WORK_DIR, ACTIVE_DIR, id, BRIEF_FILE);
  }

  // Verify work item exists in active
  if (!(await fileExists(specPath))) {
    throw new ItemNotFoundError('Active work item', id);
  }

  // Read current state
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);
  const workIndex = await readJson(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndexSchema);
  const brief = await readMarkdown(specPath, specFrontMatterSchema);

  // Merge front matter updates
  const updatedFrontMatter: Record<string, unknown> = {
    ...(brief.frontMatter as Record<string, unknown> ?? {}),
    ...options.frontMatter,
  };

  if (options.title !== undefined) updatedFrontMatter['title'] = options.title;
  if (options.type !== undefined) updatedFrontMatter['type'] = options.type;
  if (options.priority !== undefined) updatedFrontMatter['priority'] = options.priority;
  if (options.modules !== undefined) {
    if (options.modules.length > 0) {
      updatedFrontMatter['modules'] = options.modules;
    } else {
      delete updatedFrontMatter['modules'];
    }
  }

  // Use new body if provided, otherwise keep existing
  const body = options.body ?? brief.body;

  // Write updated spec.md
  await writeMarkdown(
    specPath,
    serializeFrontMatter(updatedFrontMatter, body),
  );

  // Update work index entry to match
  const entry = workIndex.active.find((e) => e.id === id);
  if (entry) {
    if (options.title !== undefined) entry.title = options.title;
    if (options.type !== undefined) entry.type = options.type;
    if (options.priority !== undefined) entry.priority = options.priority;
    if (options.modules !== undefined) {
      entry.modules = options.modules.length > 0 ? options.modules : undefined;
    }
    await writeJsonAtomic(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndex);
  }

  return { id, manifest, workIndex };
}
