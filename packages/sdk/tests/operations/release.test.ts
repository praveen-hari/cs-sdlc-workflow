import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { createRelease } from '../../src/operations/release-create.js';
import { SdlcError } from '../../src/core/errors.js';
import { readJson, readMarkdown } from '../../src/core/reader.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { releasesIndexSchema } from '../../src/schemas/indexes.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('createRelease', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-release-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('creates a release file', async () => {
    const result = await createRelease(projectRoot, {
      version: '1.0.0',
      title: 'First Release',
    });

    expect(result.version).toBe('1.0.0');
    expect(result.path).toBe('releases/v1.0.0.md');

    const doc = await readMarkdown(join(projectRoot, '.sdlc', result.path));
    expect(doc.frontMatter).toHaveProperty('version', '1.0.0');
    expect(doc.body).toContain('v1.0.0');
    expect(doc.body).toContain('First Release');
  });

  it('updates releases index (ordered by SemVer)', async () => {
    await createRelease(projectRoot, { version: '1.0.0' });
    await createRelease(projectRoot, { version: '0.1.0' });
    const { releasesIndex } = await createRelease(projectRoot, { version: '0.5.0' });

    expect(releasesIndex.entries.map((e) => e.version)).toEqual([
      '0.1.0', '0.5.0', '1.0.0',
    ]);
  });

  it('increments manifest.counters.releases', async () => {
    await createRelease(projectRoot, { version: '0.1.0' });
    const { manifest } = await createRelease(projectRoot, { version: '1.0.0' });

    expect(manifest.counters.releases).toBe(2);
  });

  it('rejects duplicate versions', async () => {
    await createRelease(projectRoot, { version: '1.0.0' });

    await expect(
      createRelease(projectRoot, { version: '1.0.0' }),
    ).rejects.toThrow(SdlcError);
  });

  it('accepts pre-release versions', async () => {
    const result = await createRelease(projectRoot, { version: '0.2.1-beta' });
    expect(result.path).toBe('releases/v0.2.1-beta.md');
  });
});
