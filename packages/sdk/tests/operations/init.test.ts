import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { AlreadyExistsError } from '../../src/core/errors.js';
import { readJson, readMarkdown } from '../../src/core/reader.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { workIndexSchema, decisionsIndexSchema, releasesIndexSchema } from '../../src/schemas/indexes.js';
import { mkdtemp, rm, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('initSdlc', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-init-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('creates a valid .sdlc/ directory', async () => {
    const manifest = await initSdlc({ projectRoot, name: 'Test Project' });

    expect(manifest.magic).toBe('cs-sdlc');
    expect(manifest.specVersion).toBe('1.0');
    expect(manifest.project.name).toBe('Test Project');
    expect(manifest.project.mode).toBe('greenfield');
    expect(manifest.counters.activeWork).toBe(0);
    expect(manifest.counters.totalCompleted).toBe(0);
    expect(manifest.counters.decisions).toBe(0);
    expect(manifest.counters.releases).toBe(0);
  });

  it('creates manifest.json that validates against schema', async () => {
    await initSdlc({ projectRoot, name: 'Test' });

    const manifest = await readJson(
      join(projectRoot, '.sdlc', 'manifest.json'),
      manifestSchema,
    );
    expect(manifest.magic).toBe('cs-sdlc');
  });

  it('creates context/architecture.md with front matter', async () => {
    await initSdlc({ projectRoot, name: 'My App' });

    const doc = await readMarkdown(
      join(projectRoot, '.sdlc', 'context', 'architecture.md'),
    );
    expect(doc.frontMatter).toHaveProperty('version', 1);
    expect(doc.body).toContain('My App — Architecture');
  });

  it('creates context/conventions.md with front matter', async () => {
    await initSdlc({ projectRoot, name: 'My App' });

    const doc = await readMarkdown(
      join(projectRoot, '.sdlc', 'context', 'conventions.md'),
    );
    expect(doc.frontMatter).toHaveProperty('version', 1);
    expect(doc.body).toContain('Code Conventions');
  });

  it('creates work/active/ directory', async () => {
    await initSdlc({ projectRoot, name: 'Test' });

    const s = await stat(join(projectRoot, '.sdlc', 'work', 'active'));
    expect(s.isDirectory()).toBe(true);
  });

  it('creates empty index files', async () => {
    await initSdlc({ projectRoot, name: 'Test' });

    const workIndex = await readJson(
      join(projectRoot, '.sdlc', 'index', 'work.json'),
      workIndexSchema,
    );
    expect(workIndex.active).toEqual([]);
    expect(workIndex.recent).toEqual([]);

    const decisionsIndex = await readJson(
      join(projectRoot, '.sdlc', 'index', 'decisions.json'),
      decisionsIndexSchema,
    );
    expect(decisionsIndex.entries).toEqual([]);

    const releasesIndex = await readJson(
      join(projectRoot, '.sdlc', 'index', 'releases.json'),
      releasesIndexSchema,
    );
    expect(releasesIndex.entries).toEqual([]);
  });

  it('includes stack when provided', async () => {
    const manifest = await initSdlc({
      projectRoot,
      name: 'Test',
      stack: { language: 'typescript', framework: 'react' },
    });

    expect(manifest.project.stack?.language).toBe('typescript');
    expect(manifest.project.stack?.framework).toBe('react');
  });

  it('includes description when provided', async () => {
    const manifest = await initSdlc({
      projectRoot,
      name: 'Test',
      description: 'A test project',
    });

    expect(manifest.project.description).toBe('A test project');
  });

  it('throws AlreadyExistsError if .sdlc/ exists', async () => {
    await mkdir(join(projectRoot, '.sdlc'));

    await expect(
      initSdlc({ projectRoot, name: 'Test' }),
    ).rejects.toThrow(AlreadyExistsError);
  });

  it('detects project name from package.json', async () => {
    await writeFile(
      join(projectRoot, 'package.json'),
      JSON.stringify({ name: '@scope/my-app' }),
    );

    const manifest = await initSdlc({ projectRoot });
    expect(manifest.project.name).toBe('my-app');
  });

  it('falls back to directory name when no package.json', async () => {
    const manifest = await initSdlc({ projectRoot });
    // Directory name is the temp dir name
    expect(manifest.project.name).toBeTruthy();
    expect(typeof manifest.project.name).toBe('string');
  });
});
