/**
 * Forward compatibility and graceful degradation tests per §9.6.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { readManifest, readWorkIndex } from '../../src/operations/read-helpers.js';
import { readJson } from '../../src/core/reader.js';
import { writeJsonAtomic } from '../../src/core/writer.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { validateConsistency } from '../../src/operations/sync.js';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Forward compatibility (§9.6.1)', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-compat-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('preserves unknown fields on read/write round-trip', async () => {
    await initSdlc({ projectRoot, name: 'Test' });

    // Add unknown fields to manifest
    const manifestPath = join(projectRoot, '.sdlc', 'manifest.json');
    const manifest = await readJson(manifestPath, manifestSchema);
    const extended = {
      ...manifest,
      futureField: 'hello from v2',
      futureObject: { nested: true, count: 42 },
    };
    await writeJsonAtomic(manifestPath, extended);

    // Read back — unknown fields must be preserved
    const readBack = await readJson(manifestPath, manifestSchema);
    expect((readBack as Record<string, unknown>)['futureField']).toBe('hello from v2');
    expect((readBack as Record<string, unknown>)['futureObject']).toEqual({ nested: true, count: 42 });
  });

  it('preserves unknown fields in nested objects', async () => {
    await initSdlc({ projectRoot, name: 'Test' });

    const manifestPath = join(projectRoot, '.sdlc', 'manifest.json');
    const manifest = await readJson(manifestPath, manifestSchema);
    (manifest.project as Record<string, unknown>)['futureProjectField'] = 'v2 data';
    await writeJsonAtomic(manifestPath, manifest);

    const readBack = await readJson(manifestPath, manifestSchema);
    expect((readBack.project as Record<string, unknown>)['futureProjectField']).toBe('v2 data');
  });

  it('accepts unknown enum values (module types, work types, etc.)', async () => {
    await initSdlc({ projectRoot, name: 'Test' });

    const manifestPath = join(projectRoot, '.sdlc', 'manifest.json');
    const manifest = await readJson(manifestPath, manifestSchema);
    manifest.phase = 'future-phase-from-v2';
    await writeJsonAtomic(manifestPath, manifest);

    const readBack = await readManifest(projectRoot);
    expect(readBack.phase).toBe('future-phase-from-v2');
  });
});

describe('Version handling (§9.6.2)', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-version-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('reads manifest with higher minor version successfully', async () => {
    const sdlcDir = join(projectRoot, '.sdlc');
    await mkdir(sdlcDir, { recursive: true });

    // Simulate a manifest from spec v1.2 (our SDK supports 1.0)
    const futureManifest = {
      specVersion: '1.2',
      magic: 'cs-sdlc',
      project: { name: 'Future Project', createdAt: '2026-07-08T10:00:00Z' },
      counters: { activeWork: 0, totalCompleted: 0, decisions: 0, releases: 0 },
      futureV12Field: 'new in 1.2',
    };
    await writeJsonAtomic(join(sdlcDir, 'manifest.json'), futureManifest);

    // MUST read successfully (§9.6.2)
    const manifest = await readJson(join(sdlcDir, 'manifest.json'), manifestSchema);
    expect(manifest.specVersion).toBe('1.2');
    expect(manifest.project.name).toBe('Future Project');
    expect((manifest as Record<string, unknown>)['futureV12Field']).toBe('new in 1.2');
  });
});

describe('Graceful degradation (§9.6.3)', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-degrade-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('Level 3 reader handles Level 1 directory without error', async () => {
    // Create a Level 1 directory (manifest only)
    const sdlcDir = join(projectRoot, '.sdlc');
    await mkdir(sdlcDir, { recursive: true });
    await writeJsonAtomic(join(sdlcDir, 'manifest.json'), {
      specVersion: '1.0',
      magic: 'cs-sdlc',
      project: { name: 'Minimal', createdAt: '2026-07-08T10:00:00Z' },
      counters: { activeWork: 0, totalCompleted: 0, decisions: 0, releases: 0 },
    });

    // readManifest MUST work
    const manifest = await readManifest(projectRoot);
    expect(manifest.project.name).toBe('Minimal');

    // readWorkIndex should throw (file doesn't exist) — not crash
    await expect(readWorkIndex(projectRoot)).rejects.toThrow();

    // validateConsistency should work (counters are 0, no indexes needed)
    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(true);
  });

  it('Level 3 reader handles Level 2 directory (no indexes)', async () => {
    // Create via init (which creates indexes), then delete them
    await initSdlc({ projectRoot, name: 'Level 2 Only' });

    const { rm: rmFile } = await import('node:fs/promises');
    await rmFile(join(projectRoot, '.sdlc', 'index'), { recursive: true });

    // readManifest still works
    const manifest = await readManifest(projectRoot);
    expect(manifest.project.name).toBe('Level 2 Only');

    // validateConsistency handles missing indexes gracefully
    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(true); // counters are 0, so no mismatch
  });
});
