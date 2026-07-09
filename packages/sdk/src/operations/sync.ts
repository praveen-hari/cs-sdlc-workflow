/**
 * Sync and consistency operations per §7.7.
 *
 * - rebuildIndexes: scan filesystem, rebuild all index files
 * - recalculateCounters: derive counters from indexes
 * - validateConsistency: check all invariants, return report
 *
 * @module
 */

import { join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import type { Manifest, WorkIndex, DecisionsIndex, ReleasesIndex, ConsistencyReport, ConsistencyIssue } from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { workIndexSchema } from '../schemas/indexes.js';
import { decisionsIndexSchema } from '../schemas/indexes.js';
import { releasesIndexSchema } from '../schemas/indexes.js';
import { specFrontMatterSchema, decisionFrontMatterSchema, releaseFrontMatterSchema } from '../schemas/objects.js';
import { readJson, readMarkdown, fileExists } from '../core/reader.js';
import { writeJsonAtomic } from '../core/writer.js';
import {
  SDLC_DIR, MANIFEST_FILE, INDEX_DIR, WORK_INDEX_FILE, DECISIONS_INDEX_FILE,
  RELEASES_INDEX_FILE, WORK_DIR, ACTIVE_DIR, ARCHIVE_DIR, DECISIONS_DIR,
  RELEASES_DIR, SPEC_FILE, BRIEF_FILE, MAX_RECENT_ITEMS,
} from '../core/constants.js';

/**
 * Rebuild all index files from the filesystem (§4.5.2).
 */
export async function rebuildIndexes(projectRoot: string): Promise<void> {
  const sdlcDir = join(projectRoot, SDLC_DIR);

  // Rebuild work index
  const workIndex = await buildWorkIndex(sdlcDir);
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndex);

  // Rebuild decisions index
  const decisionsIndex = await buildDecisionsIndex(sdlcDir);
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, DECISIONS_INDEX_FILE), decisionsIndex);

  // Rebuild releases index
  const releasesIndex = await buildReleasesIndex(sdlcDir);
  await writeJsonAtomic(join(sdlcDir, INDEX_DIR, RELEASES_INDEX_FILE), releasesIndex);
}

/**
 * Recalculate manifest counters from indexes (§7.7.1).
 * Note: totalCompleted is cumulative and cannot be derived — it is preserved.
 */
export async function recalculateCounters(projectRoot: string): Promise<Manifest> {
  const sdlcDir = join(projectRoot, SDLC_DIR);
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);

  let activeWork = 0;
  let decisions = 0;
  let releases = 0;

  try {
    const workIndex = await readJson(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndexSchema);
    activeWork = workIndex.active.length;
  } catch { /* index may not exist */ }

  try {
    const decisionsIndex = await readJson(join(sdlcDir, INDEX_DIR, DECISIONS_INDEX_FILE), decisionsIndexSchema);
    decisions = decisionsIndex.entries.length;
  } catch { /* index may not exist */ }

  try {
    const releasesIndex = await readJson(join(sdlcDir, INDEX_DIR, RELEASES_INDEX_FILE), releasesIndexSchema);
    releases = releasesIndex.entries.length;
  } catch { /* index may not exist */ }

  manifest.counters.activeWork = activeWork;
  manifest.counters.decisions = decisions;
  manifest.counters.releases = releases;
  // totalCompleted is preserved (cumulative, not derivable)

  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);
  return manifest;
}

/**
 * Validate all consistency invariants (§7.7).
 * Returns a report with pass/fail per invariant.
 */
export async function validateConsistency(projectRoot: string): Promise<ConsistencyReport> {
  const sdlcDir = join(projectRoot, SDLC_DIR);
  const issues: ConsistencyIssue[] = [];

  // Read manifest
  let manifest: Manifest;
  try {
    manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);
  } catch (err) {
    return {
      valid: false,
      issues: [{ type: 'error', code: 'MANIFEST_INVALID', message: `Cannot read manifest: ${err}` }],
    };
  }

  // Check work index consistency
  try {
    const workIndex = await readJson(join(sdlcDir, INDEX_DIR, WORK_INDEX_FILE), workIndexSchema);

    // §7.7.1: manifest.counters.activeWork == len(active)
    if (manifest.counters.activeWork !== workIndex.active.length) {
      issues.push({
        type: 'error',
        code: 'COUNTER_MISMATCH_ACTIVE_WORK',
        message: `manifest.counters.activeWork (${manifest.counters.activeWork}) != work index active count (${workIndex.active.length})`,
      });
    }

    // §7.7.2: every active entry has a corresponding directory
    for (const entry of workIndex.active) {
      const dir = join(sdlcDir, entry.path);
      if (!(await dirExists(dir))) {
        issues.push({
          type: 'error',
          code: 'MISSING_WORK_DIR',
          message: `Work index references ${entry.path} but directory does not exist`,
        });
      }
    }
  } catch {
    // Work index doesn't exist — check if counters expect it
    if (manifest.counters.activeWork > 0) {
      issues.push({
        type: 'error',
        code: 'MISSING_WORK_INDEX',
        message: `manifest.counters.activeWork is ${manifest.counters.activeWork} but work index is missing`,
      });
    }
  }

  // Check decisions index consistency
  try {
    const decisionsIndex = await readJson(join(sdlcDir, INDEX_DIR, DECISIONS_INDEX_FILE), decisionsIndexSchema);

    if (manifest.counters.decisions !== decisionsIndex.entries.length) {
      issues.push({
        type: 'error',
        code: 'COUNTER_MISMATCH_DECISIONS',
        message: `manifest.counters.decisions (${manifest.counters.decisions}) != decisions index count (${decisionsIndex.entries.length})`,
      });
    }

    for (const entry of decisionsIndex.entries) {
      if (!(await fileExists(join(sdlcDir, entry.path)))) {
        issues.push({
          type: 'error',
          code: 'MISSING_DECISION_FILE',
          message: `Decisions index references ${entry.path} but file does not exist`,
        });
      }
    }
  } catch {
    if (manifest.counters.decisions > 0) {
      issues.push({
        type: 'error',
        code: 'MISSING_DECISIONS_INDEX',
        message: `manifest.counters.decisions is ${manifest.counters.decisions} but decisions index is missing`,
      });
    }
  }

  // Check releases index consistency
  try {
    const releasesIndex = await readJson(join(sdlcDir, INDEX_DIR, RELEASES_INDEX_FILE), releasesIndexSchema);

    const releaseCount = manifest.counters.releases ?? 0;
    if (releaseCount !== releasesIndex.entries.length) {
      issues.push({
        type: 'error',
        code: 'COUNTER_MISMATCH_RELEASES',
        message: `manifest.counters.releases (${releaseCount}) != releases index count (${releasesIndex.entries.length})`,
      });
    }

    for (const entry of releasesIndex.entries) {
      if (!(await fileExists(join(sdlcDir, entry.path)))) {
        issues.push({
          type: 'error',
          code: 'MISSING_RELEASE_FILE',
          message: `Releases index references ${entry.path} but file does not exist`,
        });
      }
    }
  } catch {
    const releaseCount = manifest.counters.releases ?? 0;
    if (releaseCount > 0) {
      issues.push({
        type: 'error',
        code: 'MISSING_RELEASES_INDEX',
        message: `manifest.counters.releases is ${releaseCount} but releases index is missing`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

// ─── Index Builders ─────────────────────────────────────────────────────────

async function buildWorkIndex(sdlcDir: string): Promise<WorkIndex> {
  const active: WorkIndex['active'] = [];
  const recent: WorkIndex['recent'] = [];

  // Scan active work items
  const activeDir = join(sdlcDir, WORK_DIR, ACTIVE_DIR);
  try {
    const dirs = await readdir(activeDir);
    for (const dir of dirs) {
      try {
        // Try spec.md (new) then brief.md (legacy)
        let specPath = join(activeDir, dir, SPEC_FILE);
        if (!(await fileExists(specPath))) {
          specPath = join(activeDir, dir, BRIEF_FILE);
        }
        const brief = await readMarkdown(
          specPath,
          specFrontMatterSchema,
        );
        if (brief.frontMatter) {
          active.push({
            id: dir,
            title: brief.frontMatter.title,
            type: brief.frontMatter.type,
            createdAt: brief.frontMatter.createdAt,
            path: `work/active/${dir}`,
            ...(brief.frontMatter.priority && { priority: brief.frontMatter.priority }),
            ...(brief.frontMatter.modules && { modules: brief.frontMatter.modules }),
          });
        }
      } catch { /* skip invalid entries */ }
    }
  } catch { /* directory may not exist */ }

  // Scan archive for recent items (most recent 10)
  const archiveDir = join(sdlcDir, WORK_DIR, ARCHIVE_DIR);
  try {
    const months = (await readdir(archiveDir)).sort().reverse();
    for (const month of months) {
      if (recent.length >= MAX_RECENT_ITEMS) break;
      try {
        const items = await readdir(join(archiveDir, month));
        for (const item of items) {
          if (recent.length >= MAX_RECENT_ITEMS) break;
          try {
            // Try spec.md (new) then brief.md (legacy)
            let archiveSpecPath = join(archiveDir, month, item, SPEC_FILE);
            if (!(await fileExists(archiveSpecPath))) {
              archiveSpecPath = join(archiveDir, month, item, BRIEF_FILE);
            }
            const brief = await readMarkdown(
              archiveSpecPath,
              specFrontMatterSchema,
            );
            if (brief.frontMatter?.completedAt) {
              recent.push({
                id: item,
                title: brief.frontMatter.title,
                type: brief.frontMatter.type,
                completedAt: brief.frontMatter.completedAt,
                path: `work/archive/${month}/${item}`,
              });
            }
          } catch { /* skip invalid */ }
        }
      } catch { /* skip invalid month dirs */ }
    }
  } catch { /* archive may not exist */ }

  // Sort recent by completedAt descending
  recent.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return { active, recent: recent.slice(0, MAX_RECENT_ITEMS) };
}

async function buildDecisionsIndex(sdlcDir: string): Promise<DecisionsIndex> {
  const entries: DecisionsIndex['entries'] = [];
  const decisionsDir = join(sdlcDir, DECISIONS_DIR);

  try {
    const files = (await readdir(decisionsDir)).filter((f) => f.endsWith('.md')).sort();
    for (const file of files) {
      try {
        const doc = await readMarkdown(join(decisionsDir, file), decisionFrontMatterSchema);
        if (doc.frontMatter) {
          const slug = file.replace(/^\d{3}-/, '').replace(/\.md$/, '');
          entries.push({
            id: doc.frontMatter.id,
            slug,
            title: doc.frontMatter.title,
            status: doc.frontMatter.status,
            date: doc.frontMatter.date,
            path: `decisions/${file}`,
          });
        }
      } catch { /* skip invalid */ }
    }
  } catch { /* directory may not exist */ }

  // Sort by ID ascending (§4.3.4)
  entries.sort((a, b) => a.id.localeCompare(b.id));
  return { entries };
}

async function buildReleasesIndex(sdlcDir: string): Promise<ReleasesIndex> {
  const entries: ReleasesIndex['entries'] = [];
  const releasesDir = join(sdlcDir, RELEASES_DIR);

  try {
    const files = (await readdir(releasesDir)).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      try {
        const doc = await readMarkdown(join(releasesDir, file), releaseFrontMatterSchema);
        if (doc.frontMatter) {
          entries.push({
            version: doc.frontMatter.version,
            date: doc.frontMatter.date,
            path: `releases/${file}`,
            ...(doc.frontMatter.title && { title: doc.frontMatter.title }),
          });
        }
      } catch { /* skip invalid */ }
    }
  } catch { /* directory may not exist */ }

  // Sort by SemVer ascending (§4.4.3)
  const { compareSemVer } = await import('../utils/semver.js');
  entries.sort((a, b) => compareSemVer(a.version, b.version));
  return { entries };
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}
