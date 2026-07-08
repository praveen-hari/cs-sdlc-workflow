import { describe, it, expect } from 'vitest';
import { manifestSchema } from '../../src/schemas/manifest.js';

// ─── Spec Examples ──────────────────────────────────────────────────────────

/** Single-module example from §3.9.1 */
const singleModuleExample = {
  $schema: 'https://cs-sdlc.dev/schema/v1/manifest.json',
  specVersion: '1.0',
  magic: 'cs-sdlc' as const,
  project: {
    name: 'Budget Tracker',
    description: 'Personal budget tracking app for families',
    createdAt: '2026-07-08T10:00:00Z',
    mode: 'greenfield',
    stack: {
      language: 'typescript',
      framework: 'react',
      database: 'sqlite',
      testing: 'vitest',
      styling: 'tailwind',
    },
  },
  counters: {
    activeWork: 1,
    totalCompleted: 5,
    decisions: 3,
    releases: 1,
  },
  phase: 'build',
  health: {
    coverage: 82,
    grade: 'B+',
    securityIssues: 0,
    updatedAt: '2026-07-10T15:00:00Z',
  },
  gates: {
    minCoverage: 80,
    securityScan: true,
    accessibility: 'wcag-aa',
  },
};

/** Multi-module example from §3.9.2 */
const multiModuleExample = {
  $schema: 'https://cs-sdlc.dev/schema/v1/manifest.json',
  specVersion: '1.0',
  magic: 'cs-sdlc' as const,
  project: {
    name: 'E-Commerce Platform',
    description: 'Multi-service e-commerce platform',
    createdAt: '2026-07-08T10:00:00Z',
    mode: 'brownfield',
  },
  modules: {
    'web-app': {
      path: 'apps/web',
      type: 'frontend',
      stack: { language: 'typescript', framework: 'react', styling: 'tailwind' },
    },
    'auth-service': {
      path: 'services/auth',
      type: 'backend',
      stack: { language: 'csharp', framework: 'dotnet-8' },
    },
    'billing-service': {
      path: 'services/billing',
      type: 'backend',
      stack: { language: 'typescript', framework: 'express' },
    },
    'shared-types': {
      path: 'libs/shared',
      type: 'library',
      stack: { language: 'typescript' },
    },
  },
  counters: {
    activeWork: 2,
    totalCompleted: 15,
    decisions: 8,
    releases: 3,
  },
  phase: 'build',
  health: {
    coverage: 78,
    grade: 'B',
    securityIssues: 0,
    accessibilityIssues: 3,
    updatedAt: '2026-07-10T15:00:00Z',
  },
  gates: {
    minCoverage: 80,
    securityScan: true,
    accessibility: 'wcag-aa',
    performanceBudget: {
      lcp: '2.5s',
      fid: '100ms',
      cls: '0.1',
    },
  },
};

describe('manifestSchema', () => {
  // ── Spec examples ───────────────────────────────────────────────────────

  it('validates single-module example from §3.9.1', () => {
    const result = manifestSchema.safeParse(singleModuleExample);
    expect(result.success).toBe(true);
  });

  it('validates multi-module example from §3.9.2', () => {
    const result = manifestSchema.safeParse(multiModuleExample);
    expect(result.success).toBe(true);
  });

  // ── Minimal valid manifest ──────────────────────────────────────────────

  it('accepts minimal manifest (Level 1)', () => {
    const minimal = {
      specVersion: '1.0',
      magic: 'cs-sdlc',
      project: {
        name: 'Test',
        createdAt: '2026-07-08T10:00:00Z',
      },
      counters: {
        activeWork: 0,
        totalCompleted: 0,
        decisions: 0,
      },
    };
    const result = manifestSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      // releases defaults to 0
      expect(result.data.counters.releases).toBe(0);
    }
  });

  // ── Required field validation ───────────────────────────────────────────

  it('rejects missing specVersion', () => {
    const data = { ...singleModuleExample, specVersion: undefined };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects wrong magic string', () => {
    const data = { ...singleModuleExample, magic: 'wrong' };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects missing project.name', () => {
    const data = {
      ...singleModuleExample,
      project: { ...singleModuleExample.project, name: undefined },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects empty project.name', () => {
    const data = {
      ...singleModuleExample,
      project: { ...singleModuleExample.project, name: '' },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects project.name > 100 chars', () => {
    const data = {
      ...singleModuleExample,
      project: { ...singleModuleExample.project, name: 'x'.repeat(101) },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects project.description > 500 chars', () => {
    const data = {
      ...singleModuleExample,
      project: { ...singleModuleExample.project, description: 'x'.repeat(501) },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects missing project.createdAt', () => {
    const data = {
      ...singleModuleExample,
      project: { ...singleModuleExample.project, createdAt: undefined },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects invalid project.createdAt format', () => {
    const data = {
      ...singleModuleExample,
      project: { ...singleModuleExample.project, createdAt: '2026-07-08' },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects missing counters', () => {
    const { counters: _, ...data } = singleModuleExample;
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects negative counter values', () => {
    const data = {
      ...singleModuleExample,
      counters: { ...singleModuleExample.counters, activeWork: -1 },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  // ── Forward compatibility (§9.6.1) ─────────────────────────────────────

  it('preserves unknown fields at root level', () => {
    const data = { ...singleModuleExample, futureField: 'hello' };
    const result = manifestSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['futureField']).toBe('hello');
    }
  });

  it('preserves unknown fields in project object', () => {
    const data = {
      ...singleModuleExample,
      project: { ...singleModuleExample.project, futureField: true },
    };
    const result = manifestSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.project as Record<string, unknown>)['futureField']).toBe(true);
    }
  });

  it('preserves unknown fields in module entries', () => {
    const data = {
      ...multiModuleExample,
      modules: {
        ...multiModuleExample.modules,
        'web-app': {
          ...multiModuleExample.modules['web-app'],
          futureField: 42,
        },
      },
    };
    const result = manifestSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.modules?.['web-app'] as Record<string, unknown>)?.['futureField']).toBe(42);
    }
  });

  // ── Extensible enums ───────────────────────────────────────────────────

  it('accepts unknown phase value', () => {
    const data = { ...singleModuleExample, phase: 'custom-phase' };
    expect(manifestSchema.safeParse(data).success).toBe(true);
  });

  it('accepts unknown module type', () => {
    const data = {
      ...multiModuleExample,
      modules: {
        'custom-mod': {
          path: 'custom/',
          type: 'mobile',
          stack: { language: 'kotlin' },
        },
      },
    };
    expect(manifestSchema.safeParse(data).success).toBe(true);
  });

  it('accepts unknown grade value', () => {
    const data = {
      ...singleModuleExample,
      health: { ...singleModuleExample.health, grade: 'S' },
    };
    expect(manifestSchema.safeParse(data).success).toBe(true);
  });

  // ── Single-module shorthand (§3.4.4) ───────────────────────────────────

  it('accepts single-module shorthand (stack in project, no modules)', () => {
    const data = {
      specVersion: '1.0',
      magic: 'cs-sdlc' as const,
      project: {
        name: 'My App',
        createdAt: '2026-07-08T10:00:00Z',
        stack: {
          language: 'typescript',
          framework: 'react',
          database: 'sqlite',
        },
      },
      counters: { activeWork: 0, totalCompleted: 0, decisions: 0 },
    };
    const result = manifestSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.modules).toBeUndefined();
      expect(result.data.project.stack?.language).toBe('typescript');
    }
  });

  // ── Health & Gates ─────────────────────────────────────────────────────

  it('accepts manifest without health (optional)', () => {
    const { health: _, ...data } = singleModuleExample;
    expect(manifestSchema.safeParse(data).success).toBe(true);
  });

  it('accepts manifest without gates (optional)', () => {
    const { gates: _, ...data } = singleModuleExample;
    expect(manifestSchema.safeParse(data).success).toBe(true);
  });

  it('validates health.coverage range 0-100', () => {
    const data = {
      ...singleModuleExample,
      health: { coverage: 150 },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('validates gates.minCoverage range 0-100', () => {
    const data = {
      ...singleModuleExample,
      gates: { minCoverage: -5 },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  // ── Module entry validation ────────────────────────────────────────────

  it('rejects module with missing path', () => {
    const data = {
      ...multiModuleExample,
      modules: {
        'bad-mod': { type: 'frontend', stack: { language: 'typescript' } },
      },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects module with missing stack', () => {
    const data = {
      ...multiModuleExample,
      modules: {
        'bad-mod': { path: 'apps/bad', type: 'frontend' },
      },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('rejects module with missing stack.language', () => {
    const data = {
      ...multiModuleExample,
      modules: {
        'bad-mod': { path: 'apps/bad', type: 'frontend', stack: {} },
      },
    };
    expect(manifestSchema.safeParse(data).success).toBe(false);
  });

  it('accepts module with optional repo and branch fields (§8.5.3)', () => {
    const data = {
      ...multiModuleExample,
      modules: {
        'remote-svc': {
          path: '.',
          type: 'backend',
          stack: { language: 'csharp', framework: 'dotnet-8' },
          repo: 'https://github.com/org/remote-svc',
          branch: 'main',
          description: 'Remote service',
        },
      },
    };
    const result = manifestSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.modules?.['remote-svc']?.repo).toBe('https://github.com/org/remote-svc');
      expect(result.data.modules?.['remote-svc']?.branch).toBe('main');
    }
  });
});
