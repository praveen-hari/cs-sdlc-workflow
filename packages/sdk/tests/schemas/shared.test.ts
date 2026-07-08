import { describe, it, expect } from 'vitest';
import {
  identifierSchema,
  decisionIdSchema,
  iso8601Schema,
  dateSchema,
  monthSchema,
  phaseSchema,
  workTypeSchema,
  moduleTypeSchema,
  decisionStatusSchema,
  prioritySchema,
  gradeSchema,
  architectureTypeSchema,
  requirementStatusSchema,
  workItemStatusSchema,
  projectModeSchema,
  severitySchema,
  accessibilityStandardSchema,
  semverSchema,
} from '../../src/schemas/shared.js';

// ─── Identifiers ────────────────────────────────────────────────────────────

describe('identifierSchema', () => {
  const valid = [
    'add-dark-mode',
    'fix-safari-login',
    'auth-service',
    'ab',
    'a1',
    'web-app',
    'shared-types',
    'a'.repeat(64), // max length
  ];

  const invalid = [
    '',                          // empty
    'a',                         // too short (min 2)
    'Add_Dark_Mode',             // uppercase + underscores
    '--fix',                     // starts with hyphen
    '-fix',                      // starts with hyphen
    '1abc',                      // starts with digit
    'add--mode',                 // consecutive hyphens
    'add-dark-mode-',            // trailing hyphen
    'a'.repeat(65),              // too long
    'hello world',               // spaces
    'UPPER',                     // uppercase
    'with.dot',                  // dot
    'with_underscore',           // underscore
  ];

  it.each(valid)('accepts valid identifier: "%s"', (id) => {
    expect(identifierSchema.safeParse(id).success).toBe(true);
  });

  it.each(invalid)('rejects invalid identifier: "%s"', (id) => {
    expect(identifierSchema.safeParse(id).success).toBe(false);
  });
});

describe('decisionIdSchema', () => {
  const valid = ['001', '042', '100', '999'];
  const invalid = ['1', '01', '0001', 'abc', '00a', '', '1234'];

  it.each(valid)('accepts valid decision ID: "%s"', (id) => {
    expect(decisionIdSchema.safeParse(id).success).toBe(true);
  });

  it.each(invalid)('rejects invalid decision ID: "%s"', (id) => {
    expect(decisionIdSchema.safeParse(id).success).toBe(false);
  });
});

// ─── Dates ──────────────────────────────────────────────────────────────────

describe('iso8601Schema', () => {
  const valid = [
    '2026-07-08T10:00:00Z',
    '2026-07-08T10:00:00.000Z',
    '2026-07-08T10:00:00+05:30',
    '2026-07-08T10:00:00-04:00',
    '2026-07-08T10:00:00.123Z',
  ];

  const invalid = [
    '2026-07-08',                // date only
    '10:00:00Z',                 // time only
    '2026-07-08 10:00:00Z',     // space instead of T
    '2026-07-08T10:00:00',      // no timezone
    'not-a-date',
    '',
  ];

  it.each(valid)('accepts valid ISO 8601: "%s"', (d) => {
    expect(iso8601Schema.safeParse(d).success).toBe(true);
  });

  it.each(invalid)('rejects invalid ISO 8601: "%s"', (d) => {
    expect(iso8601Schema.safeParse(d).success).toBe(false);
  });
});

describe('dateSchema', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(dateSchema.safeParse('2026-07-08').success).toBe(true);
  });

  it('rejects full ISO 8601', () => {
    expect(dateSchema.safeParse('2026-07-08T10:00:00Z').success).toBe(false);
  });

  it('rejects YYYY-MM', () => {
    expect(dateSchema.safeParse('2026-07').success).toBe(false);
  });
});

describe('monthSchema', () => {
  it('accepts YYYY-MM', () => {
    expect(monthSchema.safeParse('2026-07').success).toBe(true);
  });

  it('rejects YYYY-MM-DD', () => {
    expect(monthSchema.safeParse('2026-07-08').success).toBe(false);
  });
});

// ─── Extensible Enums ───────────────────────────────────────────────────────

describe('extensible enums', () => {
  const enumTests = [
    { name: 'phaseSchema', schema: phaseSchema, known: 'build', unknown: 'custom-phase' },
    { name: 'workTypeSchema', schema: workTypeSchema, known: 'feature', unknown: 'custom-type' },
    { name: 'moduleTypeSchema', schema: moduleTypeSchema, known: 'frontend', unknown: 'mobile' },
    { name: 'decisionStatusSchema', schema: decisionStatusSchema, known: 'accepted', unknown: 'on-hold' },
    { name: 'prioritySchema', schema: prioritySchema, known: 'high', unknown: 'urgent' },
    { name: 'gradeSchema', schema: gradeSchema, known: 'A+', unknown: 'S' },
    { name: 'architectureTypeSchema', schema: architectureTypeSchema, known: 'monolith', unknown: 'event-driven' },
    { name: 'requirementStatusSchema', schema: requirementStatusSchema, known: 'draft', unknown: 'archived' },
    { name: 'workItemStatusSchema', schema: workItemStatusSchema, known: 'active', unknown: 'paused' },
    { name: 'projectModeSchema', schema: projectModeSchema, known: 'greenfield', unknown: 'migration' },
    { name: 'severitySchema', schema: severitySchema, known: 'critical', unknown: 'info' },
    { name: 'accessibilityStandardSchema', schema: accessibilityStandardSchema, known: 'wcag-aa', unknown: 'section-508' },
  ];

  it.each(enumTests)('$name accepts known value "$known"', ({ schema, known }) => {
    expect(schema.safeParse(known).success).toBe(true);
  });

  it.each(enumTests)('$name accepts unknown value "$unknown" (extensible per §9.6.1)', ({ schema, unknown }) => {
    expect(schema.safeParse(unknown).success).toBe(true);
  });

  it.each(enumTests)('$name rejects non-string values', ({ schema }) => {
    expect(schema.safeParse(42).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false);
  });
});

// ─── SemVer ─────────────────────────────────────────────────────────────────

describe('semverSchema', () => {
  const valid = [
    '1.0.0',
    '0.1.0',
    '0.0.1',
    '1.2.3-beta',
    '1.2.3-rc.1',
    '1.2.3+build.123',
    '1.2.3-beta+build.456',
    '0.2.1-beta',
  ];

  const invalid = [
    '1.0',           // missing patch
    '1',             // missing minor + patch
    'v1.0.0',        // leading v
    '1.0.0-',        // trailing hyphen
    'abc',
    '',
  ];

  it.each(valid)('accepts valid SemVer: "%s"', (v) => {
    expect(semverSchema.safeParse(v).success).toBe(true);
  });

  it.each(invalid)('rejects invalid SemVer: "%s"', (v) => {
    expect(semverSchema.safeParse(v).success).toBe(false);
  });
});
