/**
 * Decision creation and superseding per §7.5.
 *
 * @module
 */

import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import type { Manifest, DecisionsIndex, DecisionFrontMatter } from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { decisionsIndexSchema } from '../schemas/indexes.js';
import { decisionFrontMatterSchema } from '../schemas/objects.js';
import { readJson, readMarkdown } from '../core/reader.js';
import { writeJsonAtomic, writeMarkdown } from '../core/writer.js';
import { serializeFrontMatter } from '../core/frontmatter.js';
import { nextDecisionId } from '../core/identifiers.js';
import { ItemNotFoundError } from '../core/errors.js';
import { slugify } from '../utils/slugify.js';
import { todayDate } from '../utils/dates.js';
import {
  SDLC_DIR, MANIFEST_FILE, INDEX_DIR, DECISIONS_INDEX_FILE, DECISIONS_DIR,
} from '../core/constants.js';

export interface CreateDecisionOptions {
  /** Decision title. */
  title: string;
  /** Decision context — what prompted this decision. */
  context?: string;
  /** What was decided. */
  decision?: string;
  /** Why this option was chosen. */
  rationale?: string;
  /** Status. Default: "accepted". */
  status?: string;
  /** Module IDs affected. */
  modules?: string[];
}

export interface CreateDecisionResult {
  id: string;
  slug: string;
  path: string;
  manifest: Manifest;
  decisionsIndex: DecisionsIndex;
}

/**
 * Create a new decision record (§7.5.1).
 */
export async function createDecision(
  projectRoot: string,
  options: CreateDecisionOptions,
): Promise<CreateDecisionResult> {
  const sdlcDir = join(projectRoot, SDLC_DIR);

  // Read current state
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);
  const decisionsIndex = await readJson(
    join(sdlcDir, INDEX_DIR, DECISIONS_INDEX_FILE),
    decisionsIndexSchema,
  );

  // Determine next ID
  const existingIds = decisionsIndex.entries.map((e) => e.id);
  const id = nextDecisionId(existingIds);
  const slug = slugify(options.title, 50);
  const fileName = `${id}-${slug}.md`;
  const relativePath = `decisions/${fileName}`;
  const date = todayDate();
  const status = options.status ?? 'accepted';

  // Create decisions directory
  await mkdir(join(sdlcDir, DECISIONS_DIR), { recursive: true });

  // Write decision file
  const frontMatter: DecisionFrontMatter = {
    id,
    title: options.title,
    status,
    date,
    ...(options.modules && { modules: options.modules }),
  };

  const body = `# ADR-${id}: ${options.title}

## Context

${options.context ?? '<!-- What situation prompted this decision. -->'}

## Decision

${options.decision ?? '<!-- What was decided. -->'}

## Rationale

${options.rationale ?? '<!-- Why this option was chosen over alternatives. -->'}

## Alternatives Considered

<!-- Other options that were evaluated. -->

## Consequences

<!-- What changes as a result of this decision. -->
`;

  await writeMarkdown(
    join(sdlcDir, DECISIONS_DIR, fileName),
    serializeFrontMatter(frontMatter as Record<string, unknown>, body),
  );

  // Update index (ordered by ID ascending per §4.3.4)
  decisionsIndex.entries.push({
    id,
    slug,
    title: options.title,
    status,
    date,
    path: relativePath,
  });
  decisionsIndex.entries.sort((a, b) => a.id.localeCompare(b.id));

  // Update manifest counter
  manifest.counters.decisions = decisionsIndex.entries.length;

  // Write updated files
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, DECISIONS_INDEX_FILE), decisionsIndex);
  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);

  return { id, slug, path: relativePath, manifest, decisionsIndex };
}

/**
 * Supersede an existing decision (§7.5.2).
 *
 * Creates a new decision with `supersedes` pointing to the old one,
 * and updates the old decision's status to "superseded".
 */
export async function supersedeDecision(
  projectRoot: string,
  oldId: string,
  options: CreateDecisionOptions,
): Promise<CreateDecisionResult> {
  const sdlcDir = join(projectRoot, SDLC_DIR);

  // Read current index to find the old decision
  const decisionsIndex = await readJson(
    join(sdlcDir, INDEX_DIR, DECISIONS_INDEX_FILE),
    decisionsIndexSchema,
  );

  const oldEntry = decisionsIndex.entries.find((e) => e.id === oldId);
  if (!oldEntry) {
    throw new ItemNotFoundError('Decision', oldId);
  }

  // Create the new decision first
  const result = await createDecision(projectRoot, options);

  // Now update the old decision's front matter
  const oldFilePath = join(sdlcDir, oldEntry.path);
  const oldDoc = await readMarkdown(oldFilePath, decisionFrontMatterSchema);
  const updatedOldFrontMatter = {
    ...oldDoc.frontMatter,
    status: 'superseded',
    supersededBy: result.id,
  };
  await writeMarkdown(
    oldFilePath,
    serializeFrontMatter(updatedOldFrontMatter as Record<string, unknown>, oldDoc.body),
  );

  // Update the new decision's front matter with supersedes
  const newFilePath = join(sdlcDir, result.path);
  const newDoc = await readMarkdown(newFilePath, decisionFrontMatterSchema);
  const updatedNewFrontMatter = {
    ...newDoc.frontMatter,
    supersedes: oldId,
  };
  await writeMarkdown(
    newFilePath,
    serializeFrontMatter(updatedNewFrontMatter as Record<string, unknown>, newDoc.body),
  );

  // Update old entry status in index
  const refreshedIndex = await readJson(
    join(sdlcDir, INDEX_DIR, DECISIONS_INDEX_FILE),
    decisionsIndexSchema,
  );
  const oldIndexEntry = refreshedIndex.entries.find((e) => e.id === oldId);
  if (oldIndexEntry) {
    oldIndexEntry.status = 'superseded';
  }
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, DECISIONS_INDEX_FILE), refreshedIndex);

  return { ...result, decisionsIndex: refreshedIndex };
}
