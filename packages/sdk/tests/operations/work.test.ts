import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { startWork } from '../../src/operations/work-start.js';
import { completeWork, abandonWork } from '../../src/operations/work-complete.js';
import { ItemNotFoundError } from '../../src/core/errors.js';
import { readJson, readMarkdown } from '../../src/core/reader.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { workIndexSchema } from '../../src/schemas/indexes.js';
import { briefFrontMatterSchema } from '../../src/schemas/objects.js';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('startWork', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-work-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('creates a work item directory with brief.md', async () => {
    const { id } = await startWork(projectRoot, { description: 'Add Dark Mode' });

    expect(id).toBe('add-dark-mode');

    const brief = await readMarkdown(
      join(projectRoot, '.sdlc', 'work', 'active', id, 'brief.md'),
      briefFrontMatterSchema,
    );
    expect(brief.frontMatter?.type).toBe('feature');
    expect(brief.frontMatter?.title).toBe('Add Dark Mode');
    expect(brief.frontMatter?.createdAt).toBeTruthy();
  });

  it('creates plan.md by default', async () => {
    const { id } = await startWork(projectRoot, { description: 'Add Feature' });

    const s = await stat(join(projectRoot, '.sdlc', 'work', 'active', id, 'plan.md'));
    expect(s.isFile()).toBe(true);
  });

  it('skips plan.md when createPlan is false', async () => {
    const { id } = await startWork(projectRoot, {
      description: 'Quick Fix',
      createPlan: false,
    });

    await expect(
      stat(join(projectRoot, '.sdlc', 'work', 'active', id, 'plan.md')),
    ).rejects.toThrow();
  });

  it('increments manifest.counters.activeWork', async () => {
    await startWork(projectRoot, { description: 'Item One' });
    const { manifest } = await startWork(projectRoot, { description: 'Item Two' });

    expect(manifest.counters.activeWork).toBe(2);
  });

  it('adds entry to work index active array', async () => {
    const { workIndex } = await startWork(projectRoot, { description: 'Test Item' });

    expect(workIndex.active).toHaveLength(1);
    expect(workIndex.active[0]?.id).toBe('test-item');
    expect(workIndex.active[0]?.type).toBe('feature');
  });

  it('handles ID conflicts by appending suffix', async () => {
    const { id: id1 } = await startWork(projectRoot, { description: 'Add Auth' });
    const { id: id2 } = await startWork(projectRoot, { description: 'Add Auth' });

    expect(id1).toBe('add-auth');
    expect(id2).toBe('add-auth-2');
  });

  it('accepts custom type, priority, and modules', async () => {
    const { workIndex } = await startWork(projectRoot, {
      description: 'Fix Login Bug',
      type: 'bug',
      priority: 'high',
      modules: ['web-app', 'auth-service'],
    });

    const entry = workIndex.active[0];
    expect(entry?.type).toBe('bug');
    expect(entry?.priority).toBe('high');
    expect(entry?.modules).toEqual(['web-app', 'auth-service']);
  });

  it('maintains manifest ↔ index consistency (§7.7.1)', async () => {
    await startWork(projectRoot, { description: 'Item A' });
    await startWork(projectRoot, { description: 'Item B' });

    const manifest = await readJson(join(projectRoot, '.sdlc', 'manifest.json'), manifestSchema);
    const workIndex = await readJson(join(projectRoot, '.sdlc', 'index', 'work.json'), workIndexSchema);

    expect(manifest.counters.activeWork).toBe(workIndex.active.length);
  });
});

describe('completeWork', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-work-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('moves work item to archive', async () => {
    const { id } = await startWork(projectRoot, { description: 'Add Feature' });
    await completeWork(projectRoot, id);

    // Active directory should be gone
    await expect(
      stat(join(projectRoot, '.sdlc', 'work', 'active', id)),
    ).rejects.toThrow();

    // Archive directory should exist
    const archiveBase = join(projectRoot, '.sdlc', 'work', 'archive');
    const s = await stat(archiveBase);
    expect(s.isDirectory()).toBe(true);
  });

  it('sets completedAt and status in brief.md', async () => {
    const { id } = await startWork(projectRoot, { description: 'Add Feature' });
    await completeWork(projectRoot, id);

    // Find the archived brief
    const workIndex = await readJson(
      join(projectRoot, '.sdlc', 'index', 'work.json'),
      workIndexSchema,
    );
    const recentEntry = workIndex.recent[0];
    const briefPath = join(projectRoot, '.sdlc', recentEntry!.path, 'brief.md');
    const brief = await readMarkdown(briefPath);

    expect(brief.frontMatter).toHaveProperty('status', 'completed');
    expect(brief.frontMatter).toHaveProperty('completedAt');
  });

  it('updates counters: decrements activeWork, increments totalCompleted', async () => {
    await startWork(projectRoot, { description: 'Item A' });
    const { id } = await startWork(projectRoot, { description: 'Item B' });

    const { manifest } = await completeWork(projectRoot, id);

    expect(manifest.counters.activeWork).toBe(1);
    expect(manifest.counters.totalCompleted).toBe(1);
  });

  it('moves entry from active to recent in index', async () => {
    const { id } = await startWork(projectRoot, { description: 'Item' });
    const { workIndex } = await completeWork(projectRoot, id);

    expect(workIndex.active).toHaveLength(0);
    expect(workIndex.recent).toHaveLength(1);
    expect(workIndex.recent[0]?.id).toBe(id);
    expect(workIndex.recent[0]?.completedAt).toBeTruthy();
  });

  it('caps recent at 10 entries (§4.2.4)', async () => {
    // Create and complete 12 items
    for (let i = 0; i < 12; i++) {
      const { id } = await startWork(projectRoot, { description: `Item ${i}` });
      await completeWork(projectRoot, id);
    }

    const workIndex = await readJson(
      join(projectRoot, '.sdlc', 'index', 'work.json'),
      workIndexSchema,
    );
    expect(workIndex.recent.length).toBe(10);
  });

  it('throws ItemNotFoundError for non-existent work item', async () => {
    await expect(
      completeWork(projectRoot, 'non-existent'),
    ).rejects.toThrow(ItemNotFoundError);
  });

  it('maintains manifest ↔ index consistency after completion', async () => {
    const { id: id1 } = await startWork(projectRoot, { description: 'Item A' });
    await startWork(projectRoot, { description: 'Item B' });
    await completeWork(projectRoot, id1);

    const manifest = await readJson(join(projectRoot, '.sdlc', 'manifest.json'), manifestSchema);
    const workIndex = await readJson(join(projectRoot, '.sdlc', 'index', 'work.json'), workIndexSchema);

    expect(manifest.counters.activeWork).toBe(workIndex.active.length);
  });
});

describe('abandonWork', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-work-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('sets status to "abandoned" (not "completed")', async () => {
    const { id } = await startWork(projectRoot, { description: 'Bad Idea' });
    await abandonWork(projectRoot, id);

    const workIndex = await readJson(
      join(projectRoot, '.sdlc', 'index', 'work.json'),
      workIndexSchema,
    );
    const briefPath = join(projectRoot, '.sdlc', workIndex.recent[0]!.path, 'brief.md');
    const brief = await readMarkdown(briefPath);

    expect(brief.frontMatter).toHaveProperty('status', 'abandoned');
  });

  it('archives and updates counters same as complete', async () => {
    const { id } = await startWork(projectRoot, { description: 'Abandoned Item' });
    const { manifest, workIndex } = await abandonWork(projectRoot, id);

    expect(manifest.counters.activeWork).toBe(0);
    expect(manifest.counters.totalCompleted).toBe(1);
    expect(workIndex.active).toHaveLength(0);
    expect(workIndex.recent).toHaveLength(1);
  });

  it('throws ItemNotFoundError for non-existent item', async () => {
    await expect(
      abandonWork(projectRoot, 'nope'),
    ).rejects.toThrow(ItemNotFoundError);
  });
});
