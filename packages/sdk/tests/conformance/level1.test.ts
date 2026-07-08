/**
 * Level 1 (Minimal) conformance tests per §9.2.
 *
 * A valid Level 1 .sdlc/ has only manifest.json.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readJson } from '../../src/core/reader.js';
import { writeJsonAtomic } from '../../src/core/writer.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Level 1 (Minimal) conformance', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-l1-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('accepts a minimal manifest with only required fields (§9.2.2)', async () => {
    const sdlcDir = join(projectRoot, '.sdlc');
    await mkdir(sdlcDir, { recursive: true });

    const minimal = {
      specVersion: '1.0',
      magic: 'cs-sdlc',
      project: {
        name: 'Test',
        createdAt: '2026-07-08T10:00:00Z',
      },
      counters: {
        activeWork: 0,
        totalCompleted: 0,
        decisions: 0,
        releases: 0,
      },
    };

    await writeJsonAtomic(join(sdlcDir, 'manifest.json'), minimal);

    // Reader MUST parse and extract all required fields (§9.2.3)
    const manifest = await readJson(join(sdlcDir, 'manifest.json'), manifestSchema);
    expect(manifest.specVersion).toBe('1.0');
    expect(manifest.magic).toBe('cs-sdlc');
    expect(manifest.project.name).toBe('Test');
    expect(manifest.project.createdAt).toBe('2026-07-08T10:00:00Z');
    expect(manifest.counters.activeWork).toBe(0);
  });

  it('handles missing optional fields gracefully (§9.2.3)', async () => {
    const sdlcDir = join(projectRoot, '.sdlc');
    await mkdir(sdlcDir, { recursive: true });

    const minimal = {
      specVersion: '1.0',
      magic: 'cs-sdlc',
      project: { name: 'Test', createdAt: '2026-07-08T10:00:00Z' },
      counters: { activeWork: 0, totalCompleted: 0, decisions: 0, releases: 0 },
    };

    await writeJsonAtomic(join(sdlcDir, 'manifest.json'), minimal);
    const manifest = await readJson(join(sdlcDir, 'manifest.json'), manifestSchema);

    // Optional fields should be undefined, not error
    expect(manifest.modules).toBeUndefined();
    expect(manifest.phase).toBeUndefined();
    expect(manifest.health).toBeUndefined();
    expect(manifest.gates).toBeUndefined();
  });

  it('ignores unknown fields without error (§9.2.3)', async () => {
    const sdlcDir = join(projectRoot, '.sdlc');
    await mkdir(sdlcDir, { recursive: true });

    const withUnknown = {
      specVersion: '1.0',
      magic: 'cs-sdlc',
      project: { name: 'Test', createdAt: '2026-07-08T10:00:00Z' },
      counters: { activeWork: 0, totalCompleted: 0, decisions: 0, releases: 0 },
      futureField: 'from spec v2.0',
      anotherFuture: { nested: true },
    };

    await writeJsonAtomic(join(sdlcDir, 'manifest.json'), withUnknown);
    const manifest = await readJson(join(sdlcDir, 'manifest.json'), manifestSchema);

    // Must not error
    expect(manifest.magic).toBe('cs-sdlc');
    // Must preserve unknown fields
    expect((manifest as Record<string, unknown>)['futureField']).toBe('from spec v2.0');
  });
});
