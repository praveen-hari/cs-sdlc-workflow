/**
 * Inferred TypeScript types from Zod schemas.
 *
 * Every schema defined in src/schemas/ has a corresponding type here.
 * Import types from this module; import schemas from src/schemas/.
 *
 * @module
 */

import type { z } from 'zod';

// ─── Shared ─────────────────────────────────────────────────────────────────

import type {
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
} from '../schemas/shared.js';

export type Identifier = z.infer<typeof identifierSchema>;
export type DecisionId = z.infer<typeof decisionIdSchema>;
export type ISO8601 = z.infer<typeof iso8601Schema>;
export type DateString = z.infer<typeof dateSchema>;
export type MonthString = z.infer<typeof monthSchema>;
export type Phase = z.infer<typeof phaseSchema>;
export type WorkType = z.infer<typeof workTypeSchema>;
export type ModuleType = z.infer<typeof moduleTypeSchema>;
export type DecisionStatus = z.infer<typeof decisionStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type Grade = z.infer<typeof gradeSchema>;
export type ArchitectureType = z.infer<typeof architectureTypeSchema>;
export type RequirementStatus = z.infer<typeof requirementStatusSchema>;
export type WorkItemStatus = z.infer<typeof workItemStatusSchema>;
export type ProjectMode = z.infer<typeof projectModeSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type AccessibilityStandard = z.infer<typeof accessibilityStandardSchema>;
export type SemVer = z.infer<typeof semverSchema>;

// ─── Manifest (Layer 1) ─────────────────────────────────────────────────────

import type {
  stackSchema,
  projectSchema,
  moduleEntrySchema,
  countersSchema,
  healthSchema,
  performanceBudgetSchema,
  gatesSchema,
  manifestSchema,
} from '../schemas/manifest.js';

export type Stack = z.infer<typeof stackSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ModuleEntry = z.infer<typeof moduleEntrySchema>;
export type Counters = z.infer<typeof countersSchema>;
export type Health = z.infer<typeof healthSchema>;
export type PerformanceBudget = z.infer<typeof performanceBudgetSchema>;
export type Gates = z.infer<typeof gatesSchema>;
export type Manifest = z.infer<typeof manifestSchema>;

// ─── Indexes (Layer 2) ──────────────────────────────────────────────────────

import type {
  activeWorkEntrySchema,
  recentWorkEntrySchema,
  workIndexSchema,
  decisionEntrySchema,
  decisionsIndexSchema,
  releaseEntrySchema,
  releasesIndexSchema,
} from '../schemas/indexes.js';

export type ActiveWorkEntry = z.infer<typeof activeWorkEntrySchema>;
export type RecentWorkEntry = z.infer<typeof recentWorkEntrySchema>;
export type WorkIndex = z.infer<typeof workIndexSchema>;
export type DecisionEntry = z.infer<typeof decisionEntrySchema>;
export type DecisionsIndex = z.infer<typeof decisionsIndexSchema>;
export type ReleaseEntry = z.infer<typeof releaseEntrySchema>;
export type ReleasesIndex = z.infer<typeof releasesIndexSchema>;

// ─── Objects (Layer 3) ──────────────────────────────────────────────────────

import type {
  architectureFrontMatterSchema,
  conventionsFrontMatterSchema,
  requirementsFrontMatterSchema,
  stackFrontMatterSchema,
  briefFrontMatterSchema,
  planFrontMatterSchema,
  decisionFrontMatterSchema,
  releaseFrontMatterSchema,
} from '../schemas/objects.js';

export type ArchitectureFrontMatter = z.infer<typeof architectureFrontMatterSchema>;
export type ConventionsFrontMatter = z.infer<typeof conventionsFrontMatterSchema>;
export type RequirementsFrontMatter = z.infer<typeof requirementsFrontMatterSchema>;
export type StackFrontMatter = z.infer<typeof stackFrontMatterSchema>;
export type BriefFrontMatter = z.infer<typeof briefFrontMatterSchema>;
export type PlanFrontMatter = z.infer<typeof planFrontMatterSchema>;
export type DecisionFrontMatter = z.infer<typeof decisionFrontMatterSchema>;
export type ReleaseFrontMatter = z.infer<typeof releaseFrontMatterSchema>;

// ─── Snapshots (Layer 4) ────────────────────────────────────────────────────

import type {
  overallSchema,
  coverageSchema,
  testsSchema,
  securitySchema,
  accessibilityDetailSchema,
  accessibilitySchema,
  complexitySchema,
  moduleMetricsSchema,
  latestSnapshotSchema,
  historyEntrySchema,
  historySnapshotSchema,
} from '../schemas/snapshots.js';

export type Overall = z.infer<typeof overallSchema>;
export type Coverage = z.infer<typeof coverageSchema>;
export type Tests = z.infer<typeof testsSchema>;
export type Security = z.infer<typeof securitySchema>;
export type AccessibilityDetail = z.infer<typeof accessibilityDetailSchema>;
export type Accessibility = z.infer<typeof accessibilitySchema>;
export type Complexity = z.infer<typeof complexitySchema>;
export type ModuleMetrics = z.infer<typeof moduleMetricsSchema>;
export type LatestSnapshot = z.infer<typeof latestSnapshotSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type HistorySnapshot = z.infer<typeof historySnapshotSchema>;

// ─── Parsed Document ────────────────────────────────────────────────────────

/** A parsed Markdown document with typed front matter. */
export interface ParsedDocument<T = Record<string, unknown>> {
  frontMatter: T | null;
  body: string;
}

/** A work item (brief + optional plan). */
export interface WorkItem {
  id: Identifier;
  brief: ParsedDocument<BriefFrontMatter>;
  plan: ParsedDocument<PlanFrontMatter> | null;
}

/** A decision record. */
export interface DecisionRecord {
  id: DecisionId;
  slug: string;
  document: ParsedDocument<DecisionFrontMatter>;
}

/** A release record. */
export interface ReleaseRecord {
  version: SemVer;
  document: ParsedDocument<ReleaseFrontMatter>;
}

/** A context document. */
export interface ContextDocument {
  name: string;
  document: ParsedDocument;
}

/** Consistency check report. */
export interface ConsistencyReport {
  valid: boolean;
  issues: ConsistencyIssue[];
}

export interface ConsistencyIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
}
