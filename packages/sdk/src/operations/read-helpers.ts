/**
 * Public read functions — thin wrappers over core reader + schemas.
 *
 * @module
 */

import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import type {
  Manifest, WorkIndex, DecisionsIndex, ReleasesIndex,
  ContextDocument, WorkItem, DecisionRecord, ReleaseRecord,
  LatestSnapshot, HistorySnapshot,
} from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { workIndexSchema, decisionsIndexSchema, releasesIndexSchema } from '../schemas/indexes.js';
import {
  specFrontMatterSchema, planFrontMatterSchema, todoFrontMatterSchema,
  decisionFrontMatterSchema, releaseFrontMatterSchema,
} from '../schemas/objects.js';
import { latestSnapshotSchema, historySnapshotSchema } from '../schemas/snapshots.js';
import { readJson, readMarkdown, fileExists } from '../core/reader.js';
import { ItemNotFoundError } from '../core/errors.js';
import {
  SDLC_DIR, MANIFEST_FILE, INDEX_DIR, WORK_INDEX_FILE,
  DECISIONS_INDEX_FILE, RELEASES_INDEX_FILE, CONTEXT_DIR,
  WORK_DIR, ACTIVE_DIR, ARCHIVE_DIR, DECISIONS_DIR, RELEASES_DIR,
  SNAPSHOTS_DIR, HISTORY_DIR, LATEST_SNAPSHOT_FILE, SPEC_FILE, BRIEF_FILE, PLAN_FILE, TODO_FILE,
} from '../core/constants.js';

export async function readManifest(projectRoot: string): Promise<Manifest> {
  return readJson(join(projectRoot, SDLC_DIR, MANIFEST_FILE), manifestSchema);
}

export async function readWorkIndex(projectRoot: string): Promise<WorkIndex> {
  return readJson(join(projectRoot, SDLC_DIR, INDEX_DIR, WORK_INDEX_FILE), workIndexSchema);
}

export async function readDecisionsIndex(projectRoot: string): Promise<DecisionsIndex> {
  return readJson(join(projectRoot, SDLC_DIR, INDEX_DIR, DECISIONS_INDEX_FILE), decisionsIndexSchema);
}

export async function readReleasesIndex(projectRoot: string): Promise<ReleasesIndex> {
  return readJson(join(projectRoot, SDLC_DIR, INDEX_DIR, RELEASES_INDEX_FILE), releasesIndexSchema);
}

export async function readContextDoc(projectRoot: string, name: string): Promise<ContextDocument> {
  const filePath = join(projectRoot, SDLC_DIR, CONTEXT_DIR, `${name}.md`);
  const doc = await readMarkdown(filePath);
  return { name, document: doc };
}

export async function readWorkItem(projectRoot: string, id: string): Promise<WorkItem> {
  const sdlcDir = join(projectRoot, SDLC_DIR);

  // Check active first — try spec.md (new) then brief.md (legacy)
  let baseDir = join(sdlcDir, WORK_DIR, ACTIVE_DIR, id);
  let specPath = join(baseDir, SPEC_FILE);
  let planPath = join(baseDir, PLAN_FILE);
  let todoPath = join(baseDir, TODO_FILE);

  // Fallback to brief.md for backward compatibility
  if (!(await fileExists(specPath))) {
    specPath = join(baseDir, BRIEF_FILE);
  }

  if (!(await fileExists(specPath))) {
    // Search archive
    const archiveDir = join(sdlcDir, WORK_DIR, ARCHIVE_DIR);
    let found = false;
    try {
      const months = await readdir(archiveDir);
      for (const month of months) {
        // Try spec.md first, then brief.md
        let candidate = join(archiveDir, month, id, SPEC_FILE);
        if (!(await fileExists(candidate))) {
          candidate = join(archiveDir, month, id, BRIEF_FILE);
        }
        if (await fileExists(candidate)) {
          baseDir = join(archiveDir, month, id);
          specPath = candidate;
          planPath = join(baseDir, PLAN_FILE);
          todoPath = join(baseDir, TODO_FILE);
          found = true;
          break;
        }
      }
    } catch { /* archive may not exist */ }

    if (!found) {
      throw new ItemNotFoundError('Work item', id);
    }
  }

  const spec = await readMarkdown(specPath, specFrontMatterSchema);
  let plan = null;
  if (await fileExists(planPath)) {
    plan = await readMarkdown(planPath, planFrontMatterSchema);
  }
  let todo = null;
  if (await fileExists(todoPath)) {
    todo = await readMarkdown(todoPath, todoFrontMatterSchema);
  }

  return { id, spec, plan, todo, brief: spec };
}

export async function readDecision(projectRoot: string, id: string): Promise<DecisionRecord> {
  const sdlcDir = join(projectRoot, SDLC_DIR);
  const decisionsDir = join(sdlcDir, DECISIONS_DIR);

  // Find the file matching the ID
  try {
    const files = await readdir(decisionsDir);
    const file = files.find((f) => f.startsWith(`${id}-`));
    if (file) {
      const doc = await readMarkdown(join(decisionsDir, file), decisionFrontMatterSchema);
      const slug = file.replace(/^\d{3}-/, '').replace(/\.md$/, '');
      return { id, slug, document: doc };
    }
  } catch { /* directory may not exist */ }

  throw new ItemNotFoundError('Decision', id);
}

export async function readRelease(projectRoot: string, version: string): Promise<ReleaseRecord> {
  const filePath = join(projectRoot, SDLC_DIR, RELEASES_DIR, `v${version}.md`);
  if (!(await fileExists(filePath))) {
    throw new ItemNotFoundError('Release', version);
  }
  const doc = await readMarkdown(filePath, releaseFrontMatterSchema);
  return { version, document: doc };
}

export async function readLatestSnapshot(projectRoot: string): Promise<LatestSnapshot> {
  return readJson(
    join(projectRoot, SDLC_DIR, SNAPSHOTS_DIR, LATEST_SNAPSHOT_FILE),
    latestSnapshotSchema,
  );
}

export async function readHistoricalSnapshot(projectRoot: string, month: string): Promise<HistorySnapshot> {
  return readJson(
    join(projectRoot, SDLC_DIR, SNAPSHOTS_DIR, HISTORY_DIR, `${month}.json`),
    historySnapshotSchema,
  );
}
