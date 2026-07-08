/**
 * Module detection for monorepo projects per §8.3.1.
 *
 * Detects workspace directories and classifies each as a module.
 *
 * @module
 */

import { join } from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { DetectedModule } from './heuristics.js';
import { MONOREPO_INDICATORS } from './heuristics.js';
import { detectStack } from './detect-stack.js';
import { slugify } from '../utils/slugify.js';

/**
 * Detect if the project is a monorepo and find its modules.
 * Returns null if not a monorepo, or an array of detected modules.
 */
export async function detectModules(projectRoot: string): Promise<DetectedModule[] | null> {
  // Step 1: Detect monorepo root indicators
  const workspacePaths = await detectWorkspacePaths(projectRoot);
  if (!workspacePaths || workspacePaths.length === 0) return null;

  // Step 2: Resolve glob patterns to actual directories
  const resolvedDirs = await resolveWorkspaceDirs(projectRoot, workspacePaths);

  // Step 3: Detect stack for each workspace directory
  const modules: DetectedModule[] = [];
  for (const dir of resolvedDirs) {
    const relativePath = dir.replace(projectRoot + '/', '');
    const stack = await detectStack(dir);
    if (!stack) continue;

    const dirName = dir.split('/').pop() ?? 'unknown';
    const id = slugify(dirName, 64) || dirName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    modules.push({
      id: id.length >= 2 ? id : `mod-${id}`,
      path: relativePath,
      type: stack.framework ? inferModuleType(stack) : 'other',
      stack,
      confidence: stack.confidence,
    });
  }

  return modules.length > 0 ? modules : null;
}

// ─── Workspace Detection ────────────────────────────────────────────────────

async function detectWorkspacePaths(projectRoot: string): Promise<string[] | null> {
  // Check package.json workspaces
  try {
    const raw = await readFile(join(projectRoot, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    const workspaces = pkg['workspaces'];
    if (Array.isArray(workspaces)) {
      return workspaces as string[];
    }
    if (workspaces && typeof workspaces === 'object' && 'packages' in workspaces) {
      return (workspaces as { packages: string[] }).packages;
    }
  } catch { /* no package.json */ }

  // Check pnpm-workspace.yaml
  try {
    const raw = await readFile(join(projectRoot, 'pnpm-workspace.yaml'), 'utf-8');
    const parsed = parseYaml(raw) as { packages?: string[] };
    if (parsed?.packages) return parsed.packages;
  } catch { /* no pnpm-workspace.yaml */ }

  // Check for other monorepo indicators (nx.json, turbo.json, lerna.json)
  for (const indicator of MONOREPO_INDICATORS) {
    try {
      const raw = await readFile(join(projectRoot, indicator), 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      // lerna.json has "packages"
      if ('packages' in parsed && Array.isArray(parsed['packages'])) {
        return parsed['packages'] as string[];
      }
    } catch { /* not found */ }
  }

  return null;
}

async function resolveWorkspaceDirs(
  projectRoot: string,
  patterns: string[],
): Promise<string[]> {
  const dirs: string[] = [];

  for (const pattern of patterns) {
    // Handle simple glob: "packages/*" → list dirs in packages/
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      const baseDir = join(projectRoot, base);
      try {
        const entries = await readdir(baseDir);
        for (const entry of entries) {
          const fullPath = join(baseDir, entry);
          try {
            const s = await stat(fullPath);
            if (s.isDirectory()) {
              dirs.push(fullPath);
            }
          } catch { /* skip */ }
        }
      } catch { /* base dir doesn't exist */ }
    } else if (pattern.endsWith('/**')) {
      // Same as /* for our purposes
      const base = pattern.slice(0, -3);
      const baseDir = join(projectRoot, base);
      try {
        const entries = await readdir(baseDir);
        for (const entry of entries) {
          const fullPath = join(baseDir, entry);
          try {
            const s = await stat(fullPath);
            if (s.isDirectory()) {
              dirs.push(fullPath);
            }
          } catch { /* skip */ }
        }
      } catch { /* base dir doesn't exist */ }
    } else {
      // Direct path
      const fullPath = join(projectRoot, pattern);
      try {
        const s = await stat(fullPath);
        if (s.isDirectory()) {
          dirs.push(fullPath);
        }
      } catch { /* doesn't exist */ }
    }
  }

  return dirs;
}

function inferModuleType(stack: { language: string; framework?: string }): string {
  if (!stack.framework) return 'other';

  const frontendFrameworks = ['react', 'vue', 'svelte', 'angular'];
  const backendFrameworks = ['express', 'fastify', 'hono', 'koa', 'nestjs', 'aspnet', 'fastapi', 'django', 'flask', 'gin', 'fiber', 'echo', 'actix', 'axum', 'rocket', 'spring-boot'];
  const fullstackFrameworks = ['next', 'nuxt', 'sveltekit'];

  if (fullstackFrameworks.includes(stack.framework)) return 'fullstack';
  if (frontendFrameworks.includes(stack.framework)) return 'frontend';
  if (backendFrameworks.includes(stack.framework)) return 'backend';

  return 'other';
}
