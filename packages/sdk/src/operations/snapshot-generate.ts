/**
 * Snapshot generation per §6.4.
 *
 * Accepts pre-computed metrics, writes latest.json,
 * appends to monthly history, syncs health to manifest.
 *
 * @module
 */

import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import type { LatestSnapshot, HistorySnapshot } from '../types/index.js';
import { manifestSchema } from '../schemas/manifest.js';
import { historySnapshotSchema } from '../schemas/snapshots.js';
import { readJson } from '../core/reader.js';
import { writeJsonAtomic } from '../core/writer.js';
import { nowISO, currentMonth } from '../utils/dates.js';
import { MAX_HISTORY_ENTRIES_PER_MONTH } from '../core/constants.js';
import {
  SDLC_DIR, MANIFEST_FILE, SNAPSHOTS_DIR, HISTORY_DIR, LATEST_SNAPSHOT_FILE,
} from '../core/constants.js';

export interface SnapshotMetrics {
  /** Overall grade. */
  grade: string;
  /** Overall score (0-100). */
  score?: number;
  /** Test coverage percentage. */
  coverage?: number;
  /** Test results. */
  tests?: { total: number; passing: number; failing: number; skipped?: number };
  /** Security vulnerabilities count. */
  vulnerabilities?: number;
  /** Accessibility violations count. */
  accessibilityViolations?: number;
  /** Generator tool name. */
  generator?: string;
}

/**
 * Generate a quality snapshot (§6.4.2).
 *
 * 1. Build latest.json from metrics
 * 2. Write snapshots/latest.json
 * 3. Append summary to snapshots/history/{YYYY-MM}.json
 * 4. Sync manifest.json → health
 */
export async function generateSnapshot(
  projectRoot: string,
  metrics: SnapshotMetrics,
): Promise<LatestSnapshot> {
  const sdlcDir = join(projectRoot, SDLC_DIR);
  const generatedAt = nowISO();

  // Build latest snapshot
  const latest: LatestSnapshot = {
    generatedAt,
    ...(metrics.generator && { generator: metrics.generator }),
    overall: {
      grade: metrics.grade,
      ...(metrics.score !== undefined && { score: metrics.score }),
    },
    ...(metrics.coverage !== undefined && {
      coverage: { total: metrics.coverage },
    }),
    ...(metrics.tests && { tests: metrics.tests }),
    ...(metrics.vulnerabilities !== undefined && {
      security: { vulnerabilities: metrics.vulnerabilities },
    }),
    ...(metrics.accessibilityViolations !== undefined && {
      accessibility: { violations: metrics.accessibilityViolations },
    }),
  };

  // Write latest.json
  await mkdir(join(sdlcDir, SNAPSHOTS_DIR), { recursive: true });
  await writeJsonAtomic(join(sdlcDir, SNAPSHOTS_DIR, LATEST_SNAPSHOT_FILE), latest);

  // Append to monthly history
  const month = currentMonth();
  const historyDir = join(sdlcDir, SNAPSHOTS_DIR, HISTORY_DIR);
  await mkdir(historyDir, { recursive: true });
  const historyFile = join(historyDir, `${month}.json`);

  let history: HistorySnapshot;
  try {
    history = await readJson(historyFile, historySnapshotSchema);
  } catch {
    history = { month, snapshots: [] };
  }

  // Append summary entry
  history.snapshots.push({
    date: generatedAt.slice(0, 10),
    overall: latest.overall,
    ...(latest.coverage && { coverage: { total: latest.coverage.total } }),
    ...(latest.tests && {
      tests: { total: latest.tests.total, passing: latest.tests.passing, failing: latest.tests.failing },
    }),
    ...(latest.security && {
      security: { vulnerabilities: latest.security.vulnerabilities },
    }),
  });

  // Cap at MAX_HISTORY_ENTRIES_PER_MONTH (§6.3.3)
  if (history.snapshots.length > MAX_HISTORY_ENTRIES_PER_MONTH) {
    history.snapshots = history.snapshots.slice(-MAX_HISTORY_ENTRIES_PER_MONTH);
  }

  await writeJsonAtomic(historyFile, history);

  // Sync manifest → health (§6.4.3)
  const manifest = await readJson(join(sdlcDir, MANIFEST_FILE), manifestSchema);
  manifest.health = {
    grade: metrics.grade,
    ...(metrics.coverage !== undefined && { coverage: metrics.coverage }),
    ...(metrics.vulnerabilities !== undefined && { securityIssues: metrics.vulnerabilities }),
    ...(metrics.accessibilityViolations !== undefined && { accessibilityIssues: metrics.accessibilityViolations }),
    updatedAt: generatedAt,
  };
  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), manifest);

  return latest;
}
