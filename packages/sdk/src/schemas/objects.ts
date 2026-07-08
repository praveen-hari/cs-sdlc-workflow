/**
 * Object front matter schemas — Layer 3 of the .sdlc/ format.
 *
 * Defines YAML front matter schemas for all Markdown object types
 * per Chapter 5: context docs, work items, decisions, releases.
 *
 * @module
 */

import { z } from 'zod';
import {
  identifierSchema,
  decisionIdSchema,
  iso8601Schema,
  dateSchema,
  workTypeSchema,
  prioritySchema,
  decisionStatusSchema,
  architectureTypeSchema,
  requirementStatusSchema,
  workItemStatusSchema,
  semverSchema,
} from './shared.js';

// ─── Context Document Front Matter ──────────────────────────────────────────

/** architecture.md front matter per §5.3.2. */
export const architectureFrontMatterSchema = z
  .object({
    version: z.number().int().optional(),
    updatedAt: z.string().optional(),
    type: architectureTypeSchema.optional(),
  })
  .passthrough();

/** conventions.md front matter per §5.3.3. */
export const conventionsFrontMatterSchema = z
  .object({
    version: z.number().int().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

/** requirements.md front matter per §5.3.4. */
export const requirementsFrontMatterSchema = z
  .object({
    version: z.number().int().optional(),
    status: requirementStatusSchema.optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

/** stack.md front matter per §5.3.5. */
export const stackFrontMatterSchema = z
  .object({
    version: z.number().int().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

// ─── Work Item Front Matter ─────────────────────────────────────────────────

/** brief.md front matter per §5.4.2. */
export const briefFrontMatterSchema = z
  .object({
    type: workTypeSchema,
    title: z.string().min(1).max(200),
    priority: prioritySchema.optional(),
    modules: z.array(identifierSchema).optional(),
    createdAt: iso8601Schema,
    completedAt: iso8601Schema.optional(),
    status: workItemStatusSchema.optional(),
  })
  .passthrough();

/** plan.md front matter per §5.4.3. */
export const planFrontMatterSchema = z
  .object({
    totalTasks: z.number().int().min(0).optional(),
    completedTasks: z.number().int().min(0).optional(),
    currentTask: z.number().int().min(1).optional(),
  })
  .passthrough();

// ─── Decision Front Matter ──────────────────────────────────────────────────

/** Decision record front matter per §5.5.2. */
export const decisionFrontMatterSchema = z
  .object({
    id: decisionIdSchema,
    title: z.string().min(1).max(200),
    status: decisionStatusSchema,
    date: dateSchema,
    supersedes: z.union([decisionIdSchema, z.null()]).optional(),
    supersededBy: z.union([decisionIdSchema, z.null()]).optional(),
    modules: z.array(identifierSchema).optional(),
  })
  .passthrough();

// ─── Release Front Matter ───────────────────────────────────────────────────

/** Release notes front matter per §5.6.2. */
export const releaseFrontMatterSchema = z
  .object({
    version: semverSchema,
    date: dateSchema,
    title: z.string().optional(),
  })
  .passthrough();
