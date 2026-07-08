import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readJson, readMarkdown, fileExists } from '../../src/core/reader.js';
import { FileNotFoundError, ValidationError } from '../../src/core/errors.js';
import { manifestSchema } from '../../src/schemas/manifest.js';
import { briefFrontMatterSchema } from '../../src/schemas/objects.js';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { z } from 'zod';

describe('readJson', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sdlc-reader-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads and validates a JSON file', async () => {
    const filePath = join(dir, 'test.json');
    await writeFile(filePath, JSON.stringify({ name: 'hello' }));

    const schema = z.object({ name: z.string() });
    const result = await readJson(filePath, schema);
    expect(result).toEqual({ name: 'hello' });
  });

  it('throws FileNotFoundError for missing file', async () => {
    const schema = z.object({});
    await expect(readJson(join(dir, 'nope.json'), schema)).rejects.toThrow(FileNotFoundError);
  });

  it('throws ValidationError for invalid data', async () => {
    const filePath = join(dir, 'test.json');
    await writeFile(filePath, JSON.stringify({ wrong: true }));

    const schema = z.object({ name: z.string() });
    await expect(readJson(filePath, schema)).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for invalid JSON', async () => {
    const filePath = join(dir, 'bad.json');
    await writeFile(filePath, '{ not valid json }}}');

    const schema = z.object({});
    await expect(readJson(filePath, schema)).rejects.toThrow(ValidationError);
  });

  it('strips BOM from JSON files (§2.5.1)', async () => {
    const filePath = join(dir, 'bom.json');
    const bom = '\uFEFF';
    await writeFile(filePath, bom + JSON.stringify({ ok: true }));

    const schema = z.object({ ok: z.boolean() });
    const result = await readJson(filePath, schema);
    expect(result).toEqual({ ok: true });
  });

  it('reads a valid manifest', async () => {
    const filePath = join(dir, 'manifest.json');
    const manifest = {
      specVersion: '1.0',
      magic: 'cs-sdlc',
      project: { name: 'Test', createdAt: '2026-07-08T10:00:00Z' },
      counters: { activeWork: 0, totalCompleted: 0, decisions: 0 },
    };
    await writeFile(filePath, JSON.stringify(manifest));

    const result = await readJson(filePath, manifestSchema);
    expect(result.magic).toBe('cs-sdlc');
    expect(result.project.name).toBe('Test');
  });
});

describe('readMarkdown', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sdlc-reader-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads markdown with front matter', async () => {
    const filePath = join(dir, 'test.md');
    await writeFile(filePath, '---\ntitle: Hello\n---\n\n# Heading');

    const result = await readMarkdown(filePath);
    expect(result.frontMatter).toEqual({ title: 'Hello' });
    expect(result.body).toBe('# Heading');
  });

  it('reads markdown without front matter', async () => {
    const filePath = join(dir, 'test.md');
    await writeFile(filePath, '# Just Markdown');

    const result = await readMarkdown(filePath);
    expect(result.frontMatter).toBeNull();
    expect(result.body).toBe('# Just Markdown');
  });

  it('validates front matter against schema', async () => {
    const filePath = join(dir, 'brief.md');
    await writeFile(
      filePath,
      '---\ntype: feature\ntitle: Test\ncreatedAt: "2026-07-08T10:00:00Z"\n---\n\n# Test',
    );

    const result = await readMarkdown(filePath, briefFrontMatterSchema);
    expect(result.frontMatter?.type).toBe('feature');
    expect(result.frontMatter?.title).toBe('Test');
  });

  it('throws ValidationError for invalid front matter', async () => {
    const filePath = join(dir, 'brief.md');
    await writeFile(filePath, '---\ntype: 123\n---\n\n# Test');

    await expect(readMarkdown(filePath, briefFrontMatterSchema)).rejects.toThrow(ValidationError);
  });

  it('throws FileNotFoundError for missing file', async () => {
    await expect(readMarkdown(join(dir, 'nope.md'))).rejects.toThrow(FileNotFoundError);
  });

  it('strips BOM from markdown files', async () => {
    const filePath = join(dir, 'bom.md');
    await writeFile(filePath, '\uFEFF---\ntitle: BOM\n---\n\nBody');

    const result = await readMarkdown(filePath);
    expect(result.frontMatter).toEqual({ title: 'BOM' });
  });
});

describe('fileExists', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sdlc-reader-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns true for existing file', async () => {
    const filePath = join(dir, 'exists.txt');
    await writeFile(filePath, 'hello');
    expect(await fileExists(filePath)).toBe(true);
  });

  it('returns false for missing file', async () => {
    expect(await fileExists(join(dir, 'nope.txt'))).toBe(false);
  });
});
