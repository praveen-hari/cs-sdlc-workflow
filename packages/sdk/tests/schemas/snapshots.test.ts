import { describe, it, expect } from 'vitest';
import {
  latestSnapshotSchema,
  historySnapshotSchema,
  overallSchema,
  coverageSchema,
  testsSchema,
  securitySchema,
  accessibilitySchema,
  accessibilityDetailSchema,
  complexitySchema,
  moduleMetricsSchema,
} from '../../src/schemas/snapshots.js';

// ─── Spec Example ───────────────────────────────────────────────────────────

const latestExample = {
  generatedAt: '2026-07-10T15:00:00Z',
  generator: 'cs-sdlc-analyze@1.0.0',
  overall: { grade: 'B+', score: 82 },
  coverage: { total: 82, unit: 88, integration: 75, e2e: 60 },
  tests: { total: 47, passing: 47, failing: 0, skipped: 2 },
  security: { vulnerabilities: 0, advisories: [], outdatedDeps: 3 },
  accessibility: {
    violations: 3,
    standard: 'wcag-aa',
    details: [
      { rule: 'color-contrast', count: 2, severity: 'serious' },
      { rule: 'aria-label', count: 1, severity: 'moderate' },
    ],
  },
  complexity: {
    maxFunctionComplexity: 12,
    avgFunctionComplexity: 4,
    filesOverThreshold: 2,
  },
  modules: {
    'web-app': {
      coverage: 85,
      tests: { passing: 120, failing: 0 },
      security: { vulnerabilities: 0 },
    },
    'auth-service': {
      coverage: 91,
      tests: { passing: 67, failing: 0 },
      security: { vulnerabilities: 0 },
    },
  },
};

const historyExample = {
  month: '2026-07',
  snapshots: [
    {
      date: '2026-07-10',
      overall: { grade: 'B', score: 78 },
      coverage: { total: 78 },
      tests: { total: 34, passing: 34, failing: 0 },
      security: { vulnerabilities: 1 },
    },
    {
      date: '2026-07-20',
      overall: { grade: 'B+', score: 82 },
      coverage: { total: 82 },
      tests: { total: 47, passing: 47, failing: 0 },
      security: { vulnerabilities: 0 },
    },
  ],
};

// ─── Latest Snapshot ────────────────────────────────────────────────────────

describe('latestSnapshotSchema', () => {
  it('validates the full spec example from §6.2.1', () => {
    expect(latestSnapshotSchema.safeParse(latestExample).success).toBe(true);
  });

  it('accepts minimal snapshot (required fields only)', () => {
    const minimal = {
      generatedAt: '2026-07-10T15:00:00Z',
      overall: { grade: 'C' },
    };
    expect(latestSnapshotSchema.safeParse(minimal).success).toBe(true);
  });

  it('rejects missing generatedAt', () => {
    const { generatedAt: _, ...data } = latestExample;
    expect(latestSnapshotSchema.safeParse(data).success).toBe(false);
  });

  it('rejects missing overall', () => {
    const { overall: _, ...data } = latestExample;
    expect(latestSnapshotSchema.safeParse(data).success).toBe(false);
  });

  it('preserves unknown fields', () => {
    const data = { ...latestExample, futureMetric: { value: 42 } };
    const result = latestSnapshotSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['futureMetric']).toEqual({ value: 42 });
    }
  });
});

// ─── Sub-Object Schemas ─────────────────────────────────────────────────────

describe('overallSchema', () => {
  it('accepts grade + score', () => {
    expect(overallSchema.safeParse({ grade: 'A+', score: 95 }).success).toBe(true);
  });

  it('accepts grade only', () => {
    expect(overallSchema.safeParse({ grade: 'B' }).success).toBe(true);
  });

  it('rejects score > 100', () => {
    expect(overallSchema.safeParse({ grade: 'A', score: 150 }).success).toBe(false);
  });

  it('accepts unknown grade (extensible)', () => {
    expect(overallSchema.safeParse({ grade: 'S' }).success).toBe(true);
  });
});

describe('coverageSchema', () => {
  it('accepts full coverage', () => {
    expect(coverageSchema.safeParse({ total: 82, unit: 88, integration: 75, e2e: 60 }).success).toBe(true);
  });

  it('requires total', () => {
    expect(coverageSchema.safeParse({ unit: 88 }).success).toBe(false);
  });

  it('rejects coverage > 100', () => {
    expect(coverageSchema.safeParse({ total: 150 }).success).toBe(false);
  });
});

describe('testsSchema', () => {
  it('accepts full test results', () => {
    expect(testsSchema.safeParse({ total: 47, passing: 47, failing: 0, skipped: 2 }).success).toBe(true);
  });

  it('requires total, passing, failing', () => {
    expect(testsSchema.safeParse({ total: 47 }).success).toBe(false);
    expect(testsSchema.safeParse({ total: 47, passing: 47 }).success).toBe(false);
  });
});

describe('securitySchema', () => {
  it('accepts full security results', () => {
    expect(securitySchema.safeParse({ vulnerabilities: 0, advisories: ['CVE-2026-1234'], outdatedDeps: 3 }).success).toBe(true);
  });

  it('requires vulnerabilities count', () => {
    expect(securitySchema.safeParse({}).success).toBe(false);
  });
});

describe('accessibilityDetailSchema', () => {
  it('accepts valid detail entry', () => {
    expect(accessibilityDetailSchema.safeParse({ rule: 'color-contrast', count: 2, severity: 'serious' }).success).toBe(true);
  });

  it('accepts unknown severity (extensible)', () => {
    expect(accessibilityDetailSchema.safeParse({ rule: 'test', count: 1, severity: 'info' }).success).toBe(true);
  });
});

describe('accessibilitySchema', () => {
  it('requires violations count', () => {
    expect(accessibilitySchema.safeParse({}).success).toBe(false);
    expect(accessibilitySchema.safeParse({ violations: 3 }).success).toBe(true);
  });
});

describe('complexitySchema', () => {
  it('accepts all optional fields', () => {
    expect(complexitySchema.safeParse({}).success).toBe(true);
    expect(complexitySchema.safeParse({ maxFunctionComplexity: 12, avgFunctionComplexity: 4, filesOverThreshold: 2 }).success).toBe(true);
  });
});

describe('moduleMetricsSchema', () => {
  it('accepts per-module metrics from spec example', () => {
    const data = {
      coverage: 85,
      tests: { passing: 120, failing: 0 },
      security: { vulnerabilities: 0 },
    };
    expect(moduleMetricsSchema.safeParse(data).success).toBe(true);
  });

  it('accepts empty module metrics', () => {
    expect(moduleMetricsSchema.safeParse({}).success).toBe(true);
  });

  it('preserves unknown metric fields', () => {
    const data = { coverage: 85, customMetric: 42 };
    const result = moduleMetricsSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['customMetric']).toBe(42);
    }
  });
});

// ─── Historical Snapshots ───────────────────────────────────────────────────

describe('historySnapshotSchema', () => {
  it('validates the spec example from §6.3.1', () => {
    expect(historySnapshotSchema.safeParse(historyExample).success).toBe(true);
  });

  it('accepts empty snapshots array', () => {
    expect(historySnapshotSchema.safeParse({ month: '2026-07', snapshots: [] }).success).toBe(true);
  });

  it('rejects more than 4 entries per month (§6.3.3)', () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      overall: { grade: 'B' },
    }));
    expect(historySnapshotSchema.safeParse({ month: '2026-07', snapshots: entries }).success).toBe(false);
  });

  it('accepts exactly 4 entries', () => {
    const entries = Array.from({ length: 4 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      overall: { grade: 'B' },
    }));
    expect(historySnapshotSchema.safeParse({ month: '2026-07', snapshots: entries }).success).toBe(true);
  });

  it('rejects invalid month format', () => {
    expect(historySnapshotSchema.safeParse({ month: '2026-07-08', snapshots: [] }).success).toBe(false);
  });
});
