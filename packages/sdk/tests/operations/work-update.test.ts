/**
 * Tests for work item update operation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  initSdlc, startWork, updateWorkItem,
  readWorkItem, readWorkIndex,
} from '../../src/index.js';

describe('updateWorkItem', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'work-update-'));
    await initSdlc({ projectRoot, name: 'Test Project' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('updates the title of an active work item', async () => {
    const { id } = await startWork(projectRoot, { description: 'Old Title' });

    await updateWorkItem(projectRoot, id, { title: 'New Title' });

    const item = await readWorkItem(projectRoot, id);
    expect(item.brief.frontMatter!.title).toBe('New Title');

    // Index should also be updated
    const index = await readWorkIndex(projectRoot);
    expect(index.active[0]!.title).toBe('New Title');
  });

  it('updates the priority of an active work item', async () => {
    const { id } = await startWork(projectRoot, {
      description: 'My Feature',
      priority: 'low',
    });

    await updateWorkItem(projectRoot, id, { priority: 'critical' });

    const item = await readWorkItem(projectRoot, id);
    expect(item.brief.frontMatter!.priority).toBe('critical');

    const index = await readWorkIndex(projectRoot);
    expect(index.active[0]!.priority).toBe('critical');
  });

  it('updates the type of an active work item', async () => {
    const { id } = await startWork(projectRoot, {
      description: 'My Task',
      type: 'feature',
    });

    await updateWorkItem(projectRoot, id, { type: 'bugfix' });

    const item = await readWorkItem(projectRoot, id);
    expect(item.brief.frontMatter!.type).toBe('bugfix');

    const index = await readWorkIndex(projectRoot);
    expect(index.active[0]!.type).toBe('bugfix');
  });

  it('updates modules of an active work item', async () => {
    const { id } = await startWork(projectRoot, {
      description: 'My Feature',
      modules: ['frontend'],
    });

    await updateWorkItem(projectRoot, id, { modules: ['frontend', 'backend'] });

    const item = await readWorkItem(projectRoot, id);
    expect(item.brief.frontMatter!.modules).toEqual(['frontend', 'backend']);

    const index = await readWorkIndex(projectRoot);
    expect(index.active[0]!.modules).toEqual(['frontend', 'backend']);
  });

  it('clears modules when empty array is passed', async () => {
    const { id } = await startWork(projectRoot, {
      description: 'My Feature',
      modules: ['frontend'],
    });

    await updateWorkItem(projectRoot, id, { modules: [] });

    const item = await readWorkItem(projectRoot, id);
    expect(item.brief.frontMatter!.modules).toBeUndefined();

    const index = await readWorkIndex(projectRoot);
    expect(index.active[0]!.modules).toBeUndefined();
  });

  it('updates the body of brief.md', async () => {
    const { id } = await startWork(projectRoot, { description: 'My Feature' });

    await updateWorkItem(projectRoot, id, {
      body: '# My Feature\n\n## What\n\nBuild a dark mode toggle.\n\n## Acceptance Criteria\n\n- [ ] Toggle in header\n- [ ] Persists preference\n',
    });

    const item = await readWorkItem(projectRoot, id);
    expect(item.brief.body).toContain('Build a dark mode toggle.');
    expect(item.brief.body).toContain('Toggle in header');
  });

  it('preserves body when only updating metadata', async () => {
    const { id } = await startWork(projectRoot, { description: 'My Feature' });

    // Get original body
    const original = await readWorkItem(projectRoot, id);
    const originalBody = original.brief.body;

    // Update only priority
    await updateWorkItem(projectRoot, id, { priority: 'high' });

    const updated = await readWorkItem(projectRoot, id);
    expect(updated.brief.body).toBe(originalBody);
    expect(updated.brief.frontMatter!.priority).toBe('high');
  });

  it('updates multiple fields at once', async () => {
    const { id } = await startWork(projectRoot, {
      description: 'Old Title',
      type: 'feature',
      priority: 'low',
    });

    await updateWorkItem(projectRoot, id, {
      title: 'New Title',
      type: 'bugfix',
      priority: 'critical',
      modules: ['api'],
    });

    const item = await readWorkItem(projectRoot, id);
    expect(item.brief.frontMatter!.title).toBe('New Title');
    expect(item.brief.frontMatter!.type).toBe('bugfix');
    expect(item.brief.frontMatter!.priority).toBe('critical');
    expect(item.brief.frontMatter!.modules).toEqual(['api']);
  });

  it('throws ItemNotFoundError for non-existent work item', async () => {
    await expect(
      updateWorkItem(projectRoot, 'nonexistent-item', { title: 'test' }),
    ).rejects.toThrow('not found');
  });

  it('merges custom front matter fields', async () => {
    const { id } = await startWork(projectRoot, { description: 'My Feature' });

    await updateWorkItem(projectRoot, id, {
      frontMatter: { epic: 'user-auth', sprint: 3 },
    });

    const item = await readWorkItem(projectRoot, id);
    expect((item.brief.frontMatter as Record<string, unknown>)['epic']).toBe('user-auth');
    expect((item.brief.frontMatter as Record<string, unknown>)['sprint']).toBe(3);
  });
});
