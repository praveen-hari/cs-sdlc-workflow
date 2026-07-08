import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlcFromScan } from '../../src/operations/init-scan.js';
import { readJson } from '../../src/core/reader.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('initSdlcFromScan', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-scan-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('creates .sdlc/ with brownfield mode', async () => {
    await writeFile(
      join(projectRoot, 'package.json'),
      JSON.stringify({
        name: 'my-app',
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0' },
      }),
    );

    const result = await initSdlcFromScan(projectRoot);

    expect(result.manifest.project.mode).toBe('brownfield');
    expect(result.manifest.project.name).toBe('my-app');
    expect(result.detectedStack).not.toBeNull();
    expect(result.detectedStack!.language).toBe('typescript');
    expect(result.detectedStack!.framework).toBe('react');
  });

  it('sets stack on project for single-module projects', async () => {
    await writeFile(
      join(projectRoot, 'package.json'),
      JSON.stringify({
        name: 'simple-app',
        dependencies: { express: '^4.18.0' },
        devDependencies: { typescript: '^5.0.0' },
      }),
    );

    const result = await initSdlcFromScan(projectRoot);
    expect(result.manifest.project.stack?.language).toBe('typescript');
    expect(result.manifest.project.stack?.framework).toBe('express');
    expect(result.manifest.modules).toBeUndefined();
  });

  it('detects monorepo modules', async () => {
    // Create a mini monorepo
    await writeFile(
      join(projectRoot, 'package.json'),
      JSON.stringify({ name: 'mono', private: true, workspaces: ['packages/*'] }),
    );
    await mkdir(join(projectRoot, 'packages', 'web'), { recursive: true });
    await writeFile(
      join(projectRoot, 'packages', 'web', 'package.json'),
      JSON.stringify({
        name: '@mono/web',
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0' },
      }),
    );
    await mkdir(join(projectRoot, 'packages', 'api'), { recursive: true });
    await writeFile(
      join(projectRoot, 'packages', 'api', 'package.json'),
      JSON.stringify({
        name: '@mono/api',
        dependencies: { express: '^4.18.0' },
        devDependencies: { typescript: '^5.0.0' },
      }),
    );

    const result = await initSdlcFromScan(projectRoot);
    expect(result.detectedModules).toBe(2);
    expect(result.manifest.modules).toBeDefined();

    // Verify on disk
    const manifest = await readJson(join(projectRoot, '.sdlc', 'manifest.json'), manifestSchema);
    expect(Object.keys(manifest.modules ?? {}).length).toBe(2);
  });

  it('works with empty project (no config files)', async () => {
    const result = await initSdlcFromScan(projectRoot);
    expect(result.manifest.project.mode).toBe('brownfield');
    expect(result.detectedStack).toBeNull();
    expect(result.detectedModules).toBe(0);
  });

  it('detects artifacts', async () => {
    await mkdir(join(projectRoot, '.github', 'workflows'), { recursive: true });
    await mkdir(join(projectRoot, 'tests'), { recursive: true });

    const result = await initSdlcFromScan(projectRoot);
    expect(result.detectedArtifacts.hasCI).toBe(true);
    expect(result.detectedArtifacts.hasTesting).toBe(true);
  });
});
