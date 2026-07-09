/**
 * Tests for context document CRUD operations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initSdlc, createContextDoc, updateContextDoc, readContextDoc } from '../../src/index.js';

describe('createContextDoc', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'ctx-crud-'));
    await initSdlc({ projectRoot, name: 'Test Project' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('creates a new context document', async () => {
    await createContextDoc({
      projectRoot,
      name: 'requirements',
      body: '# Requirements\n\n## User Stories\n\n- As a user, I can log in.\n',
    });

    const doc = await readContextDoc(projectRoot, 'requirements');
    expect(doc.name).toBe('requirements');
    expect(doc.document.body).toContain('# Requirements');
    expect(doc.document.body).toContain('As a user, I can log in.');
    expect(doc.document.frontMatter).toBeDefined();
    expect(doc.document.frontMatter!['version']).toBe(1);
    expect(doc.document.frontMatter!['updatedAt']).toBeDefined();
  });

  it('creates a context document with custom front matter', async () => {
    await createContextDoc({
      projectRoot,
      name: 'stack',
      body: '# Technology Stack\n\n- React 19\n- TypeScript 5.5\n',
      frontMatter: { language: 'typescript', framework: 'react' },
    });

    const doc = await readContextDoc(projectRoot, 'stack');
    expect(doc.document.frontMatter!['language']).toBe('typescript');
    expect(doc.document.frontMatter!['framework']).toBe('react');
    expect(doc.document.frontMatter!['version']).toBe(1);
  });

  it('throws AlreadyExistsError if document exists and overwrite is false', async () => {
    // architecture.md is created by initSdlc
    await expect(
      createContextDoc({
        projectRoot,
        name: 'architecture',
        body: '# New Architecture',
      }),
    ).rejects.toThrow('already exists');
  });

  it('overwrites existing document when overwrite is true', async () => {
    await createContextDoc({
      projectRoot,
      name: 'architecture',
      body: '# Updated Architecture\n\nThis is the new architecture.\n',
      overwrite: true,
    });

    const doc = await readContextDoc(projectRoot, 'architecture');
    expect(doc.document.body).toContain('Updated Architecture');
    expect(doc.document.body).toContain('This is the new architecture.');
  });

  it('creates a custom-named context document', async () => {
    await createContextDoc({
      projectRoot,
      name: 'api-design',
      body: '# API Design\n\n## Endpoints\n\n- GET /users\n- POST /users\n',
    });

    const doc = await readContextDoc(projectRoot, 'api-design');
    expect(doc.name).toBe('api-design');
    expect(doc.document.body).toContain('GET /users');
  });
});

describe('updateContextDoc', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'ctx-update-'));
    await initSdlc({ projectRoot, name: 'Test Project' });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('updates the body of an existing context document', async () => {
    await updateContextDoc({
      projectRoot,
      name: 'architecture',
      body: '# Test Project — Architecture\n\n## System Overview\n\nThis is a monorepo with 3 packages.\n',
    });

    const doc = await readContextDoc(projectRoot, 'architecture');
    expect(doc.document.body).toContain('This is a monorepo with 3 packages.');
  });

  it('merges front matter without losing existing fields', async () => {
    // architecture.md has version: 1 from init
    await updateContextDoc({
      projectRoot,
      name: 'architecture',
      frontMatter: { type: 'monorepo', modules: 3 },
    });

    const doc = await readContextDoc(projectRoot, 'architecture');
    expect(doc.document.frontMatter!['version']).toBe(1); // preserved
    expect(doc.document.frontMatter!['type']).toBe('monorepo'); // added
    expect(doc.document.frontMatter!['modules']).toBe(3); // added
    expect(doc.document.frontMatter!['updatedAt']).toBeDefined(); // refreshed
  });

  it('preserves body when only updating front matter', async () => {
    // First, set a known body
    await createContextDoc({
      projectRoot,
      name: 'architecture',
      body: '# Architecture\n\nKeep this body.\n',
      overwrite: true,
    });

    // Update only front matter
    await updateContextDoc({
      projectRoot,
      name: 'architecture',
      frontMatter: { reviewed: true },
    });

    const doc = await readContextDoc(projectRoot, 'architecture');
    expect(doc.document.body).toContain('Keep this body.');
    expect(doc.document.frontMatter!['reviewed']).toBe(true);
  });

  it('throws ItemNotFoundError for non-existent document', async () => {
    await expect(
      updateContextDoc({
        projectRoot,
        name: 'nonexistent',
        body: 'test',
      }),
    ).rejects.toThrow('not found');
  });

  it('updates both body and front matter simultaneously', async () => {
    await updateContextDoc({
      projectRoot,
      name: 'conventions',
      body: '# Code Conventions\n\n## Naming\n\n- Use camelCase for variables.\n- Use PascalCase for components.\n',
      frontMatter: { language: 'typescript', strict: true },
    });

    const doc = await readContextDoc(projectRoot, 'conventions');
    expect(doc.document.body).toContain('Use camelCase for variables.');
    expect(doc.document.frontMatter!['language']).toBe('typescript');
    expect(doc.document.frontMatter!['strict']).toBe(true);
  });
});
