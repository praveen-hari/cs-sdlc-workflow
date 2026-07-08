/**
 * SDK constants — directory names, file names, size limits, magic values.
 *
 * @module
 */

// ─── Directory & File Names (§2.3.1) ────────────────────────────────────────

export const SDLC_DIR = '.sdlc';
export const MANIFEST_FILE = 'manifest.json';

export const CONTEXT_DIR = 'context';
export const WORK_DIR = 'work';
export const ACTIVE_DIR = 'active';
export const ARCHIVE_DIR = 'archive';
export const DECISIONS_DIR = 'decisions';
export const RELEASES_DIR = 'releases';
export const SNAPSHOTS_DIR = 'snapshots';
export const HISTORY_DIR = 'history';
export const INDEX_DIR = 'index';

export const WORK_INDEX_FILE = 'work.json';
export const DECISIONS_INDEX_FILE = 'decisions.json';
export const RELEASES_INDEX_FILE = 'releases.json';
export const LATEST_SNAPSHOT_FILE = 'latest.json';

export const BRIEF_FILE = 'brief.md';
export const PLAN_FILE = 'plan.md';

export const ARCHITECTURE_FILE = 'architecture.md';
export const CONVENTIONS_FILE = 'conventions.md';
export const REQUIREMENTS_FILE = 'requirements.md';
export const STACK_FILE = 'stack.md';

// ─── Magic & Version ────────────────────────────────────────────────────────

export const MAGIC = 'cs-sdlc';
export const SPEC_VERSION = '1.0';

// ─── Size Limits (§2.2.2) ───────────────────────────────────────────────────

/** Manifest MUST NOT exceed 2 KB. */
export const MAX_MANIFEST_SIZE = 2048;

/** Index files SHOULD NOT exceed 10 KB. */
export const MAX_INDEX_SIZE = 10240;

/** Snapshot latest.json SHOULD NOT exceed 5 KB. */
export const MAX_SNAPSHOT_SIZE = 5120;

/** Context documents SHOULD NOT exceed 50 KB each. */
export const MAX_CONTEXT_DOC_SIZE = 51200;

/** Active work items SHOULD NOT exceed 20. */
export const MAX_ACTIVE_WORK_ITEMS = 20;

/** Recent completed items capped at 10 (§4.2.4). */
export const MAX_RECENT_ITEMS = 10;

/** History entries per month capped at 4 (§6.3.3). */
export const MAX_HISTORY_ENTRIES_PER_MONTH = 4;

// ─── File Watching (§2.6.2) ─────────────────────────────────────────────────

/** Recommended debounce for file watch events. Exported for consumers. */
export const DEBOUNCE_MS = 300;

// ─── Retry (§2.6.3) ─────────────────────────────────────────────────────────

/** Retry delay range for write conflicts (deferred to v2, but constant is ready). */
export const RETRY_DELAY_MIN_MS = 100;
export const RETRY_DELAY_MAX_MS = 500;
