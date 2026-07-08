/**
 * Level 2 (Standard) conformance tests per §9.3.
 *
 * Adds context docs, work items, and decisions on top of Level 1.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { startWork } from '../../src/operations/work-start.js';
import { completeWork } from '../../src/operations/work-complete.js';
import { createDecision } from '../../src/operations/decision-create.js';
import { readManifest, readContextDoc, readWorkItem, readDecision } from '../../src/operations/read-helpers.js';
import { validateConsistency } from '../../src/operations/sync.js';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Level 2 (Standard) conformance', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-l2-'));
    await initSdlc({ projectRoot, name: 'Level 2 Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('creates required Level 2 files (§9.3.1)', async () => {
    // manifest.json
    const manifest = await readManifest(projectRoot);
    expect(manifest.magic).toBe('cs-sdlc');

    // context/architecture.md
    const arch = await readContextDoc(projectRoot, 'architecture');
    expect(arch.document.frontMatter).not.toBeNull();

    // context/conventions.md
    const conv = await readContextDoc(projectRoot, 'conventions');
    expect(conv.document.frontMatter).not.toBeNull();

    // work/active/ directory exists
    const s = await stat(join(projectRoot, '.sdlc', 'work', 'active'));
    expect(s.isDirectory()).toBe(true);
  });

  it('full work item lifecycle: start → complete (§9.3.4)', async () => {
    // Start
    const { id } = await startWork(projectRoot, {
      description: 'Add User Auth',
      type: 'feature',
      priority: 'high',
    });

    // Read active item
    const active = await readWorkItem(projectRoot, id);
    expect(active.brief.frontMatter?.type).toBe('feature');
    expect(active.plan).not.toBeNull();

    // Complete
    await completeWork(projectRoot, id);

    // Read archived item
    const archived = await readWorkItem(projectRoot, id);
    expect(archived.brief.frontMatter?.status).toBe('completed');
    expect(archived.brief.frontMatter?.completedAt).toBeTruthy();

    // Counters updated
    const manifest = await readManifest(projectRoot);
    expect(manifest.counters.activeWork).toBe(0);
    expect(manifest.counters.totalCompleted).toBe(1);
  });

  it('decision creation and reading (§9.3.4)', async () => {
    await createDecision(projectRoot, {
      title: 'Use PostgreSQL',
      context: 'Need a relational DB.',
      decision: 'PostgreSQL 16.',
    });

    const decision = await readDecision(projectRoot, '001');
    expect(decision.document.frontMatter?.title).toBe('Use PostgreSQL');
    expect(decision.document.frontMatter?.status).toBe('accepted');

    const manifest = await readManifest(projectRoot);
    expect(manifest.counters.decisions).toBe(1);
  });

  it('maintains consistency after all operations', async () => {
    await startWork(projectRoot, { description: 'Feature A' });
    const { id } = await startWork(projectRoot, { description: 'Feature B' });
    await completeWork(projectRoot, id);
    await createDecision(projectRoot, { title: 'Decision 1' });

    const report = await validateConsistency(projectRoot);
    expect(report.valid).toBe(true);
    expect(report.issues).toHaveLength(0);
  });
});
