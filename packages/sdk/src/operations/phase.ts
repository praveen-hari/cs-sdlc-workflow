/**
 * Phase update and module lifecycle operations per §3.6 and §8.6.
 *
 * @module
 */

import { join } from 'node:path';
import type { Manifest, ModuleEntry } from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { workIndexSchema } from '../schemas/indexes.js';
import { readJson } from '../core/reader.js';
import { writeJsonAtomic } from '../core/writer.js';
import { validateIdentifier } from '../core/identifiers.js';
import { ItemNotFoundError } from '../core/errors.js';
import {
  SDLC_DIR, MANIFEST_FILE, INDEX_DIR, WORK_INDEX_FILE,
} from '../core/constants.js';

/**
 * Update the project phase (§3.6).
 */
export async function updatePhase(
  projectRoot: string,
  phase: string,
): Promise<Manifest> {
  const sdlcDir = join(projectRoot, SDLC_DIR);
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);

  manifest.phase = phase;

  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);
  return manifest;
}

/**
 * Add a module to the manifest (§8.6.1).
 */
export async function addModule(
  projectRoot: string,
  id: string,
  entry: ModuleEntry,
): Promise<Manifest> {
  validateIdentifier(id);
  const sdlcDir = join(projectRoot, SDLC_DIR);
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);

  if (!manifest.modules) {
    manifest.modules = {};
  }
  manifest.modules[id] = entry;

  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);
  return manifest;
}

/**
 * Remove a module from the manifest (§8.6.2).
 * Does NOT modify archived work items (historical accuracy).
 */
export async function removeModule(
  projectRoot: string,
  id: string,
): Promise<Manifest> {
  const sdlcDir = join(projectRoot, SDLC_DIR);
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);

  if (!manifest.modules?.[id]) {
    throw new ItemNotFoundError('Module', id);
  }

  delete manifest.modules[id];

  // Remove empty modules object
  if (Object.keys(manifest.modules).length === 0) {
    delete manifest.modules;
  }

  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);
  return manifest;
}

/**
 * Rename a module (§8.6.3).
 * Updates manifest + active work index entries' modules arrays.
 * Does NOT modify archived work items.
 */
export async function renameModule(
  projectRoot: string,
  oldId: string,
  newId: string,
): Promise<Manifest> {
  validateIdentifier(newId);
  const sdlcDir = join(projectRoot, SDLC_DIR);
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);

  if (!manifest.modules?.[oldId]) {
    throw new ItemNotFoundError('Module', oldId);
  }

  // Move module entry
  const entry = manifest.modules[oldId]!;
  delete manifest.modules[oldId];
  manifest.modules[newId] = entry;

  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);

  // Update active work index entries
  try {
    const workIndex = await readJson(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndexSchema);
    let changed = false;
    for (const item of workIndex.active) {
      if (item.modules) {
        const idx = item.modules.indexOf(oldId);
        if (idx !== -1) {
          item.modules[idx] = newId;
          changed = true;
        }
      }
    }
    if (changed) {
      await writeJsonAtomic(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndex);
    }
  } catch {
    // Work index may not exist
  }

  return manifest;
}
