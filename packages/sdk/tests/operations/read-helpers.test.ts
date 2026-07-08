import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { startWork } from '../../src/operations/work-start.js';
import { completeWork } from '../../src/operations/work-complete.js';
import { createDecision } from '../../src/operations/decision-create.js';
import { createRelease } from '../../src/operations/release-create.js';
import { generateSnapshot } from '../../src/operations/snapshot-generate.js';
import {
  readManifest, readWorkIndex, readDecisionsIndex, readReleasesIndex,
  readContextDoc, readWorkItem, readDecision, readRelease,
  readLatestSnapshot, readHistoricalSnapshot,
} from '../../src/operations/read-helpers.js';
import { ItemNotFoundError, FileNotFoundError } from '../../src/core/errors.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('read helpers', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-read-'));
    await initSdlc({ projectRoot, name: 'Test Project' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('readManifest returns valid manifest', async () => {
    const m = await readManifest(projectRoot);
    expect(m.magic).toBe('cs-sdlc');
    expect(m.project.name).toBe('Test Project');
  });

  it('readWorkIndex returns work index', async () => {
    await startWork(projectRoot, { description: 'Item' });
    const idx = await readWorkIndex(projectRoot);
    expect(idx.active).toHaveLength(1);
  });

  it('readDecisionsIndex returns decisions index', async () => {
    await createDecision(projectRoot, { title: 'Decision' });
    const idx = await readDecisionsIndex(projectRoot);
    expect(idx.entries).toHaveLength(1);
  });

  it('readReleasesIndex returns releases index', async () => {
    await createRelease(projectRoot, { version: '1.0.0' });
    const idx = await readReleasesIndex(projectRoot);
    expect(idx.entries).toHaveLength(1);
  });

  it('readContextDoc reads architecture.md', async () => {
    const doc = await readContextDoc(projectRoot, 'architecture');
    expect(doc.name).toBe('architecture');
    expect(doc.document.body).toContain('Architecture');
  });

  it('readWorkItem reads active work item', async () => {
    const { id } = await startWork(projectRoot, { description: 'My Feature' });
    const item = await readWorkItem(projectRoot, id);
    expect(item.id).toBe(id);
    expect(item.brief.frontMatter?.title).toBe('My Feature');
    expect(item.plan).not.toBeNull();
  });

  it('readWorkItem reads archived work item', async () => {
    const { id } = await startWork(projectRoot, { description: 'Done Item' });
    await completeWork(projectRoot, id);

    const item = await readWorkItem(projectRoot, id);
    expect(item.id).toBe(id);
    expect(item.brief.frontMatter?.status).toBe('completed');
  });

  it('readWorkItem throws for non-existent item', async () => {
    await expect(readWorkItem(projectRoot, 'nope')).rejects.toThrow(ItemNotFoundError);
  });

  it('readDecision reads a decision record', async () => {
    await createDecision(projectRoot, { title: 'Use TypeScript' });
    const dec = await readDecision(projectRoot, '001');
    expect(dec.id).toBe('001');
    expect(dec.document.frontMatter?.title).toBe('Use TypeScript');
  });

  it('readDecision throws for non-existent decision', async () => {
    await expect(readDecision(projectRoot, '999')).rejects.toThrow(ItemNotFoundError);
  });

  it('readRelease reads a release record', async () => {
    await createRelease(projectRoot, { version: '1.0.0', title: 'First' });
    const rel = await readRelease(projectRoot, '1.0.0');
    expect(rel.version).toBe('1.0.0');
    expect(rel.document.frontMatter?.title).toBe('First');
  });

  it('readRelease throws for non-existent release', async () => {
    await expect(readRelease(projectRoot, '9.9.9')).rejects.toThrow(ItemNotFoundError);
  });

  it('readLatestSnapshot reads snapshot', async () => {
    await generateSnapshot(projectRoot, { grade: 'A', coverage: 95 });
    const snap = await readLatestSnapshot(projectRoot);
    expect(snap.overall.grade).toBe('A');
  });

  it('readLatestSnapshot throws when no snapshot exists', async () => {
    await expect(readLatestSnapshot(projectRoot)).rejects.toThrow(FileNotFoundError);
  });

  it('readHistoricalSnapshot reads monthly history', async () => {
    await generateSnapshot(projectRoot, { grade: 'B' });
    const month = new Date().toISOString().slice(0, 7);
    const history = await readHistoricalSnapshot(projectRoot, month);
    expect(history.month).toBe(month);
    expect(history.snapshots.length).toBeGreaterThan(0);
  });
});
