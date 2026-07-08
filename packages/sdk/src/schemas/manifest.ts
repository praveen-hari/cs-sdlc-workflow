/**
 * Manifest schema — Layer 1 of the .sdlc/ format.
 *
 * Defines the complete manifest.json schema per Chapter 3:
 * project, modules, counters, phase, health, gates.
 *
 * @module
 */

import { z } from 'zod';
import {
  identifierSchema,
  iso8601Schema,
  phaseSchema,
  moduleTypeSchema,
  gradeSchema,
  projectModeSchema,
  accessibilityStandardSchema,
} from './shared.js';

// ─── Stack ──────────────────────────────────────────────────────────────────

/** Technology stack per §3.4.3. */
export const stackSchema = z
  .object({
    language: z.string().min(1),
    framework: z.string().optional(),
    runtime: z.string().optional(),
    database: z.string().optional(),
    testing: z.string().optional(),
    styling: z.string().optional(),
  })
  .passthrough();

// ─── Project ────────────────────────────────────────────────────────────────

/** Project identity per §3.3. */
export const projectSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    createdAt: iso8601Schema,
    mode: projectModeSchema.optional(),
    stack: stackSchema.optional(),
  })
  .passthrough();

// ─── Module Entry ───────────────────────────────────────────────────────────

/** Single module entry per §3.4.1. */
export const moduleEntrySchema = z
  .object({
    path: z.string().min(1),
    type: moduleTypeSchema,
    stack: stackSchema,
    repo: z.string().optional(),
    branch: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

// ─── Counters ───────────────────────────────────────────────────────────────

/** Aggregate counts per §3.5. */
export const countersSchema = z
  .object({
    activeWork: z.number().int().min(0),
    totalCompleted: z.number().int().min(0),
    decisions: z.number().int().min(0),
    releases: z.number().int().min(0),
  })
  .passthrough();

// ─── Health ─────────────────────────────────────────────────────────────────

/** Quality metrics per §3.7. */
export const healthSchema = z
  .object({
    coverage: z.number().min(0).max(100).optional(),
    grade: gradeSchema.optional(),
    securityIssues: z.number().int().min(0).optional(),
    accessibilityIssues: z.number().int().min(0).optional(),
    updatedAt: iso8601Schema.optional(),
  })
  .passthrough();

// ─── Performance Budget ─────────────────────────────────────────────────────

/** Performance budget per §3.8.1. Keys are metric names, values are thresholds. */
export const performanceBudgetSchema = z.record(z.string(), z.string());

// ─── Gates ──────────────────────────────────────────────────────────────────

/** Quality gate thresholds per §3.8. */
export const gatesSchema = z
  .object({
    minCoverage: z.number().min(0).max(100).optional(),
    securityScan: z.boolean().optional(),
    accessibility: accessibilityStandardSchema.optional(),
    performanceBudget: performanceBudgetSchema.optional(),
  })
  .passthrough();

// ─── Manifest ───────────────────────────────────────────────────────────────

/** Complete manifest.json schema per Chapter 3. */
export const manifestSchema = z
  .object({
    $schema: z.string().optional(),
    specVersion: z.string(),
    magic: z.literal('cs-sdlc'),
    project: projectSchema,
    modules: z.record(identifierSchema, moduleEntrySchema).optional(),
    counters: countersSchema,
    phase: phaseSchema.optional(),
    health: healthSchema.optional(),
    gates: gatesSchema.optional(),
  })
  .passthrough();
