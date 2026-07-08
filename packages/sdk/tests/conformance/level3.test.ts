/**
 * Level 3 (Full) conformance tests per §9.4.
 *
 * Adds indexes, snapshots, releases, and archive management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { startWork } from '../../src/operations/work-start.js';
import { completeWork } from '../../src/operations/work-complete.js';
import { createDecision, supersedeDecision } from '../../src/operations/decision-create.js';
import { createRelease } from '../../src/operations/release-create.js';
import { generateSnapshot } from '../../src/operations/snapshot-generate.js';
import { rebuildIndexes, recalculateCounters, validateConsistency } from '../../src/operations/sync.js';
import {
  readManifest, readWorkIndex, readDecisionsIndex, readReleasesIndex,
  readLatestSnapshot,
} from '../../src/operations/read-helpers.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Level 3 (Full) conformance', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-l3-'));
    await initSdlc({ projectRoot, name: 'Level 3 Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('full lifecycle: work + decisions + releases + snapshots', async () => {
    // Work items
    const { id: w1 } = await startWork(projectRoot, { description: 'Auth System' });
    const { id: w2 } = await startWork(projectRoot, { description: 'Dashboard UI' });
    await completeWork(projectRoot, w1);

    // Decisions
    const d1 = await createDecision(projectRoot, { title: 'Use JWT Auth' });
    const d2 = await supersedeDecision(projectRoot, d1.id, { title: 'Switch to Session Auth' });

    // Release
    await createRelease(projectRoot, { version: '0.1.0', title: 'Alpha' });

    // Snapshot
    await generateSnapshot(projectRoot, {
      grade: 'B+',
      score: 82,
      coverage: 85,
      tests: { total: 50, passing: 48, failing: 2 },
      vulnerabilities: 0,
    });

    // Verify all indexes
    const workIndex = await readWorkIndex(projectRoot);
    expect(workIndex.active).toHaveLength(1);
    expect(workIndex.active[0]?.id).toBe(w2);
    expect(workIndex.recent).toHaveLength(1);
    expect(workIndex.recent[0]?.id).toBe(w1);

    const decisionsIndex = await readDecisionsIndex(projectRoot);
    expect(decisionsIndex.entries).toHaveLength(2);
    expect(decisionsIndex.entries[0]?.status).toBe('superseded');
    expect(decisionsIndex.entries[1]?.status).toBe('accepted');

    const releasesIndex = await readReleasesIndex(projectRoot);
    expect(releasesIndex.entries).toHaveLength(1);

    const snapshot = await readLatestSnapshot(projectRoot);
    expect(snapshot.overall.grade).toBe('B+');

    // Verify manifest counters
    const manifest = await readManifest(projectRoot);
    expect(manifest.counters.activeWork).toBe(1);
    expect(manifest.counters.totalCompleted).toBe(1);
    expect(manifest.counters.decisions).toBe(2);
    expect(manifest.counters.releases).toBe(1);
    expect(manifest.health?.grade).toBe('B+');
    expect(manifest.health?.coverage).toBe(85);

    // Full consistency check
    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(true);
  });

  it('index rebuild recovers from corruption (§4.5.2)', async () => {
    await startWork(projectRoot, { description: 'Item A' });
    await startWork(projectRoot, { description: 'Item B' });
    await createDecision(projectRoot, { title: 'Decision' });
    await createRelease(projectRoot, { version: '1.0.0' });

    // Rebuild from filesystem
    await rebuildIndexes(projectRoot);
    await recalculateCounters(projectRoot);

    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(true);

    const manifest = await readManifest(projectRoot);
    expect(manifest.counters.activeWork).toBe(2);
    expect(manifest.counters.decisions).toBe(1);
    expect(manifest.counters.releases).toBe(1);
  });

  it('recent items capped at 10 after many completions (§4.2.4)', async () => {
    for (let i = 0; i < 12; i++) {
      const { id } = await startWork(projectRoot, { description: `Item ${i}` });
      await completeWork(projectRoot, id);
    }

    const workIndex = await readWorkIndex(projectRoot);
    expect(workIndex.recent.length).toBe(10);
    expect(workIndex.active.length).toBe(0);

    const manifest = await readManifest(projectRoot);
    expect(manifest.counters.totalCompleted).toBe(12);
  });
});
