/**
 * Shared schemas — building blocks used by all other schema files.
 *
 * Covers: identifiers, dates, enums (phase, work type, module type,
 * decision status, priority, grade, architecture type, requirement status).
 *
 * All enums use the extensible pattern:
 *   z.union([z.enum([...known]), z.string()])
 * so unknown values are preserved per §9.6.1.
 *
 * @module
 */

import { z } from 'zod';

// ─── Identifiers ────────────────────────────────────────────────────────────

/**
 * Kebab-case identifier for modules, work items, and slugs.
 * Rules per §2.4.4:
 * - Lowercase ASCII letters (a-z), digits (0-9), hyphens (-)
 * - Starts with a letter
 * - Max 64 characters
 * - No consecutive hyphens
 */
export const identifierSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(
    /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
    'Identifier must be kebab-case, start with a letter, max 64 chars, no consecutive hyphens',
  );

/**
 * Zero-padded 3-digit decision ID (e.g., "001", "042").
 * Per §4.3.2 and §5.5.2.
 */
export const decisionIdSchema = z
  .string()
  .regex(/^\d{3}$/, 'Decision ID must be a zero-padded 3-digit string (e.g., "001")');

// ─── Dates ──────────────────────────────────────────────────────────────────

/**
 * ISO 8601 date-time string (e.g., "2026-07-08T10:00:00Z").
 * Per §1.4.2 and §3.3.2.
 */
export const iso8601Schema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
    'Must be a valid ISO 8601 date-time string with timezone',
  );

/**
 * Date-only string in YYYY-MM-DD format.
 * Used for decision dates and release dates.
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a YYYY-MM-DD date string');

/**
 * Month string in YYYY-MM format.
 * Used for archive directories and history snapshots.
 */
export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Must be a YYYY-MM month string');

// ─── Extensible Enum Helper ─────────────────────────────────────────────────

/**
 * Creates an extensible enum schema that accepts known values
 * but also preserves unknown strings per §9.6.1.
 *
 * This ensures the SDK never rejects valid data just because
 * a new enum value was added in a later spec version.
 */
function extensibleEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.union([z.enum(values as unknown as [string, ...string[]]), z.string()]);
}

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Development phase per §3.6.1. */
export const phaseValues = [
  'understand',
  'structure',
  'build',
  'verify',
  'ship',
] as const;
export const phaseSchema = extensibleEnum(phaseValues);

/** Work item type per §4.2.5. */
export const workTypeValues = [
  'feature',
  'bug',
  'refactor',
  'performance',
  'security',
  'migration',
  'architecture',
  'docs',
  'release',
  'infrastructure',
  'tech-debt',
  'other',
] as const;
export const workTypeSchema = extensibleEnum(workTypeValues);

/** Module type per §3.4.2. */
export const moduleTypeValues = [
  'frontend',
  'backend',
  'library',
  'infrastructure',
  'fullstack',
  'other',
] as const;
export const moduleTypeSchema = extensibleEnum(moduleTypeValues);

/** Decision status per §4.3.3. */
export const decisionStatusValues = [
  'proposed',
  'accepted',
  'deprecated',
  'superseded',
] as const;
export const decisionStatusSchema = extensibleEnum(decisionStatusValues);

/** Work item priority per §4.2.3. */
export const priorityValues = [
  'critical',
  'high',
  'medium',
  'low',
] as const;
export const prioritySchema = extensibleEnum(priorityValues);

/** Quality grade per §3.7.1. */
export const gradeValues = [
  'A+', 'A', 'A-',
  'B+', 'B', 'B-',
  'C+', 'C', 'C-',
  'D',
  'F',
] as const;
export const gradeSchema = extensibleEnum(gradeValues);

/** Architecture type per §5.3.2. */
export const architectureTypeValues = [
  'monolith',
  'modular',
  'microservices',
  'serverless',
  'hybrid',
] as const;
export const architectureTypeSchema = extensibleEnum(architectureTypeValues);

/** Requirements status per §5.3.4. */
export const requirementStatusValues = [
  'draft',
  'approved',
  'evolving',
] as const;
export const requirementStatusSchema = extensibleEnum(requirementStatusValues);

/** Work item status per §5.4.2. */
export const workItemStatusValues = [
  'active',
  'completed',
  'abandoned',
] as const;
export const workItemStatusSchema = extensibleEnum(workItemStatusValues);

/** Project mode per §3.3.1. */
export const projectModeValues = [
  'greenfield',
  'brownfield',
] as const;
export const projectModeSchema = extensibleEnum(projectModeValues);

/** Accessibility severity per §6.2.7. */
export const severityValues = [
  'critical',
  'serious',
  'moderate',
  'minor',
] as const;
export const severitySchema = extensibleEnum(severityValues);

/** Accessibility standard per §3.8.1. */
export const accessibilityStandardValues = [
  'wcag-a',
  'wcag-aa',
  'wcag-aaa',
] as const;
export const accessibilityStandardSchema = extensibleEnum(accessibilityStandardValues);

// ─── SemVer ─────────────────────────────────────────────────────────────────

/**
 * Semantic version string per SemVer 2.0.
 * Accepts versions like "1.0.0", "0.2.1-beta", "1.0.0-rc.1+build.123".
 */
export const semverSchema = z
  .string()
  .regex(
    /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?(\+[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/,
    'Must be a valid SemVer 2.0 string',
  );
