/**
 * Atomic file writer per §2.6.1.
 *
 * Write-to-temp-then-rename pattern prevents corruption
 * if the process is interrupted during a write.
 *
 * @module
 */

import { writeFile, rename, unlink, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { MAX_MANIFEST_SIZE, MANIFEST_FILE } from './constants.js';

/**
 * Atomically write a JSON object to a file.
 *
 * 1. Serialize with 2-space indentation (§2.5.3) + trailing newline
 * 2. Write to `{path}.tmp`
 * 3. Rename to `{path}`
 *
 * Warns (console.warn) if the file is manifest.json and exceeds 2 KB.
 */
export async function writeJsonAtomic(
  filePath: string,
  data: unknown,
): Promise<void> {
  const json = JSON.stringify(data, null, 2) + '\n';
  const bytes = Buffer.byteLength(json, 'utf-8');

  // Size warning for manifest (§2.2.2)
  if (filePath.endsWith(MANIFEST_FILE) && bytes > MAX_MANIFEST_SIZE) {
    console.warn(
      `[cs-sdlc] Warning: manifest.json is ${bytes} bytes, exceeding the ${MAX_MANIFEST_SIZE} byte limit (§2.2.2)`,
    );
  }

  // Ensure parent directory exists
  await mkdir(dirname(filePath), { recursive: true });

  const tmpPath = filePath + '.tmp';
  try {
    await writeFile(tmpPath, json, 'utf-8');
    await rename(tmpPath, filePath);
  } catch (error) {
    // Clean up temp file on failure
    try {
      await unlink(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Write a Markdown string to a file (non-atomic, for content files).
 * Creates parent directories if needed.
 */
export async function writeMarkdown(
  filePath: string,
  content: string,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf-8');
}
