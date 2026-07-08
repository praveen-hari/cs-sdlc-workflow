import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { discoverSdlc, projectRootFromSdlc } from '../../src/core/discovery.js';
import { NotFoundError } from '../../src/core/errors.js';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('discoverSdlc', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'sdlc-discovery-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('finds .sdlc/ in the same directory', async () => {
    await mkdir(join(root, '.sdlc'));
    const result = await discoverSdlc(root);
    expect(result).toBe(join(root, '.sdlc'));
  });

  it('finds .sdlc/ from a nested subdirectory', async () => {
    await mkdir(join(root, '.sdlc'));
    const nested = join(root, 'src', 'components', 'deep');
    await mkdir(nested, { recursive: true });

    const result = await discoverSdlc(nested);
    expect(result).toBe(join(root, '.sdlc'));
  });

  it('finds .sdlc/ from a file path', async () => {
    await mkdir(join(root, '.sdlc'));
    const filePath = join(root, 'src', 'index.ts');
    await mkdir(join(root, 'src'), { recursive: true });

    const result = await discoverSdlc(filePath);
    expect(result).toBe(join(root, '.sdlc'));
  });

  it('throws NotFoundError when no .sdlc/ exists', async () => {
    await expect(discoverSdlc(root)).rejects.toThrow(NotFoundError);
  });

  it('stops at the nearest .sdlc/ (does not walk past it)', async () => {
    // Create .sdlc/ at root and at a subdirectory
    await mkdir(join(root, '.sdlc'));
    const sub = join(root, 'packages', 'sdk');
    await mkdir(join(sub, '.sdlc'), { recursive: true });

    // Should find the closer one
    const result = await discoverSdlc(sub);
    expect(result).toBe(join(sub, '.sdlc'));
  });
});

describe('projectRootFromSdlc', () => {
  it('returns parent of .sdlc/ path', () => {
    expect(projectRootFromSdlc('/project/.sdlc')).toBe('/project');
    expect(projectRootFromSdlc('/a/b/c/.sdlc')).toBe('/a/b/c');
  });
});
