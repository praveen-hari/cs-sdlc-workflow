/**
 * Greenfield init operation per §7.2.1.
 *
 * Creates a new .sdlc/ directory with manifest.json,
 * context/architecture.md, and context/conventions.md.
 *
 * @module
 */

import { join } from 'node:path';
import { mkdir, stat, readFile } from 'node:fs/promises';
import { manifestSchema } from '../schemas/manifest.js';
import type { Manifest, Stack } from '../types/index.js';
import { writeJsonAtomic, writeMarkdown } from '../core/writer.js';
import { serializeFrontMatter } from '../core/frontmatter.js';
import { AlreadyExistsError } from '../core/errors.js';
import { nowISO } from '../utils/dates.js';
import {
  SDLC_DIR,
  MANIFEST_FILE,
  CONTEXT_DIR,
  WORK_DIR,
  ACTIVE_DIR,
  INDEX_DIR,
  ARCHITECTURE_FILE,
  CONVENTIONS_FILE,
  MAGIC,
  SPEC_VERSION,
  WORK_INDEX_FILE,
  DECISIONS_INDEX_FILE,
  RELEASES_INDEX_FILE,
} from '../core/constants.js';

export interface InitOptions {
  /** Absolute path to the project root. */
  projectRoot: string;
  /** Project name. If omitted, detected from package.json or directory name. */
  name?: string;
  /** One-line project description. */
  description?: string;
  /** Technology stack. */
  stack?: Stack;
}

/**
 * Initialize a new .sdlc/ directory (greenfield).
 *
 * @throws AlreadyExistsError if .sdlc/ already exists
 */
export async function initSdlc(options: InitOptions): Promise<Manifest> {
  const sdlcDir = join(options.projectRoot, SDLC_DIR);

  // Check if .sdlc/ already exists
  try {
    const s = await stat(sdlcDir);
    if (s.isDirectory()) {
      throw new AlreadyExistsError(sdlcDir);
    }
  } catch (err) {
    if (err instanceof AlreadyExistsError) throw err;
    // ENOENT is expected — directory doesn't exist yet
  }

  // Detect project name if not provided
  const name = options.name ?? (await detectProjectName(options.projectRoot));

  const manifest: Manifest = {
    specVersion: SPEC_VERSION,
    magic: MAGIC,
    project: {
      name,
      createdAt: nowISO(),
      mode: 'greenfield',
      ...(options.description && { description: options.description }),
      ...(options.stack && { stack: options.stack }),
    },
    counters: {
      activeWork: 0,
      totalCompleted: 0,
      decisions: 0,
      releases: 0,
    },
  };

  // Validate before writing
  const validated = manifestSchema.parse(manifest);

  // Create directory structure
  await mkdir(sdlcDir, { recursive: true });
  await mkdir(join(sdlcDir, CONTEXT_DIR), { recursive: true });
  await mkdir(join(sdlcDir, WORK_DIR, ACTIVE_DIR), { recursive: true });
  await mkdir(join(sdlcDir, INDEX_DIR), { recursive: true });

  // Write manifest
  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), validated);

  // Write empty indexes
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), { active: [], recent: [] });
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, DECISIONS_INDEX_FILE), { entries: [] });
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, RELEASES_INDEX_FILE), { entries: [] });

  // Write context templates
  await writeMarkdown(
    join(sdlcDir, CONTEXT_DIR, ARCHITECTURE_FILE),
    createArchitectureTemplate(name),
  );
  await writeMarkdown(
    join(sdlcDir, CONTEXT_DIR, CONVENTIONS_FILE),
    createConventionsTemplate(),
  );

  return validated;
}

// ─── Templates ──────────────────────────────────────────────────────────────

function createArchitectureTemplate(projectName: string): string {
  return serializeFrontMatter(
    { version: 1, updatedAt: nowISO().slice(0, 10) },
    `# ${projectName} — Architecture

## System Overview

<!-- Describe the high-level architecture of the system. -->

## Data Flow

<!-- How data moves through the system. -->

## Key Design Decisions

<!-- Link to relevant ADRs in decisions/. -->
`,
  );
}

function createConventionsTemplate(): string {
  return serializeFrontMatter(
    { version: 1, updatedAt: nowISO().slice(0, 10) },
    `# Code Conventions

## Naming

<!-- File, variable, function, component naming rules. -->

## Patterns

<!-- Architectural patterns to follow. -->

## Testing

<!-- Testing conventions: framework, file location, naming. -->

## Error Handling

<!-- How errors should be handled. -->
`,
  );
}

// ─── Detection ──────────────────────────────────────────────────────────────

async function detectProjectName(projectRoot: string): Promise<string> {
  // Try package.json
  try {
    const raw = await readFile(join(projectRoot, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as { name?: string };
    if (pkg.name && typeof pkg.name === 'string') {
      // Strip scope prefix for display name
      return pkg.name.replace(/^@[^/]+\//, '');
    }
  } catch {
    // No package.json or invalid
  }

  // Fall back to directory name
  const parts = projectRoot.split('/');
  return parts[parts.length - 1] ?? 'my-project';
}
