/**
 * Release creation per §7.6.
 *
 * @module
 */

import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import type { Manifest, ReleasesIndex } from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { releasesIndexSchema } from '../schemas/indexes.js';
import { readJson } from '../core/reader.js';
import { writeJsonAtomic, writeMarkdown } from '../core/writer.js';
import { serializeFrontMatter } from '../core/frontmatter.js';
import { todayDate } from '../utils/dates.js';
import { compareSemVer } from '../utils/semver.js';
import { SdlcError } from '../core/errors.js';
import {
  SDLC_DIR, MANIFEST_FILE, INDEX_DIR, RELEASES_INDEX_FILE, RELEASES_DIR,
} from '../core/constants.js';

export interface CreateReleaseOptions {
  /** Semantic version string (e.g., "1.0.0"). */
  version: string;
  /** Release title/codename. */
  title?: string;
  /** Highlights of this release. */
  highlights?: string;
  /** Features added. */
  features?: string;
  /** Bugs fixed. */
  bugFixes?: string;
  /** Breaking changes. */
  breakingChanges?: string;
}

export interface CreateReleaseResult {
  version: string;
  path: string;
  manifest: Manifest;
  releasesIndex: ReleasesIndex;
}

/**
 * Create a new release record (§7.6.1).
 */
export async function createRelease(
  projectRoot: string,
  options: CreateReleaseOptions,
): Promise<CreateReleaseResult> {
  const sdlcDir = join(projectRoot, SDLC_DIR);

  // Read current state
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);
  const releasesIndex = await readJson(
    join(sdlcDir, INDEX_DIR, RELEASES_INDEX_FILE),
    releasesIndexSchema,
  );

  // Check for duplicate version
  if (releasesIndex.entries.some((e) => e.version === options.version)) {
    throw new SdlcError(
      `Release ${options.version} already exists`,
      'DUPLICATE_RELEASE',
    );
  }

  const date = todayDate();
  const fileName = `v${options.version}.md`;
  const relativePath = `releases/${fileName}`;

  // Create releases directory
  await mkdir(join(sdlcDir, RELEASES_DIR), { recursive: true });

  // Write release file
  const frontMatter = {
    version: options.version,
    date,
    ...(options.title && { title: options.title }),
  };

  const body = `# v${options.version}${options.title ? ` — ${options.title}` : ''}

## Highlights

${options.highlights ?? '<!-- Key changes in this release. -->'}

## Features

${options.features ?? '<!-- New features added. -->'}

## Bug Fixes

${options.bugFixes ?? '<!-- Bugs fixed. -->'}

## Breaking Changes

${options.breakingChanges ?? '<!-- Changes that require user action. -->'}
`;

  await writeMarkdown(
    join(sdlcDir, RELEASES_DIR, fileName),
    serializeFrontMatter(frontMatter, body),
  );

  // Update index (ordered by SemVer ascending per §4.4.3)
  releasesIndex.entries.push({
    version: options.version,
    date,
    path: relativePath,
    ...(options.title && { title: options.title }),
  });
  releasesIndex.entries.sort((a, b) => compareSemVer(a.version, b.version));

  // Update manifest counter
  manifest.counters.releases = releasesIndex.entries.length;

  // Write updated files
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, RELEASES_INDEX_FILE), releasesIndex);
  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);

  return { version: options.version, path: relativePath, manifest, releasesIndex };
}
