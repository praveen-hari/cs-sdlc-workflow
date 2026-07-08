import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { startWork } from '../../src/operations/work-start.js';
import { updatePhase, addModule, removeModule, renameModule } from '../../src/operations/phase.js';
import { ItemNotFoundError, IdentifierError } from '../../src/core/errors.js';
import { readJson } from '../../src/core/reader.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { workIndexSchema } from '../../src/schemas/indexes.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('updatePhase', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-phase-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('updates the phase in manifest', async () => {
    const manifest = await updatePhase(projectRoot, 'build');
    expect(manifest.phase).toBe('build');

    // Verify on disk
    const onDisk = await readJson(join(projectRoot, '.sdlc', 'manifest.json'), manifestSchema);
    expect(onDisk.phase).toBe('build');
  });

  it('accepts custom phase values (extensible)', async () => {
    const manifest = await updatePhase(projectRoot, 'custom-phase');
    expect(manifest.phase).toBe('custom-phase');
  });
});

describe('addModule', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-module-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('adds a module to the manifest', async () => {
    const manifest = await addModule(projectRoot, 'web-app', {
      path: 'apps/web',
      type: 'frontend',
      stack: { language: 'typescript', framework: 'react' },
    });

    expect(manifest.modules?.['web-app']).toBeDefined();
    expect(manifest.modules?.['web-app']?.type).toBe('frontend');
  });

  it('creates modules object if it does not exist', async () => {
    const before = await readJson(join(projectRoot, '.sdlc', 'manifest.json'), manifestSchema);
    expect(before.modules).toBeUndefined();

    await addModule(projectRoot, 'api', {
      path: 'services/api',
      type: 'backend',
      stack: { language: 'typescript' },
    });

    const after = await readJson(join(projectRoot, '.sdlc', 'manifest.json'), manifestSchema);
    expect(after.modules).toBeDefined();
  });

  it('rejects invalid module ID', async () => {
    await expect(
      addModule(projectRoot, 'Bad_Id', {
        path: 'x',
        type: 'other',
        stack: { language: 'typescript' },
      }),
    ).rejects.toThrow(IdentifierError);
  });
});

describe('removeModule', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-module-'));
    await initSdlc({ projectRoot, name: 'Test' });
    await addModule(projectRoot, 'web-app', {
      path: 'apps/web',
      type: 'frontend',
      stack: { language: 'typescript' },
    });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('removes a module from the manifest', async () => {
    const manifest = await removeModule(projectRoot, 'web-app');
    expect(manifest.modules).toBeUndefined(); // last module removed
  });

  it('throws ItemNotFoundError for non-existent module', async () => {
    await expect(removeModule(projectRoot, 'nope')).rejects.toThrow(ItemNotFoundError);
  });
});

describe('renameModule', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-module-'));
    await initSdlc({ projectRoot, name: 'Test' });
    await addModule(projectRoot, 'web-app', {
      path: 'apps/web',
      type: 'frontend',
      stack: { language: 'typescript' },
    });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('renames a module in the manifest', async () => {
    const manifest = await renameModule(projectRoot, 'web-app', 'frontend-app');

    expect(manifest.modules?.['web-app']).toBeUndefined();
    expect(manifest.modules?.['frontend-app']).toBeDefined();
    expect(manifest.modules?.['frontend-app']?.type).toBe('frontend');
  });

  it('updates module references in active work index', async () => {
    await startWork(projectRoot, {
      description: 'Feature',
      modules: ['web-app'],
    });

    await renameModule(projectRoot, 'web-app', 'frontend-app');

    const workIndex = await readJson(
      join(projectRoot, '.sdlc', 'index', 'work.json'),
      workIndexSchema,
    );
    expect(workIndex.active[0]?.modules).toEqual(['frontend-app']);
  });

  it('throws ItemNotFoundError for non-existent module', async () => {
    await expect(
      renameModule(projectRoot, 'nope', 'new-name'),
    ).rejects.toThrow(ItemNotFoundError);
  });

  it('rejects invalid new module ID', async () => {
    await expect(
      renameModule(projectRoot, 'web-app', 'Bad_Name'),
    ).rejects.toThrow(IdentifierError);
  });
});
