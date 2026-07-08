/**
 * Snapshot schemas — Layer 4 of the .sdlc/ format.
 *
 * Defines schemas for latest snapshot and historical snapshots
 * per Chapter 6.
 *
 * @module
 */

import { z } from 'zod';
import { gradeSchema, severitySchema, monthSchema } from './shared.js';

// ─── Snapshot Sub-Objects ───────────────────────────────────────────────────

/** Overall quality score per §6.2.3. */
export const overallSchema = z
  .object({
    grade: gradeSchema,
    score: z.number().min(0).max(100).optional(),
  })
  .passthrough();

/** Test coverage metrics per §6.2.4. */
export const coverageSchema = z
  .object({
    total: z.number().min(0).max(100),
    unit: z.number().min(0).max(100).optional(),
    integration: z.number().min(0).max(100).optional(),
    e2e: z.number().min(0).max(100).optional(),
  })
  .passthrough();

/** Test execution results per §6.2.5. */
export const testsSchema = z
  .object({
    total: z.number().int().min(0),
    passing: z.number().int().min(0),
    failing: z.number().int().min(0),
    skipped: z.number().int().min(0).optional(),
  })
  .passthrough();

/** Security scan results per §6.2.6. */
export const securitySchema = z
  .object({
    vulnerabilities: z.number().int().min(0),
    advisories: z.array(z.string()).optional(),
    outdatedDeps: z.number().int().min(0).optional(),
  })
  .passthrough();

/** Accessibility violation detail per §6.2.7. */
export const accessibilityDetailSchema = z
  .object({
    rule: z.string().min(1),
    count: z.number().int().min(0),
    severity: severitySchema,
  })
  .passthrough();

/** Accessibility audit results per §6.2.7. */
export const accessibilitySchema = z
  .object({
    violations: z.number().int().min(0),
    standard: z.string().optional(),
    details: z.array(accessibilityDetailSchema).optional(),
  })
  .passthrough();

/** Code complexity metrics per §6.2.8. */
export const complexitySchema = z
  .object({
    maxFunctionComplexity: z.number().optional(),
    avgFunctionComplexity: z.number().optional(),
    filesOverThreshold: z.number().int().min(0).optional(),
  })
  .passthrough();

/** Per-module metrics per §6.2.9. Accepts any subset of top-level metrics. */
export const moduleMetricsSchema = z
  .object({
    coverage: z.number().min(0).max(100).optional(),
    tests: z
      .object({
        passing: z.number().int().min(0).optional(),
        failing: z.number().int().min(0).optional(),
      })
      .passthrough()
      .optional(),
    security: z
      .object({
        vulnerabilities: z.number().int().min(0).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// ─── Latest Snapshot ────────────────────────────────────────────────────────

/** Complete latest.json schema per §6.2. */
export const latestSnapshotSchema = z
  .object({
    generatedAt: z.string(),
    generator: z.string().optional(),
    overall: overallSchema,
    coverage: coverageSchema.optional(),
    tests: testsSchema.optional(),
    security: securitySchema.optional(),
    accessibility: accessibilitySchema.optional(),
    complexity: complexitySchema.optional(),
    modules: z.record(z.string(), moduleMetricsSchema).optional(),
  })
  .passthrough();

// ─── Historical Snapshots ───────────────────────────────────────────────────

/** Summary entry within a monthly history file per §6.3.2. */
export const historyEntrySchema = z
  .object({
    date: z.string(),
    overall: overallSchema.optional(),
    coverage: z.object({ total: z.number() }).passthrough().optional(),
    tests: z
      .object({
        total: z.number().int().min(0),
        passing: z.number().int().min(0),
        failing: z.number().int().min(0),
      })
      .passthrough()
      .optional(),
    security: z
      .object({
        vulnerabilities: z.number().int().min(0),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/** Monthly history file schema per §6.3. */
export const historySnapshotSchema = z
  .object({
    month: monthSchema,
    snapshots: z.array(historyEntrySchema).max(4),
  })
  .passthrough();
