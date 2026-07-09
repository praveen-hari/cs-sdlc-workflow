/**
 * @syncfusion/cs-sdlc — TypeScript SDK for the .sdlc/ file format
 *
 * Reference implementation of the .sdlc/ specification v1.0
 * Conformance: Level 3 (Full)
 *
 * @packageDocumentation
 */

// ─── Schemas ────────────────────────────────────────────────────────────────

export {
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
} from './schemas/shared.js';

export {
  stackSchema,
  projectSchema,
  moduleEntrySchema,
  countersSchema,
  healthSchema,
  performanceBudgetSchema,
  gatesSchema,
  manifestSchema,
} from './schemas/manifest.js';

export {
  activeWorkEntrySchema,
  recentWorkEntrySchema,
  workIndexSchema,
  decisionEntrySchema,
  decisionsIndexSchema,
  releaseEntrySchema,
  releasesIndexSchema,
} from './schemas/indexes.js';

export {
  architectureFrontMatterSchema,
  conventionsFrontMatterSchema,
  requirementsFrontMatterSchema,
  stackFrontMatterSchema,
  specFrontMatterSchema,
  briefFrontMatterSchema,
  todoFrontMatterSchema,
  planFrontMatterSchema,
  decisionFrontMatterSchema,
  releaseFrontMatterSchema,
} from './schemas/objects.js';

export {
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
} from './schemas/snapshots.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export type {
  Identifier, DecisionId, ISO8601, DateString, MonthString,
  Phase, WorkType, ModuleType, DecisionStatus, Priority, Grade,
  ArchitectureType, RequirementStatus, WorkItemStatus, ProjectMode,
  Severity, AccessibilityStandard, SemVer,
  Stack, Project, ModuleEntry, Counters, Health, PerformanceBudget, Gates, Manifest,
  ActiveWorkEntry, RecentWorkEntry, WorkIndex,
  DecisionEntry, DecisionsIndex, ReleaseEntry, ReleasesIndex,
  ArchitectureFrontMatter, ConventionsFrontMatter, RequirementsFrontMatter,
  StackFrontMatter, SpecFrontMatter, BriefFrontMatter, PlanFrontMatter, TodoFrontMatter,
  DecisionFrontMatter, ReleaseFrontMatter,
  Overall, Coverage, Tests, Security, AccessibilityDetail, Accessibility,
  Complexity, ModuleMetrics, LatestSnapshot, HistoryEntry, HistorySnapshot,
  ParsedDocument, WorkItem, DecisionRecord, ReleaseRecord, ContextDocument,
  ConsistencyReport, ConsistencyIssue,
} from './types/index.js';

// ─── Operations ─────────────────────────────────────────────────────────────

export { initSdlc } from './operations/init.js';
export type { InitOptions } from './operations/init.js';

export { startWork } from './operations/work-start.js';
export type { StartWorkOptions, StartWorkResult } from './operations/work-start.js';

export { completeWork, abandonWork } from './operations/work-complete.js';

export { updateWorkItem } from './operations/work-update.js';
export type { UpdateWorkItemOptions } from './operations/work-update.js';

export { createContextDoc, updateContextDoc } from './operations/context-crud.js';
export type { CreateContextDocOptions, UpdateContextDocOptions } from './operations/context-crud.js';

export { createDecision, supersedeDecision } from './operations/decision-create.js';
export type { CreateDecisionOptions, CreateDecisionResult } from './operations/decision-create.js';

export { createRelease } from './operations/release-create.js';
export type { CreateReleaseOptions, CreateReleaseResult } from './operations/release-create.js';

export { generateSnapshot } from './operations/snapshot-generate.js';
export type { SnapshotMetrics } from './operations/snapshot-generate.js';

export { rebuildIndexes, recalculateCounters, validateConsistency } from './operations/sync.js';

export { updatePhase, addModule, removeModule, renameModule } from './operations/phase.js';

export { listPlanTasks, updatePlanTask, syncPlanProgress } from './operations/plan-tasks.js';
export type { PlanTask, PlanSummary } from './operations/plan-tasks.js';

export {
  readManifest, readWorkIndex, readDecisionsIndex, readReleasesIndex,
  readContextDoc, readWorkItem, readDecision, readRelease,
  readLatestSnapshot, readHistoricalSnapshot,
} from './operations/read-helpers.js';

// ─── Core ───────────────────────────────────────────────────────────────────

export { discoverSdlc, projectRootFromSdlc } from './core/discovery.js';
export { parseFrontMatter, serializeFrontMatter } from './core/frontmatter.js';
export type { ParsedFrontMatter } from './core/frontmatter.js';

// ─── Errors ─────────────────────────────────────────────────────────────────

export {
  SdlcError,
  NotFoundError,
  FileNotFoundError,
  ValidationError,
  IdentifierError,
  ConsistencyError,
  AlreadyExistsError,
  ItemNotFoundError,
} from './core/errors.js';

// ─── Constants ──────────────────────────────────────────────────────────────

export {
  SDLC_DIR, MANIFEST_FILE, CONTEXT_DIR, WORK_DIR, ACTIVE_DIR, ARCHIVE_DIR,
  DECISIONS_DIR, RELEASES_DIR, SNAPSHOTS_DIR, HISTORY_DIR, INDEX_DIR,
  WORK_INDEX_FILE, DECISIONS_INDEX_FILE, RELEASES_INDEX_FILE,
  LATEST_SNAPSHOT_FILE, SPEC_FILE, BRIEF_FILE, PLAN_FILE, TODO_FILE,
  ARCHITECTURE_FILE, CONVENTIONS_FILE, REQUIREMENTS_FILE, STACK_FILE,
  MAGIC, SPEC_VERSION,
  MAX_MANIFEST_SIZE, MAX_INDEX_SIZE, MAX_SNAPSHOT_SIZE, MAX_CONTEXT_DOC_SIZE,
  MAX_ACTIVE_WORK_ITEMS, MAX_RECENT_ITEMS, MAX_HISTORY_ENTRIES_PER_MONTH,
  DEBOUNCE_MS, RETRY_DELAY_MIN_MS, RETRY_DELAY_MAX_MS,
} from './core/constants.js';

// ─── Utils ──────────────────────────────────────────────────────────────────

export { slugify } from './utils/slugify.js';
export { compareSemVer } from './utils/semver.js';
export { nowISO, todayDate, currentMonth, monthFromISO } from './utils/dates.js';
