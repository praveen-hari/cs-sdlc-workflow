import { describe, it, expect } from 'vitest';
import { detectModules } from '../../src/scanner/detect-modules.js';
import { join } from 'node:path';

const fixtures = join(import.meta.dirname, '..', 'fixtures', 'projects');

describe('detectModules', () => {
  it('detects modules in a Turborepo monorepo', async () => {
    const modules = await detectModules(join(fixtures, 'monorepo-turborepo'));
    expect(modules).not.toBeNull();
    expect(modules!.length).toBe(2);

    const web = modules!.find((m) => m.path.includes('web'));
    expect(web).toBeDefined();
    expect(web!.stack.language).toBe('typescript');
    expect(web!.stack.framework).toBe('react');
    expect(web!.type).toBe('frontend');

    const api = modules!.find((m) => m.path.includes('api'));
    expect(api).toBeDefined();
    expect(api!.stack.language).toBe('typescript');
    expect(api!.stack.framework).toBe('express');
    expect(api!.type).toBe('backend');
  });

  it('returns null for non-monorepo projects', async () => {
    const modules = await detectModules(join(fixtures, 'react-app'));
    expect(modules).toBeNull();
  });

  it('returns null for empty directory', async () => {
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const dir = await mkdtemp(join(tmpdir(), 'sdlc-empty-'));
    try {
      const modules = await detectModules(dir);
      expect(modules).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
