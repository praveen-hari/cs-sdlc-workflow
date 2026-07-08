import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { startWork } from '../../src/operations/work-start.js';
import { completeWork } from '../../src/operations/work-complete.js';
import { createDecision } from '../../src/operations/decision-create.js';
import { createRelease } from '../../src/operations/release-create.js';
import { rebuildIndexes, recalculateCounters, validateConsistency } from '../../src/operations/sync.js';
import { readJson } from '../../src/core/reader.js';
import { writeJsonAtomic } from '../../src/core/writer.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { workIndexSchema } from '../../src/schemas/indexes.js';
import { decisionsIndexSchema } from '../../src/schemas/indexes.js';
import { releasesIndexSchema } from '../../src/schemas/indexes.js';
import { mkdtemp, rm, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('rebuildIndexes', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-sync-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('rebuilds work index from filesystem', async () => {
    await startWork(projectRoot, { description: 'Item A' });
    await startWork(projectRoot, { description: 'Item B' });

    // Corrupt the index
    await writeJsonAtomic(
      join(projectRoot, '.sdlc', 'index', 'work.json'),
      { active: [], recent: [] },
    );

    await rebuildIndexes(projectRoot);

    const workIndex = await readJson(
      join(projectRoot, '.sdlc', 'index', 'work.json'),
      workIndexSchema,
    );
    expect(workIndex.active).toHaveLength(2);
  });

  it('rebuilds decisions index from filesystem', async () => {
    await createDecision(projectRoot, { title: 'Decision A' });
    await createDecision(projectRoot, { title: 'Decision B' });

    // Corrupt the index
    await writeJsonAtomic(
      join(projectRoot, '.sdlc', 'index', 'decisions.json'),
      { entries: [] },
    );

    await rebuildIndexes(projectRoot);

    const index = await readJson(
      join(projectRoot, '.sdlc', 'index', 'decisions.json'),
      decisionsIndexSchema,
    );
    expect(index.entries).toHaveLength(2);
    expect(index.entries[0]?.id).toBe('001');
  });

  it('rebuilds releases index from filesystem', async () => {
    await createRelease(projectRoot, { version: '1.0.0' });
    await createRelease(projectRoot, { version: '0.1.0' });

    await writeJsonAtomic(
      join(projectRoot, '.sdlc', 'index', 'releases.json'),
      { entries: [] },
    );

    await rebuildIndexes(projectRoot);

    const index = await readJson(
      join(projectRoot, '.sdlc', 'index', 'releases.json'),
      releasesIndexSchema,
    );
    expect(index.entries).toHaveLength(2);
    // Should be sorted by SemVer
    expect(index.entries[0]?.version).toBe('0.1.0');
    expect(index.entries[1]?.version).toBe('1.0.0');
  });

  it('includes recent completed items in rebuilt work index', async () => {
    const { id } = await startWork(projectRoot, { description: 'Done Item' });
    await completeWork(projectRoot, id);

    await rebuildIndexes(projectRoot);

    const workIndex = await readJson(
      join(projectRoot, '.sdlc', 'index', 'work.json'),
      workIndexSchema,
    );
    expect(workIndex.recent).toHaveLength(1);
    expect(workIndex.recent[0]?.id).toBe(id);
  });
});

describe('recalculateCounters', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-sync-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('recalculates counters from indexes', async () => {
    await startWork(projectRoot, { description: 'Item A' });
    await startWork(projectRoot, { description: 'Item B' });
    await createDecision(projectRoot, { title: 'Decision' });

    // Corrupt manifest counters
    const manifest = await readJson(join(projectRoot, '.sdlc', 'manifest.json'), manifestSchema);
    manifest.counters.activeWork = 99;
    manifest.counters.decisions = 99;
    await writeJsonAtomic(join(projectRoot, '.sdlc', 'manifest.json'), manifest);

    const fixed = await recalculateCounters(projectRoot);
    expect(fixed.counters.activeWork).toBe(2);
    expect(fixed.counters.decisions).toBe(1);
  });

  it('preserves totalCompleted (cumulative, not derivable)', async () => {
    const { id } = await startWork(projectRoot, { description: 'Item' });
    await completeWork(projectRoot, id);

    const manifest = await readJson(join(projectRoot, '.sdlc', 'manifest.json'), manifestSchema);
    expect(manifest.counters.totalCompleted).toBe(1);

    const recalculated = await recalculateCounters(projectRoot);
    expect(recalculated.counters.totalCompleted).toBe(1);
  });
});

describe('validateConsistency', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-sync-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('returns valid for a consistent .sdlc/', async () => {
    await startWork(projectRoot, { description: 'Item' });
    await createDecision(projectRoot, { title: 'Decision' });

    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('detects counter mismatch', async () => {
    await startWork(projectRoot, { description: 'Item' });

    // Corrupt counter
    const manifest = await readJson(join(projectRoot, '.sdlc', 'manifest.json'), manifestSchema);
    manifest.counters.activeWork = 5;
    await writeJsonAtomic(join(projectRoot, '.sdlc', 'manifest.json'), manifest);

    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.code === 'COUNTER_MISMATCH_ACTIVE_WORK')).toBe(true);
  });

  it('detects missing work directory', async () => {
    await startWork(projectRoot, { description: 'Item' });

    // Delete the work item directory but leave the index entry
    const { rm: rmDir } = await import('node:fs/promises');
    await rmDir(join(projectRoot, '.sdlc', 'work', 'active', 'item'), { recursive: true });

    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.code === 'MISSING_WORK_DIR')).toBe(true);
  });

  it('detects missing decision file', async () => {
    await createDecision(projectRoot, { title: 'Test Decision' });

    // Delete the decision file
    await unlink(join(projectRoot, '.sdlc', 'decisions', '001-test-decision.md'));

    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.code === 'MISSING_DECISION_FILE')).toBe(true);
  });
});
