import { describe, it, expect } from 'vitest';
import {
  workIndexSchema,
  activeWorkEntrySchema,
  recentWorkEntrySchema,
  decisionsIndexSchema,
  releasesIndexSchema,
} from '../../src/schemas/indexes.js';

// ─── Work Index ─────────────────────────────────────────────────────────────

const workIndexExample = {
  active: [
    {
      id: 'add-dark-mode',
      title: 'Add Dark Mode',
      type: 'feature',
      phase: 'build',
      priority: 'medium',
      progress: 40,
      modules: ['web-app', 'shared-types'],
      createdAt: '2026-07-10T09:00:00Z',
      path: 'work/active/add-dark-mode',
    },
  ],
  recent: [
    {
      id: 'user-auth',
      title: 'User Authentication',
      type: 'feature',
      completedAt: '2026-07-09T18:00:00Z',
      path: 'work/archive/2026-07/user-auth',
    },
  ],
};

describe('workIndexSchema', () => {
  it('validates the spec example from §4.2.1', () => {
    expect(workIndexSchema.safeParse(workIndexExample).success).toBe(true);
  });

  it('accepts empty active and recent arrays', () => {
    expect(workIndexSchema.safeParse({ active: [], recent: [] }).success).toBe(true);
  });

  it('rejects recent array with more than 10 entries', () => {
    const entries = Array.from({ length: 11 }, (_, i) => ({
      id: `item-${String(i).padStart(2, '0')}`,
      title: `Item ${i}`,
      type: 'feature',
      completedAt: '2026-07-09T18:00:00Z',
      path: `work/archive/2026-07/item-${i}`,
    }));
    expect(workIndexSchema.safeParse({ active: [], recent: entries }).success).toBe(false);
  });

  it('accepts recent array with exactly 10 entries', () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${String(i).padStart(2, '0')}`,
      title: `Item ${i}`,
      type: 'feature',
      completedAt: '2026-07-09T18:00:00Z',
      path: `work/archive/2026-07/item-${i}`,
    }));
    expect(workIndexSchema.safeParse({ active: [], recent: entries }).success).toBe(true);
  });

  it('preserves unknown fields (§9.6.1)', () => {
    const data = { ...workIndexExample, futureField: 'hello' };
    const result = workIndexSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['futureField']).toBe('hello');
    }
  });
});

describe('activeWorkEntrySchema', () => {
  it('rejects missing required fields', () => {
    expect(activeWorkEntrySchema.safeParse({}).success).toBe(false);
    expect(activeWorkEntrySchema.safeParse({ id: 'test' }).success).toBe(false);
  });

  it('rejects title > 200 chars', () => {
    const entry = {
      ...workIndexExample.active[0],
      title: 'x'.repeat(201),
    };
    expect(activeWorkEntrySchema.safeParse(entry).success).toBe(false);
  });

  it('accepts unknown work type (extensible)', () => {
    const entry = { ...workIndexExample.active[0], type: 'custom-type' };
    expect(activeWorkEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('validates progress range 0-100', () => {
    const over = { ...workIndexExample.active[0], progress: 150 };
    expect(activeWorkEntrySchema.safeParse(over).success).toBe(false);

    const under = { ...workIndexExample.active[0], progress: -1 };
    expect(activeWorkEntrySchema.safeParse(under).success).toBe(false);
  });

  it('accepts entry without optional fields', () => {
    const minimal = {
      id: 'fix-bug',
      title: 'Fix Bug',
      type: 'bug',
      createdAt: '2026-07-10T09:00:00Z',
      path: 'work/active/fix-bug',
    };
    expect(activeWorkEntrySchema.safeParse(minimal).success).toBe(true);
  });
});

describe('recentWorkEntrySchema', () => {
  it('rejects missing completedAt', () => {
    const { completedAt: _, ...entry } = workIndexExample.recent[0]!;
    expect(recentWorkEntrySchema.safeParse(entry).success).toBe(false);
  });
});

// ─── Decisions Index ────────────────────────────────────────────────────────

const decisionsIndexExample = {
  entries: [
    {
      id: '001',
      slug: 'tech-stack',
      title: 'Use TypeScript + React + Node.js',
      status: 'accepted',
      date: '2026-07-08',
      supersedes: null,
      path: 'decisions/001-tech-stack.md',
    },
    {
      id: '002',
      slug: 'auth-strategy',
      title: 'JWT-based Authentication with Refresh Tokens',
      status: 'accepted',
      date: '2026-07-08',
      supersedes: null,
      path: 'decisions/002-auth-strategy.md',
    },
    {
      id: '005',
      slug: 'move-to-microservices',
      title: 'Migrate from Monolith to Microservices',
      status: 'accepted',
      date: '2026-09-15',
      supersedes: '001',
      path: 'decisions/005-move-to-microservices.md',
    },
  ],
};

describe('decisionsIndexSchema', () => {
  it('validates the spec example from §4.3.1', () => {
    expect(decisionsIndexSchema.safeParse(decisionsIndexExample).success).toBe(true);
  });

  it('accepts empty entries array', () => {
    expect(decisionsIndexSchema.safeParse({ entries: [] }).success).toBe(true);
  });

  it('rejects invalid decision ID format', () => {
    const data = {
      entries: [{
        id: '1', // not zero-padded
        slug: 'test',
        title: 'Test',
        status: 'accepted',
        date: '2026-07-08',
        path: 'decisions/001-test.md',
      }],
    };
    expect(decisionsIndexSchema.safeParse(data).success).toBe(false);
  });

  it('accepts supersedes as null', () => {
    const entry = decisionsIndexExample.entries[0];
    expect(entry?.supersedes).toBeNull();
    expect(decisionsIndexSchema.safeParse(decisionsIndexExample).success).toBe(true);
  });

  it('accepts supersedes as a valid decision ID', () => {
    const entry = decisionsIndexExample.entries[2];
    expect(entry?.supersedes).toBe('001');
    expect(decisionsIndexSchema.safeParse(decisionsIndexExample).success).toBe(true);
  });

  it('accepts unknown decision status (extensible)', () => {
    const data = {
      entries: [{
        id: '001',
        slug: 'test',
        title: 'Test',
        status: 'on-hold',
        date: '2026-07-08',
        path: 'decisions/001-test.md',
      }],
    };
    expect(decisionsIndexSchema.safeParse(data).success).toBe(true);
  });

  it('preserves unknown fields on entries', () => {
    const data = {
      entries: [{
        ...decisionsIndexExample.entries[0],
        futureField: true,
      }],
    };
    const result = decisionsIndexSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.entries[0] as Record<string, unknown>)?.['futureField']).toBe(true);
    }
  });
});

// ─── Releases Index ─────────────────────────────────────────────────────────

const releasesIndexExample = {
  entries: [
    {
      version: '0.1.0',
      title: 'Initial Alpha',
      date: '2026-07-15',
      path: 'releases/v0.1.0.md',
    },
    {
      version: '1.0.0',
      title: 'First Stable Release',
      date: '2026-08-01',
      path: 'releases/v1.0.0.md',
    },
  ],
};

describe('releasesIndexSchema', () => {
  it('validates the spec example from §4.4.1', () => {
    expect(releasesIndexSchema.safeParse(releasesIndexExample).success).toBe(true);
  });

  it('accepts empty entries array', () => {
    expect(releasesIndexSchema.safeParse({ entries: [] }).success).toBe(true);
  });

  it('rejects invalid SemVer version', () => {
    const data = {
      entries: [{
        version: 'v1.0', // invalid: has v prefix and missing patch
        date: '2026-07-15',
        path: 'releases/v1.0.md',
      }],
    };
    expect(releasesIndexSchema.safeParse(data).success).toBe(false);
  });

  it('accepts pre-release versions', () => {
    const data = {
      entries: [{
        version: '0.2.1-beta',
        date: '2026-07-15',
        path: 'releases/v0.2.1-beta.md',
      }],
    };
    expect(releasesIndexSchema.safeParse(data).success).toBe(true);
  });

  it('accepts entry without optional title', () => {
    const data = {
      entries: [{
        version: '1.0.0',
        date: '2026-07-15',
        path: 'releases/v1.0.0.md',
      }],
    };
    expect(releasesIndexSchema.safeParse(data).success).toBe(true);
  });
});
