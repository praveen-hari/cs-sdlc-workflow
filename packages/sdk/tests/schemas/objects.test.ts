import { describe, it, expect } from 'vitest';
import {
  architectureFrontMatterSchema,
  conventionsFrontMatterSchema,
  requirementsFrontMatterSchema,
  stackFrontMatterSchema,
  briefFrontMatterSchema,
  planFrontMatterSchema,
  decisionFrontMatterSchema,
  releaseFrontMatterSchema,
} from '../../src/schemas/objects.js';

// ─── Context Document Front Matter ──────────────────────────────────────────

describe('architectureFrontMatterSchema', () => {
  it('accepts full front matter', () => {
    const data = { version: 3, updatedAt: '2026-07-10', type: 'modular' };
    expect(architectureFrontMatterSchema.safeParse(data).success).toBe(true);
  });

  it('accepts empty front matter (all optional)', () => {
    expect(architectureFrontMatterSchema.safeParse({}).success).toBe(true);
  });

  it('accepts unknown architecture type (extensible)', () => {
    const data = { type: 'event-driven' };
    expect(architectureFrontMatterSchema.safeParse(data).success).toBe(true);
  });

  it('preserves unknown YAML keys', () => {
    const data = { version: 1, customKey: 'value' };
    const result = architectureFrontMatterSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['customKey']).toBe('value');
    }
  });
});

describe('conventionsFrontMatterSchema', () => {
  it('accepts full front matter', () => {
    expect(conventionsFrontMatterSchema.safeParse({ version: 2, updatedAt: '2026-07-10' }).success).toBe(true);
  });

  it('accepts empty front matter', () => {
    expect(conventionsFrontMatterSchema.safeParse({}).success).toBe(true);
  });
});

describe('requirementsFrontMatterSchema', () => {
  it('accepts all status values', () => {
    for (const status of ['draft', 'approved', 'evolving']) {
      expect(requirementsFrontMatterSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it('accepts unknown status (extensible)', () => {
    expect(requirementsFrontMatterSchema.safeParse({ status: 'archived' }).success).toBe(true);
  });
});

describe('stackFrontMatterSchema', () => {
  it('accepts full front matter', () => {
    expect(stackFrontMatterSchema.safeParse({ version: 1, updatedAt: '2026-07-10' }).success).toBe(true);
  });
});

// ─── Work Item Front Matter ─────────────────────────────────────────────────

describe('briefFrontMatterSchema', () => {
  const validBrief = {
    type: 'feature',
    title: 'Add Dark Mode',
    priority: 'medium',
    modules: ['web-app', 'shared-types'],
    createdAt: '2026-07-10T09:00:00Z',
  };

  it('accepts the spec example from §5.4.2', () => {
    expect(briefFrontMatterSchema.safeParse(validBrief).success).toBe(true);
  });

  it('accepts minimal brief (required fields only)', () => {
    const minimal = {
      type: 'bug',
      title: 'Fix Login',
      createdAt: '2026-07-10T09:00:00Z',
    };
    expect(briefFrontMatterSchema.safeParse(minimal).success).toBe(true);
  });

  it('rejects missing type', () => {
    const { type: _, ...data } = validBrief;
    expect(briefFrontMatterSchema.safeParse(data).success).toBe(false);
  });

  it('rejects missing title', () => {
    const { title: _, ...data } = validBrief;
    expect(briefFrontMatterSchema.safeParse(data).success).toBe(false);
  });

  it('rejects missing createdAt', () => {
    const { createdAt: _, ...data } = validBrief;
    expect(briefFrontMatterSchema.safeParse(data).success).toBe(false);
  });

  it('rejects title > 200 chars', () => {
    const data = { ...validBrief, title: 'x'.repeat(201) };
    expect(briefFrontMatterSchema.safeParse(data).success).toBe(false);
  });

  it('accepts completed brief with completedAt and status', () => {
    const data = {
      ...validBrief,
      completedAt: '2026-07-12T18:00:00Z',
      status: 'completed',
    };
    expect(briefFrontMatterSchema.safeParse(data).success).toBe(true);
  });

  it('accepts abandoned status', () => {
    const data = { ...validBrief, status: 'abandoned' };
    expect(briefFrontMatterSchema.safeParse(data).success).toBe(true);
  });
});

describe('planFrontMatterSchema', () => {
  it('accepts the spec example from §5.4.3', () => {
    const data = { totalTasks: 5, completedTasks: 2, currentTask: 3 };
    expect(planFrontMatterSchema.safeParse(data).success).toBe(true);
  });

  it('accepts empty front matter (all optional)', () => {
    expect(planFrontMatterSchema.safeParse({}).success).toBe(true);
  });

  it('rejects negative task counts', () => {
    expect(planFrontMatterSchema.safeParse({ totalTasks: -1 }).success).toBe(false);
  });

  it('rejects currentTask < 1', () => {
    expect(planFrontMatterSchema.safeParse({ currentTask: 0 }).success).toBe(false);
  });
});

// ─── Decision Front Matter ──────────────────────────────────────────────────

describe('decisionFrontMatterSchema', () => {
  const validDecision = {
    id: '001',
    title: 'Use TypeScript + React + Node.js',
    status: 'accepted',
    date: '2026-07-08',
  };

  it('accepts the spec example from §5.5.2', () => {
    expect(decisionFrontMatterSchema.safeParse(validDecision).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(decisionFrontMatterSchema.safeParse({}).success).toBe(false);
    expect(decisionFrontMatterSchema.safeParse({ id: '001' }).success).toBe(false);
  });

  it('rejects invalid decision ID', () => {
    const data = { ...validDecision, id: '1' };
    expect(decisionFrontMatterSchema.safeParse(data).success).toBe(false);
  });

  it('accepts supersedes and supersededBy', () => {
    const data = {
      ...validDecision,
      status: 'superseded',
      supersededBy: '005',
    };
    expect(decisionFrontMatterSchema.safeParse(data).success).toBe(true);
  });

  it('accepts supersedes as null', () => {
    const data = { ...validDecision, supersedes: null };
    expect(decisionFrontMatterSchema.safeParse(data).success).toBe(true);
  });

  it('accepts modules array', () => {
    const data = { ...validDecision, modules: ['web-app', 'auth-service'] };
    expect(decisionFrontMatterSchema.safeParse(data).success).toBe(true);
  });
});

// ─── Release Front Matter ───────────────────────────────────────────────────

describe('releaseFrontMatterSchema', () => {
  it('accepts full front matter', () => {
    const data = { version: '1.0.0', date: '2026-08-01', title: 'First Stable Release' };
    expect(releaseFrontMatterSchema.safeParse(data).success).toBe(true);
  });

  it('accepts without optional title', () => {
    const data = { version: '0.1.0', date: '2026-07-15' };
    expect(releaseFrontMatterSchema.safeParse(data).success).toBe(true);
  });

  it('rejects invalid SemVer', () => {
    const data = { version: 'v1.0', date: '2026-07-15' };
    expect(releaseFrontMatterSchema.safeParse(data).success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const data = { version: '1.0.0', date: '2026-07-08T10:00:00Z' };
    expect(releaseFrontMatterSchema.safeParse(data).success).toBe(false);
  });

  it('accepts pre-release version', () => {
    const data = { version: '0.2.1-beta', date: '2026-07-15' };
    expect(releaseFrontMatterSchema.safeParse(data).success).toBe(true);
  });
});
