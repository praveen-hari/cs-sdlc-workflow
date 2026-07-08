import { describe, it, expect } from 'vitest';
import { detectStack, detectArtifacts } from '../../src/scanner/detect-stack.js';
import { join } from 'node:path';

const fixtures = join(import.meta.dirname, '..', 'fixtures', 'projects');

describe('detectStack', () => {
  it('detects React + TypeScript project', async () => {
    const stack = await detectStack(join(fixtures, 'react-app'));
    expect(stack).not.toBeNull();
    expect(stack!.language).toBe('typescript');
    expect(stack!.framework).toBe('react');
    expect(stack!.testing).toBe('vitest');
    expect(stack!.styling).toBe('tailwind');
    expect(stack!.confidence).toBe('high');
  });

  it('detects .NET project', async () => {
    const stack = await detectStack(join(fixtures, 'dotnet-api'));
    expect(stack).not.toBeNull();
    expect(stack!.language).toBe('csharp');
    expect(stack!.framework).toBe('dotnet-8.0');
    expect(stack!.confidence).toBe('high');
  });

  it('detects Python + FastAPI project', async () => {
    const stack = await detectStack(join(fixtures, 'python-fastapi'));
    expect(stack).not.toBeNull();
    expect(stack!.language).toBe('python');
    expect(stack!.framework).toBe('fastapi');
    expect(stack!.database).toBe('sqlalchemy');
    expect(stack!.confidence).toBe('high');
  });

  it('detects Go + Gin project', async () => {
    const stack = await detectStack(join(fixtures, 'go-service'));
    expect(stack).not.toBeNull();
    expect(stack!.language).toBe('go');
    expect(stack!.framework).toBe('gin');
    expect(stack!.confidence).toBe('high');
  });

  it('returns null for empty directory', async () => {
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const dir = await mkdtemp(join(tmpdir(), 'sdlc-empty-'));
    try {
      const stack = await detectStack(dir);
      expect(stack).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('detectArtifacts', () => {
  it('detects no artifacts in fixture projects', async () => {
    const artifacts = await detectArtifacts(join(fixtures, 'react-app'));
    // Fixture doesn't have CI, docs, etc.
    expect(artifacts.hasCI).toBe(false);
    expect(artifacts.hasDesignSystem).toBe(false);
  });
});
