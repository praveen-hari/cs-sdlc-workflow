import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { generateSnapshot } from '../../src/operations/snapshot-generate.js';
import { readJson } from '../../src/core/reader.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { latestSnapshotSchema } from '../../src/schemas/snapshots.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('generateSnapshot', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-snapshot-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('writes snapshots/latest.json', async () => {
    const snapshot = await generateSnapshot(projectRoot, {
      grade: 'B+',
      score: 82,
      coverage: 85,
    });

    expect(snapshot.overall.grade).toBe('B+');
    expect(snapshot.overall.score).toBe(82);
    expect(snapshot.coverage?.total).toBe(85);
    expect(snapshot.generatedAt).toBeTruthy();

    // Verify on disk
    const onDisk = await readJson(
      join(projectRoot, '.sdlc', 'snapshots', 'latest.json'),
      latestSnapshotSchema,
    );
    expect(onDisk.overall.grade).toBe('B+');
  });

  it('syncs health to manifest (§6.4.3)', async () => {
    await generateSnapshot(projectRoot, {
      grade: 'A',
      coverage: 92,
      vulnerabilities: 0,
      accessibilityViolations: 2,
    });

    const manifest = await readJson(
      join(projectRoot, '.sdlc', 'manifest.json'),
      manifestSchema,
    );
    expect(manifest.health?.grade).toBe('A');
    expect(manifest.health?.coverage).toBe(92);
    expect(manifest.health?.securityIssues).toBe(0);
    expect(manifest.health?.accessibilityIssues).toBe(2);
    expect(manifest.health?.updatedAt).toBeTruthy();
  });

  it('appends to monthly history', async () => {
    await generateSnapshot(projectRoot, { grade: 'B' });
    await generateSnapshot(projectRoot, { grade: 'B+' });

    // Read history file (we don't know the exact month, so scan)
    const { readdir } = await import('node:fs/promises');
    const historyDir = join(projectRoot, '.sdlc', 'snapshots', 'history');
    const files = await readdir(historyDir);
    expect(files.length).toBe(1);

    const historyFile = join(historyDir, files[0]!);
    const history = JSON.parse(
      await (await import('node:fs/promises')).readFile(historyFile, 'utf-8'),
    );
    expect(history.snapshots).toHaveLength(2);
  });

  it('caps history at 4 entries per month (§6.3.3)', async () => {
    for (let i = 0; i < 6; i++) {
      await generateSnapshot(projectRoot, { grade: 'C' });
    }

    const { readdir, readFile } = await import('node:fs/promises');
    const historyDir = join(projectRoot, '.sdlc', 'snapshots', 'history');
    const files = await readdir(historyDir);
    const history = JSON.parse(await readFile(join(historyDir, files[0]!), 'utf-8'));
    expect(history.snapshots.length).toBe(4);
  });

  it('includes test results when provided', async () => {
    const snapshot = await generateSnapshot(projectRoot, {
      grade: 'A',
      tests: { total: 100, passing: 98, failing: 2, skipped: 5 },
    });

    expect(snapshot.tests?.total).toBe(100);
    expect(snapshot.tests?.passing).toBe(98);
    expect(snapshot.tests?.failing).toBe(2);
  });

  it('includes generator when provided', async () => {
    const snapshot = await generateSnapshot(projectRoot, {
      grade: 'B',
      generator: 'cs-sdlc-analyze@1.0.0',
    });

    expect(snapshot.generator).toBe('cs-sdlc-analyze@1.0.0');
  });
});
