/**
 * Index schemas — Layer 2 of the .sdlc/ format.
 *
 * Defines schemas for all three index files per Chapter 4:
 * work index, decisions index, releases index.
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
  phaseSchema,
  prioritySchema,
  decisionStatusSchema,
  semverSchema,
} from './shared.js';

// ─── Work Index ─────────────────────────────────────────────────────────────

/** Active work item entry per §4.2.3. */
export const activeWorkEntrySchema = z
  .object({
    id: identifierSchema,
    title: z.string().min(1).max(200),
    type: workTypeSchema,
    phase: phaseSchema.optional(),
    priority: prioritySchema.optional(),
    progress: z.number().int().min(0).max(100).optional(),
    modules: z.array(identifierSchema).optional(),
    createdAt: iso8601Schema,
    path: z.string().min(1),
  })
  .passthrough();

/** Recent (completed) work item entry per §4.2.4. */
export const recentWorkEntrySchema = z
  .object({
    id: identifierSchema,
    title: z.string().min(1).max(200),
    type: workTypeSchema,
    completedAt: iso8601Schema,
    path: z.string().min(1),
  })
  .passthrough();

/** Work index per §4.2. */
export const workIndexSchema = z
  .object({
    active: z.array(activeWorkEntrySchema),
    recent: z.array(recentWorkEntrySchema).max(10),
  })
  .passthrough();

// ─── Decisions Index ────────────────────────────────────────────────────────

/** Decision entry per §4.3.2. */
export const decisionEntrySchema = z
  .object({
    id: decisionIdSchema,
    slug: z.string().min(1),
    title: z.string().min(1).max(200),
    status: decisionStatusSchema,
    date: dateSchema,
    supersedes: z.union([decisionIdSchema, z.null()]).optional(),
    path: z.string().min(1),
  })
  .passthrough();

/** Decisions index per §4.3. */
export const decisionsIndexSchema = z
  .object({
    entries: z.array(decisionEntrySchema),
  })
  .passthrough();

// ─── Releases Index ─────────────────────────────────────────────────────────

/** Release entry per §4.4.2. */
export const releaseEntrySchema = z
  .object({
    version: semverSchema,
    title: z.string().optional(),
    date: dateSchema,
    path: z.string().min(1),
  })
  .passthrough();

/** Releases index per §4.4. */
export const releasesIndexSchema = z
  .object({
    entries: z.array(releaseEntrySchema),
  })
  .passthrough();
