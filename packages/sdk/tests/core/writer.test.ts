import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeJsonAtomic, writeMarkdown } from '../../src/core/writer.js';
import { readFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('writeJsonAtomic', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sdlc-writer-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes valid JSON with 2-space indentation', async () => {
    const filePath = join(dir, 'test.json');
    await writeJsonAtomic(filePath, { key: 'value', num: 42 });

    const content = await readFile(filePath, 'utf-8');
    expect(content).toBe('{\n  "key": "value",\n  "num": 42\n}\n');
  });

  it('ends with trailing newline', async () => {
    const filePath = join(dir, 'test.json');
    await writeJsonAtomic(filePath, {});

    const content = await readFile(filePath, 'utf-8');
    expect(content.endsWith('\n')).toBe(true);
  });

  it('creates parent directories if needed', async () => {
    const filePath = join(dir, 'nested', 'deep', 'test.json');
    await writeJsonAtomic(filePath, { ok: true });

    const content = await readFile(filePath, 'utf-8');
    expect(JSON.parse(content)).toEqual({ ok: true });
  });

  it('does not leave temp file on success', async () => {
    const filePath = join(dir, 'test.json');
    await writeJsonAtomic(filePath, { ok: true });

    await expect(stat(filePath + '.tmp')).rejects.toThrow();
  });

  it('overwrites existing file atomically', async () => {
    const filePath = join(dir, 'test.json');
    await writeJsonAtomic(filePath, { version: 1 });
    await writeJsonAtomic(filePath, { version: 2 });

    const content = await readFile(filePath, 'utf-8');
    expect(JSON.parse(content)).toEqual({ version: 2 });
  });

  it('warns when manifest exceeds 2 KB', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const filePath = join(dir, 'manifest.json');
    const largeData = { data: 'x'.repeat(3000) };

    await writeJsonAtomic(filePath, largeData);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('exceeding the 2048 byte limit'),
    );
    warnSpy.mockRestore();
  });

  it('does not warn for small manifest', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const filePath = join(dir, 'manifest.json');

    await writeJsonAtomic(filePath, { small: true });

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('writeMarkdown', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sdlc-writer-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes markdown content', async () => {
    const filePath = join(dir, 'test.md');
    await writeMarkdown(filePath, '# Hello\n\nWorld');

    const content = await readFile(filePath, 'utf-8');
    expect(content).toBe('# Hello\n\nWorld');
  });

  it('creates parent directories', async () => {
    const filePath = join(dir, 'context', 'architecture.md');
    await writeMarkdown(filePath, '# Arch');

    const content = await readFile(filePath, 'utf-8');
    expect(content).toBe('# Arch');
  });
});
