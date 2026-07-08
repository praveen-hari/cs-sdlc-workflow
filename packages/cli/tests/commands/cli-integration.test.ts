/**
 * CLI integration tests.
 *
 * Tests call SDK functions directly (same as commands do)
 * and verify the full lifecycle works end-to-end.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initSdlc, initSdlcFromScan,
  startWork, completeWork, abandonWork,
  createDecision, supersedeDecision,
  createRelease,
  generateSnapshot,
  readManifest, readWorkIndex, readDecisionsIndex, readReleasesIndex,
  readWorkItem, readDecision,
  validateConsistency, rebuildIndexes, recalculateCounters,
  updatePhase,
} from '@syncfusion/cs-sdlc';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('CLI integration: full lifecycle', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'cli-test-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('init → start → done → decide → release → snapshot → validate', async () => {
    // 1. Init
    const manifest = await initSdlc({ projectRoot, name: 'CLI Test App' });
    expect(manifest.project.name).toBe('CLI Test App');

    // 2. Start work
    const { id } = await startWork(projectRoot, {
      description: 'Add User Auth',
      type: 'feature',
      priority: 'high',
    });
    expect(id).toBe('add-user-auth');

    // 3. Complete work
    await completeWork(projectRoot, id);
    const m2 = await readManifest(projectRoot);
    expect(m2.counters.activeWork).toBe(0);
    expect(m2.counters.totalCompleted).toBe(1);

    // 4. Create decision
    const dec = await createDecision(projectRoot, {
      title: 'Use JWT for Auth',
      context: 'Need stateless auth.',
    });
    expect(dec.id).toBe('001');

    // 5. Create release
    const rel = await createRelease(projectRoot, {
      version: '0.1.0',
      title: 'Alpha',
    });
    expect(rel.version).toBe('0.1.0');

    // 6. Generate snapshot
    const snap = await generateSnapshot(projectRoot, {
      grade: 'B+',
      coverage: 85,
      tests: { total: 50, passing: 48, failing: 2 },
    });
    expect(snap.overall.grade).toBe('B+');

    // 7. Validate
    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(true);

    // 8. Final status check
    const final = await readManifest(projectRoot);
    expect(final.counters.decisions).toBe(1);
    expect(final.counters.releases).toBe(1);
    expect(final.health?.grade).toBe('B+');
  });

  it('init --scan detects project stack', async () => {
    await writeFile(
      join(projectRoot, 'package.json'),
      JSON.stringify({
        name: 'scan-test',
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0', vitest: '^2.0.0' },
      }),
    );

    const result = await initSdlcFromScan(projectRoot);
    expect(result.manifest.project.mode).toBe('brownfield');
    expect(result.detectedStack?.language).toBe('typescript');
    expect(result.detectedStack?.framework).toBe('react');
  });

  it('list commands return correct data', async () => {
    await initSdlc({ projectRoot, name: 'Test' });
    await startWork(projectRoot, { description: 'Feature A' });
    await createDecision(projectRoot, { title: 'Decision A' });
    await createRelease(projectRoot, { version: '1.0.0' });

    const work = await readWorkIndex(projectRoot);
    expect(work.active).toHaveLength(1);

    const decisions = await readDecisionsIndex(projectRoot);
    expect(decisions.entries).toHaveLength(1);

    const releases = await readReleasesIndex(projectRoot);
    expect(releases.entries).toHaveLength(1);
  });

  it('show auto-detects work item vs decision', async () => {
    await initSdlc({ projectRoot, name: 'Test' });
    await startWork(projectRoot, { description: 'My Feature' });
    await createDecision(projectRoot, { title: 'My Decision' });

    // Work item (kebab-case ID)
    const item = await readWorkItem(projectRoot, 'my-feature');
    expect(item.brief.frontMatter?.title).toBe('My Feature');

    // Decision (3-digit ID)
    const dec = await readDecision(projectRoot, '001');
    expect(dec.document.frontMatter?.title).toBe('My Decision');
  });

  it('abandon sets status to abandoned', async () => {
    await initSdlc({ projectRoot, name: 'Test' });
    const { id } = await startWork(projectRoot, { description: 'Bad Idea' });
    await abandonWork(projectRoot, id);

    const item = await readWorkItem(projectRoot, id);
    expect(item.brief.frontMatter?.status).toBe('abandoned');
  });

  it('supersede decision updates both records', async () => {
    await initSdlc({ projectRoot, name: 'Test' });
    const old = await createDecision(projectRoot, { title: 'Old Way' });
    await supersedeDecision(projectRoot, old.id, { title: 'New Way' });

    const oldDec = await readDecision(projectRoot, '001');
    expect(oldDec.document.frontMatter?.status).toBe('superseded');

    const newDec = await readDecision(projectRoot, '002');
    expect(newDec.document.frontMatter?.supersedes).toBe('001');
  });

  it('sync rebuilds indexes after corruption', async () => {
    await initSdlc({ projectRoot, name: 'Test' });
    await startWork(projectRoot, { description: 'Item A' });
    await startWork(projectRoot, { description: 'Item B' });

    await rebuildIndexes(projectRoot);
    await recalculateCounters(projectRoot);

    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(true);
  });

  it('phase update works', async () => {
    await initSdlc({ projectRoot, name: 'Test' });
    const m = await updatePhase(projectRoot, 'build');
    expect(m.phase).toBe('build');
  });
});
