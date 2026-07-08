/**
 * .sdlc/ directory discovery per §2.1.2.
 *
 * Walk upward from the starting path to the filesystem root,
 * stopping at the first `.sdlc/` directory found.
 * Same algorithm as Git uses to find `.git/`.
 *
 * @module
 */

import { stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { SDLC_DIR } from './constants.js';
import { NotFoundError } from './errors.js';

/**
 * Discover the `.sdlc/` directory by walking upward from `startPath`.
 *
 * @param startPath - Any path within the project (file or directory)
 * @returns The absolute path to the `.sdlc/` directory
 * @throws NotFoundError if no `.sdlc/` directory is found
 */
export async function discoverSdlc(startPath: string): Promise<string> {
  let current = resolve(startPath);

  // If startPath is a file, start from its parent directory
  try {
    const s = await stat(current);
    if (!s.isDirectory()) {
      current = dirname(current);
    }
  } catch {
    // Path doesn't exist — start from its parent
    current = dirname(current);
  }

  // Walk upward
  while (true) {
    const candidate = join(current, SDLC_DIR);
    try {
      const s = await stat(candidate);
      if (s.isDirectory()) {
        return candidate;
      }
    } catch {
      // Not found at this level, continue upward
    }

    const parent = dirname(current);
    if (parent === current) {
      // Reached filesystem root
      throw new NotFoundError(startPath);
    }
    current = parent;
  }
}

/**
 * Get the project root from a `.sdlc/` path.
 * Simply returns the parent directory of `.sdlc/`.
 */
export function projectRootFromSdlc(sdlcPath: string): string {
  return dirname(sdlcPath);
}
