import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { createDecision, supersedeDecision } from '../../src/operations/decision-create.js';
import { ItemNotFoundError } from '../../src/core/errors.js';
import { readJson, readMarkdown } from '../../src/core/reader.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { decisionsIndexSchema } from '../../src/schemas/indexes.js';
import { decisionFrontMatterSchema } from '../../src/schemas/objects.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('createDecision', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-decision-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('creates a decision file with correct ID', async () => {
    const result = await createDecision(projectRoot, { title: 'Use TypeScript' });

    expect(result.id).toBe('001');
    expect(result.slug).toBe('use-typescript');
    expect(result.path).toBe('decisions/001-use-typescript.md');
  });

  it('creates decision file with valid front matter', async () => {
    const { path } = await createDecision(projectRoot, {
      title: 'Use React',
      modules: ['web-app'],
    });

    const doc = await readMarkdown(
      join(projectRoot, '.sdlc', path),
      decisionFrontMatterSchema,
    );
    expect(doc.frontMatter?.id).toBe('001');
    expect(doc.frontMatter?.title).toBe('Use React');
    expect(doc.frontMatter?.status).toBe('accepted');
    expect(doc.frontMatter?.modules).toEqual(['web-app']);
  });

  it('increments decision IDs', async () => {
    const r1 = await createDecision(projectRoot, { title: 'First' });
    const r2 = await createDecision(projectRoot, { title: 'Second' });
    const r3 = await createDecision(projectRoot, { title: 'Third' });

    expect(r1.id).toBe('001');
    expect(r2.id).toBe('002');
    expect(r3.id).toBe('003');
  });

  it('updates decisions index (ordered by ID)', async () => {
    await createDecision(projectRoot, { title: 'First' });
    const { decisionsIndex } = await createDecision(projectRoot, { title: 'Second' });

    expect(decisionsIndex.entries).toHaveLength(2);
    expect(decisionsIndex.entries[0]?.id).toBe('001');
    expect(decisionsIndex.entries[1]?.id).toBe('002');
  });

  it('increments manifest.counters.decisions', async () => {
    await createDecision(projectRoot, { title: 'First' });
    const { manifest } = await createDecision(projectRoot, { title: 'Second' });

    expect(manifest.counters.decisions).toBe(2);
  });

  it('includes context, decision, and rationale in body', async () => {
    const { path } = await createDecision(projectRoot, {
      title: 'Use PostgreSQL',
      context: 'We need a relational database.',
      decision: 'Use PostgreSQL.',
      rationale: 'Best open-source RDBMS.',
    });

    const doc = await readMarkdown(join(projectRoot, '.sdlc', path));
    expect(doc.body).toContain('We need a relational database.');
    expect(doc.body).toContain('Use PostgreSQL.');
    expect(doc.body).toContain('Best open-source RDBMS.');
  });
});

describe('supersedeDecision', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-decision-'));
    await initSdlc({ projectRoot, name: 'Test' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('creates new decision that supersedes the old one', async () => {
    const old = await createDecision(projectRoot, { title: 'Use Monolith' });
    const result = await supersedeDecision(projectRoot, old.id, {
      title: 'Move to Microservices',
    });

    expect(result.id).toBe('002');

    // New decision has supersedes field
    const newDoc = await readMarkdown(
      join(projectRoot, '.sdlc', result.path),
      decisionFrontMatterSchema,
    );
    expect(newDoc.frontMatter?.supersedes).toBe('001');
  });

  it('updates old decision status to superseded', async () => {
    const old = await createDecision(projectRoot, { title: 'Use Monolith' });
    const result = await supersedeDecision(projectRoot, old.id, {
      title: 'Move to Microservices',
    });

    // Old decision file updated
    const oldDoc = await readMarkdown(
      join(projectRoot, '.sdlc', old.path),
      decisionFrontMatterSchema,
    );
    expect(oldDoc.frontMatter?.status).toBe('superseded');
    expect(oldDoc.frontMatter?.supersededBy).toBe(result.id);

    // Old entry in index updated
    const index = await readJson(
      join(projectRoot, '.sdlc', 'index', 'decisions.json'),
      decisionsIndexSchema,
    );
    const oldEntry = index.entries.find((e) => e.id === old.id);
    expect(oldEntry?.status).toBe('superseded');
  });

  it('preserves old decision id, slug, date, path (§4.3.5)', async () => {
    const old = await createDecision(projectRoot, { title: 'Original' });
    await supersedeDecision(projectRoot, old.id, { title: 'Replacement' });

    const index = await readJson(
      join(projectRoot, '.sdlc', 'index', 'decisions.json'),
      decisionsIndexSchema,
    );
    const oldEntry = index.entries.find((e) => e.id === old.id);
    expect(oldEntry?.id).toBe(old.id);
    expect(oldEntry?.slug).toBe(old.slug);
    expect(oldEntry?.path).toBe(old.path);
  });

  it('throws ItemNotFoundError for non-existent old decision', async () => {
    await expect(
      supersedeDecision(projectRoot, '999', { title: 'New' }),
    ).rejects.toThrow(ItemNotFoundError);
  });
});
