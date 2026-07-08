import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { startWork } from '../../src/operations/work-start.js';
import { listPlanTasks, updatePlanTask, syncPlanProgress } from '../../src/operations/plan-tasks.js';
import { ItemNotFoundError } from '../../src/core/errors.js';
import { writeMarkdown } from '../../src/core/writer.js';
import { serializeFrontMatter } from '../../src/core/frontmatter.js';
import { readMarkdown } from '../../src/core/reader.js';
import { planFrontMatterSchema } from '../../src/schemas/objects.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('plan task operations', () => {
  let projectRoot: string;
  let workId: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-plan-'));
    await initSdlc({ projectRoot, name: 'Test' });
    const result = await startWork(projectRoot, { description: 'My Feature' });
    workId = result.id;

    // Write a plan with real tasks
    const planPath = join(projectRoot, '.sdlc', 'work', 'active', workId, 'plan.md');
    const body = `# Implementation Plan

## Task 1: Setup
- [ ] Create project structure
- [ ] Install dependencies
- [ ] Configure TypeScript

## Task 2: Build core
- [ ] Implement data model
- [ ] Add validation

## Task 3: Test
- [ ] Write unit tests
- [ ] Write integration tests
`;
    await writeMarkdown(planPath, serializeFrontMatter({ totalTasks: 0, completedTasks: 0 }, body));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  describe('listPlanTasks', () => {
    it('lists all checkboxes in plan.md', async () => {
      const summary = await listPlanTasks(projectRoot, workId);
      expect(summary.totalTasks).toBe(7);
      expect(summary.completedTasks).toBe(0);
      expect(summary.tasks).toHaveLength(7);
      expect(summary.tasks[0]?.text).toBe('Create project structure');
      expect(summary.tasks[0]?.number).toBe(1);
      expect(summary.tasks[0]?.completed).toBe(false);
    });

    it('throws for non-existent work item', async () => {
      await expect(listPlanTasks(projectRoot, 'nope')).rejects.toThrow(ItemNotFoundError);
    });
  });

  describe('updatePlanTask', () => {
    it('checks a task', async () => {
      const summary = await updatePlanTask(projectRoot, workId, 1, true);
      expect(summary.completedTasks).toBe(1);
      expect(summary.tasks[0]?.completed).toBe(true);
    });

    it('unchecks a task', async () => {
      await updatePlanTask(projectRoot, workId, 1, true);
      const summary = await updatePlanTask(projectRoot, workId, 1, false);
      expect(summary.completedTasks).toBe(0);
      expect(summary.tasks[0]?.completed).toBe(false);
    });

    it('updates front matter counters automatically', async () => {
      await updatePlanTask(projectRoot, workId, 1, true);
      await updatePlanTask(projectRoot, workId, 2, true);
      await updatePlanTask(projectRoot, workId, 3, true);

      const planPath = join(projectRoot, '.sdlc', 'work', 'active', workId, 'plan.md');
      const doc = await readMarkdown(planPath, planFrontMatterSchema);
      expect(doc.frontMatter?.totalTasks).toBe(7);
      expect(doc.frontMatter?.completedTasks).toBe(3);
      expect(doc.frontMatter?.currentTask).toBe(4); // first uncompleted
    });

    it('persists checkbox state in the file', async () => {
      await updatePlanTask(projectRoot, workId, 2, true);

      // Re-read and verify
      const summary = await listPlanTasks(projectRoot, workId);
      expect(summary.tasks[1]?.completed).toBe(true);
      expect(summary.tasks[0]?.completed).toBe(false); // task 1 still unchecked
    });

    it('throws for non-existent task number', async () => {
      await expect(
        updatePlanTask(projectRoot, workId, 99, true),
      ).rejects.toThrow(ItemNotFoundError);
    });

    it('handles checking multiple tasks', async () => {
      await updatePlanTask(projectRoot, workId, 1, true);
      await updatePlanTask(projectRoot, workId, 4, true);
      await updatePlanTask(projectRoot, workId, 7, true);

      const summary = await listPlanTasks(projectRoot, workId);
      expect(summary.completedTasks).toBe(3);
      expect(summary.tasks[0]?.completed).toBe(true);  // #1
      expect(summary.tasks[1]?.completed).toBe(false);  // #2
      expect(summary.tasks[3]?.completed).toBe(true);  // #4
      expect(summary.tasks[6]?.completed).toBe(true);  // #7
    });
  });

  describe('syncPlanProgress', () => {
    it('syncs front matter from checkbox state', async () => {
      // Manually write a plan with some checked boxes but wrong front matter
      const planPath = join(projectRoot, '.sdlc', 'work', 'active', workId, 'plan.md');
      const body = `# Plan

- [x] Task A done
- [x] Task B done
- [ ] Task C pending
- [x] Task D done
`;
      await writeMarkdown(planPath, serializeFrontMatter({ totalTasks: 0, completedTasks: 0 }, body));

      const summary = await syncPlanProgress(projectRoot, workId);
      expect(summary.totalTasks).toBe(4);
      expect(summary.completedTasks).toBe(3);

      // Verify front matter was updated
      const doc = await readMarkdown(planPath, planFrontMatterSchema);
      expect(doc.frontMatter?.totalTasks).toBe(4);
      expect(doc.frontMatter?.completedTasks).toBe(3);
      expect(doc.frontMatter?.currentTask).toBe(3); // Task C is first uncompleted
    });
  });
});
