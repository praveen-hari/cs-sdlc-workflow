/**
 * Context document CRUD operations.
 *
 * Create and update context documents (architecture.md, conventions.md,
 * requirements.md, stack.md, or custom context docs).
 *
 * @module
 */

import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { readMarkdown, fileExists } from '../core/reader.js';
import { writeMarkdown } from '../core/writer.js';
import { serializeFrontMatter } from '../core/frontmatter.js';
import { AlreadyExistsError, ItemNotFoundError } from '../core/errors.js';
import { nowISO } from '../utils/dates.js';
import { SDLC_DIR, CONTEXT_DIR } from '../core/constants.js';

export interface CreateContextDocOptions {
  /** Absolute path to the project root. */
  projectRoot: string;
  /** Document name (without .md extension). E.g., 'architecture', 'conventions', 'requirements'. */
  name: string;
  /** Markdown body content. */
  body: string;
  /** Optional YAML front matter fields. `version` and `updatedAt` are auto-set if omitted. */
  frontMatter?: Record<string, unknown>;
  /** If true, overwrite an existing document. Default: false. */
  overwrite?: boolean;
}

export interface UpdateContextDocOptions {
  /** Absolute path to the project root. */
  projectRoot: string;
  /** Document name (without .md extension). */
  name: string;
  /** New markdown body content. If omitted, body is preserved. */
  body?: string;
  /** Front matter fields to merge. `updatedAt` is auto-set. Existing fields not in this object are preserved. */
  frontMatter?: Record<string, unknown>;
}

/**
 * Create a new context document.
 *
 * @throws AlreadyExistsError if the document exists and overwrite is false
 */
export async function createContextDoc(options: CreateContextDocOptions): Promise<void> {
  const contextDir = join(options.projectRoot, SDLC_DIR, CONTEXT_DIR);
  const filePath = join(contextDir, `${options.name}.md`);

  if (!options.overwrite && await fileExists(filePath)) {
    throw new AlreadyExistsError(filePath);
  }

  // Ensure context directory exists
  await mkdir(contextDir, { recursive: true });

  const frontMatter: Record<string, unknown> = {
    version: 1,
    updatedAt: nowISO().slice(0, 10),
    ...options.frontMatter,
  };

  const content = serializeFrontMatter(frontMatter, options.body);
  await writeMarkdown(filePath, content);
}

/**
 * Update an existing context document.
 *
 * Merges front matter fields and optionally replaces the body.
 * The `updatedAt` field is always refreshed.
 *
 * @throws ItemNotFoundError if the document does not exist
 */
export async function updateContextDoc(options: UpdateContextDocOptions): Promise<void> {
  const filePath = join(options.projectRoot, SDLC_DIR, CONTEXT_DIR, `${options.name}.md`);

  if (!(await fileExists(filePath))) {
    throw new ItemNotFoundError('Context document', options.name);
  }

  const existing = await readMarkdown(filePath);

  // Merge front matter: preserve existing, overlay new, always update timestamp
  const mergedFrontMatter: Record<string, unknown> = {
    ...(existing.frontMatter ?? {}),
    ...options.frontMatter,
    updatedAt: nowISO().slice(0, 10),
  };

  // Use new body if provided, otherwise keep existing
  const body = options.body ?? existing.body;

  const content = serializeFrontMatter(mergedFrontMatter, body);
  await writeMarkdown(filePath, content);
}
