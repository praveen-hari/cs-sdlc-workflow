/**
 * Complete and abandon work operations per §7.3.2 and §7.3.3.
 *
 * Moves work item from active to archive, updates index and counters.
 *
 * @module
 */

import { join } from 'node:path';
import { rename, mkdir } from 'node:fs/promises';
import type { Manifest, WorkIndex } from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { workIndexSchema } from '../schemas/indexes.js';
import { specFrontMatterSchema } from '../schemas/objects.js';
import { readJson, readMarkdown } from '../core/reader.js';
import { writeJsonAtomic, writeMarkdown } from '../core/writer.js';
import { serializeFrontMatter } from '../core/frontmatter.js';
import { ItemNotFoundError } from '../core/errors.js';
import { nowISO, monthFromISO } from '../utils/dates.js';
import { MAX_RECENT_ITEMS } from '../core/constants.js';
import {
  SDLC_DIR, MANIFEST_FILE, INDEX_DIR, WORK_INDEX_FILE,
  WORK_DIR, ACTIVE_DIR, ARCHIVE_DIR, SPEC_FILE, BRIEF_FILE,
} from '../core/constants.js';

interface ArchiveResult {
  manifest: Manifest;
  workIndex: WorkIndex;
}

/**
 * Complete an active work item (§7.3.2).
 * Sets status to "completed", archives it, updates index and counters.
 */
export async function completeWork(
  projectRoot: string,
  id: string,
): Promise<ArchiveResult> {
  return archiveWork(projectRoot, id, 'completed');
}

/**
 * Abandon an active work item (§7.3.3).
 * Sets status to "abandoned", archives it, updates index and counters.
 */
export async function abandonWork(
  projectRoot: string,
  id: string,
): Promise<ArchiveResult> {
  return archiveWork(projectRoot, id, 'abandoned');
}

// ─── Shared Archive Logic ───────────────────────────────────────────────────

async function archiveWork(
  projectRoot: string,
  id: string,
  status: 'completed' | 'abandoned',
): Promise<ArchiveResult> {
  const sdlcDir = join(projectRoot, SDLC_DIR);
  const activeDir = join(sdlcDir, WORK_DIR, ACTIVE_DIR, id);

  // Read current state
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);
  const workIndex = await readJson(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndexSchema);

  // Find the entry in active
  const entryIndex = workIndex.active.findIndex((e) => e.id === id);
  if (entryIndex === -1) {
    throw new ItemNotFoundError('Work item', id);
  }
  const entry = workIndex.active[entryIndex]!;

  const completedAt = nowISO();
  const archiveMonth = monthFromISO(completedAt);

  // Update spec.md (or brief.md for legacy) front matter
  const { fileExists } = await import('../core/reader.js');
  let specPath = join(activeDir, SPEC_FILE);
  if (!(await fileExists(specPath))) {
    specPath = join(activeDir, BRIEF_FILE);
  }
  const brief = await readMarkdown(specPath, specFrontMatterSchema);
  const updatedFrontMatter = {
    ...brief.frontMatter,
    completedAt,
    status,
  };
  await writeMarkdown(
    specPath,
    serializeFrontMatter(updatedFrontMatter as Record<string, unknown>, brief.body),
  );

  // Move to archive
  const archiveDir = join(sdlcDir, WORK_DIR, ARCHIVE_DIR, archiveMonth, id);
  await mkdir(join(sdlcDir, WORK_DIR, ARCHIVE_DIR, archiveMonth), { recursive: true });
  await rename(activeDir, archiveDir);

  // Update work index: remove from active, add to recent
  workIndex.active.splice(entryIndex, 1);
  workIndex.recent.unshift({
    id: entry.id,
    title: entry.title,
    type: entry.type,
    completedAt,
    path: `work/archive/${archiveMonth}/${id}`,
  });

  // Cap recent at MAX_RECENT_ITEMS
  if (workIndex.recent.length > MAX_RECENT_ITEMS) {
    workIndex.recent = workIndex.recent.slice(0, MAX_RECENT_ITEMS);
  }

  // Update manifest counters
  manifest.counters.activeWork = workIndex.active.length;
  manifest.counters.totalCompleted += 1;

  // Write updated files
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndex);
  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);

  return { manifest, workIndex };
}
