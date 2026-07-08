/**
 * Brownfield init operation per §7.2.2.
 *
 * Scans an existing project to detect stack, modules, and artifacts,
 * then creates a pre-populated .sdlc/ directory.
 *
 * @module
 */

import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import type { Manifest, ModuleEntry } from '../types/index.js';
import type { DetectedStack } from '../scanner/heuristics.js';
import { initSdlc } from './init.js';
import { addModule } from './phase.js';
import { detectStack, detectArtifacts } from '../scanner/detect-stack.js';
import { detectModules } from '../scanner/detect-modules.js';

export interface ScanResult {
  manifest: Manifest;
  detectedStack: DetectedStack | null;
  detectedModules: number;
  detectedArtifacts: {
    hasCI: boolean;
    hasTesting: boolean;
    hasDocs: boolean;
    hasDesignSystem: boolean;
  };
}

/**
 * Initialize .sdlc/ by scanning an existing project (brownfield).
 */
export async function initSdlcFromScan(projectRoot: string): Promise<ScanResult> {
  // Detect project name
  let name: string | undefined;
  try {
    const raw = await readFile(join(projectRoot, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as { name?: string };
    if (pkg.name) name = pkg.name.replace(/^@[^/]+\//, '');
  } catch { /* ignore */ }

  // Detect stack
  const detectedStack = await detectStack(projectRoot);
  const stack = detectedStack
    ? {
        language: detectedStack.language,
        ...(detectedStack.framework && { framework: detectedStack.framework }),
        ...(detectedStack.runtime && { runtime: detectedStack.runtime }),
        ...(detectedStack.database && { database: detectedStack.database }),
        ...(detectedStack.testing && { testing: detectedStack.testing }),
        ...(detectedStack.styling && { styling: detectedStack.styling }),
      }
    : undefined;

  // Detect artifacts
  const artifacts = await detectArtifacts(projectRoot);

  // Detect modules (monorepo)
  const modules = await detectModules(projectRoot);

  // Create .sdlc/ with greenfield init (sets mode to greenfield, we'll override)
  let manifest = await initSdlc({
    projectRoot,
    name,
    stack: modules ? undefined : stack, // Only set stack on project if single-module
  });

  // Override mode to brownfield
  const { readJson } = await import('../core/reader.js');
  const { writeJsonAtomic } = await import('../core/writer.js');
  const { manifestSchema } = await import('../schemas/manifest.js');
  const { SDLC_DIR, MANIFEST_FILE } = await import('../core/constants.js');

  manifest = await readJson(join(projectRoot, SDLC_DIR, MANIFEST_FILE), manifestSchema);
  (manifest.project as Record<string, unknown>).mode = 'brownfield';
  await writeJsonAtomic(join(projectRoot, SDLC_DIR, MANIFEST_FILE), manifest);

  // Add detected modules
  let detectedModuleCount = 0;
  if (modules) {
    for (const mod of modules) {
      const entry: ModuleEntry = {
        path: mod.path,
        type: mod.type,
        stack: {
          language: mod.stack.language,
          ...(mod.stack.framework && { framework: mod.stack.framework }),
          ...(mod.stack.runtime && { runtime: mod.stack.runtime }),
          ...(mod.stack.database && { database: mod.stack.database }),
          ...(mod.stack.testing && { testing: mod.stack.testing }),
          ...(mod.stack.styling && { styling: mod.stack.styling }),
        },
      };
      try {
        manifest = await addModule(projectRoot, mod.id, entry);
        detectedModuleCount++;
      } catch {
        // Skip modules with invalid IDs
      }
    }
  }

  return {
    manifest,
    detectedStack: detectedStack ?? null,
    detectedModules: detectedModuleCount,
    detectedArtifacts: artifacts,
  };
}
