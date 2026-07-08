# Chapter 6: Layer 4 — Snapshots

**Spec Version:** 1.0-draft
**Last Updated:** 2026-07-08

---

## 6.1 Overview

Snapshots are **point-in-time quality reports** — auto-generated analysis results that track project health over time. They are analogous to:

- **Database backups** — periodic captures of system state
- **PDF incremental updates** — appended data that doesn't modify the original

### 6.1.1 Design Principles

| Principle | Rule |
|-----------|------|
| **Auto-generated** | Snapshots are produced by analysis commands, never manually written. |
| **On-demand access** | Snapshots are NOT loaded at sidebar startup. Only when user opens quality/history views. |
| **Replaceable** | `latest.json` is overwritten on each analysis run. History files are append-per-month. |
| **Optional** | The entire `snapshots/` directory is optional. Projects work fine without it. |

### 6.1.2 File Locations

```
.sdlc/
└── snapshots/
    ├── latest.json              ← Most recent analysis result
    └── history/
        ├── 2026-07.json         ← Monthly snapshot
        ├── 2026-08.json
        └── 2026-09.json
```

## 6.2 Latest Snapshot

**File:** `snapshots/latest.json`

Contains the most recent quality analysis results. Overwritten on each analysis run.

### 6.2.1 Schema

```json
{
  "generatedAt": "2026-07-10T15:00:00Z",
  "generator": "cs-sdlc-analyze@1.0.0",

  "overall": {
    "grade": "B+",
    "score": 82
  },

  "coverage": {
    "total": 82,
    "unit": 88,
    "integration": 75,
    "e2e": 60
  },

  "tests": {
    "total": 47,
    "passing": 47,
    "failing": 0,
    "skipped": 2
  },

  "security": {
    "vulnerabilities": 0,
    "advisories": [],
    "outdatedDeps": 3
  },

  "accessibility": {
    "violations": 3,
    "standard": "wcag-aa",
    "details": [
      { "rule": "color-contrast", "count": 2, "severity": "serious" },
      { "rule": "aria-label", "count": 1, "severity": "moderate" }
    ]
  },

  "complexity": {
    "maxFunctionComplexity": 12,
    "avgFunctionComplexity": 4,
    "filesOverThreshold": 2
  },

  "modules": {
    "web-app": {
      "coverage": 85,
      "tests": { "passing": 120, "failing": 0 },
      "security": { "vulnerabilities": 0 }
    },
    "auth-service": {
      "coverage": 91,
      "tests": { "passing": 67, "failing": 0 },
      "security": { "vulnerabilities": 0 }
    }
  }
}
```

### 6.2.2 Root Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `generatedAt` | string | REQUIRED | ISO 8601 timestamp of when the snapshot was generated. |
| `generator` | string | OPTIONAL | Tool and version that generated this snapshot (e.g., `"cs-sdlc-analyze@1.0.0"`). |
| `overall` | object | REQUIRED | Aggregate quality score. See §6.2.3. |
| `coverage` | object | OPTIONAL | Test coverage metrics. See §6.2.4. |
| `tests` | object | OPTIONAL | Test execution results. See §6.2.5. |
| `security` | object | OPTIONAL | Security scan results. See §6.2.6. |
| `accessibility` | object | OPTIONAL | Accessibility audit results. See §6.2.7. |
| `complexity` | object | OPTIONAL | Code complexity metrics. See §6.2.8. |
| `modules` | object | OPTIONAL | Per-module metrics. Keys are module IDs. See §6.2.9. |

### 6.2.3 Overall Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `grade` | string | REQUIRED | Letter grade: `"A+"` through `"F"`. |
| `score` | number | OPTIONAL | Numeric score (0-100). |

### 6.2.4 Coverage Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total` | number | REQUIRED | Overall coverage percentage (0-100). |
| `unit` | number | OPTIONAL | Unit test coverage. |
| `integration` | number | OPTIONAL | Integration test coverage. |
| `e2e` | number | OPTIONAL | End-to-end test coverage. |

### 6.2.5 Tests Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total` | integer | REQUIRED | Total number of tests. |
| `passing` | integer | REQUIRED | Number of passing tests. |
| `failing` | integer | REQUIRED | Number of failing tests. |
| `skipped` | integer | OPTIONAL | Number of skipped tests. |

### 6.2.6 Security Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vulnerabilities` | integer | REQUIRED | Total number of known vulnerabilities. |
| `advisories` | array | OPTIONAL | Array of advisory strings (e.g., CVE IDs). |
| `outdatedDeps` | integer | OPTIONAL | Number of outdated dependencies. |

### 6.2.7 Accessibility Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `violations` | integer | REQUIRED | Total number of accessibility violations. |
| `standard` | string | OPTIONAL | Standard tested against (e.g., `"wcag-aa"`). |
| `details` | array | OPTIONAL | Array of violation details. |

Each detail entry:

| Field | Type | Description |
|-------|------|-------------|
| `rule` | string | Rule identifier (e.g., `"color-contrast"`). |
| `count` | integer | Number of occurrences. |
| `severity` | string | `"critical"`, `"serious"`, `"moderate"`, `"minor"`. |

### 6.2.8 Complexity Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `maxFunctionComplexity` | number | OPTIONAL | Highest cyclomatic complexity of any function. |
| `avgFunctionComplexity` | number | OPTIONAL | Average cyclomatic complexity across all functions. |
| `filesOverThreshold` | integer | OPTIONAL | Number of files exceeding the complexity threshold. |

### 6.2.9 Per-Module Metrics

When `modules` is present, each key is a module ID (matching `manifest.json` → `modules`), and the value is an object containing any subset of the metrics defined above (`coverage`, `tests`, `security`, etc.).

## 6.3 Historical Snapshots

**File:** `snapshots/history/{YYYY-MM}.json`

Monthly snapshots for trend analysis. Each file contains the snapshot data as it was at the end of that month.

### 6.3.1 Schema

```json
{
  "month": "2026-07",
  "snapshots": [
    {
      "date": "2026-07-10",
      "overall": { "grade": "B", "score": 78 },
      "coverage": { "total": 78 },
      "tests": { "total": 34, "passing": 34, "failing": 0 },
      "security": { "vulnerabilities": 1 }
    },
    {
      "date": "2026-07-20",
      "overall": { "grade": "B+", "score": 82 },
      "coverage": { "total": 82 },
      "tests": { "total": 47, "passing": 47, "failing": 0 },
      "security": { "vulnerabilities": 0 }
    }
  ]
}
```

### 6.3.2 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `month` | string | REQUIRED | Month identifier in `YYYY-MM` format. |
| `snapshots` | array | REQUIRED | Array of snapshot summaries for that month. |

Each snapshot entry contains a `date` field and a **subset** of the latest snapshot fields (typically just `overall`, `coverage.total`, `tests`, and `security.vulnerabilities` to keep the file small).

### 6.3.3 Rules

- Each analysis run SHOULD append a summary entry to the current month's history file.
- History files for past months MUST NOT be modified.
- Implementations SHOULD limit history entries to at most **4 per month** (e.g., weekly snapshots) to prevent unbounded growth.
- The maximum recommended size for a monthly history file is 5 KB.

## 6.4 Snapshot Generation

### 6.4.1 Trigger

Snapshots are generated when:
1. The user explicitly runs an analysis command (e.g., `cs-sdlc analyze`).
2. A work item is completed (implementations MAY auto-generate a snapshot).
3. A CI/CD pipeline runs the analysis step.

### 6.4.2 Process

1. Run analysis tools (test runner, coverage tool, security scanner, etc.).
2. Collect results into the `latest.json` schema.
3. Write `snapshots/latest.json` (overwrite).
4. Append summary to `snapshots/history/{current-month}.json`.
5. Update `manifest.json` → `health` with key metrics from the snapshot.

### 6.4.3 Manifest Sync

After generating a snapshot, the SDK MUST update `manifest.json` → `health`:

```
snapshots/latest.json → overall.grade    →  manifest.json → health.grade
snapshots/latest.json → coverage.total   →  manifest.json → health.coverage
snapshots/latest.json → security.vulns   →  manifest.json → health.securityIssues
snapshots/latest.json → a11y.violations  →  manifest.json → health.accessibilityIssues
snapshots/latest.json → generatedAt      →  manifest.json → health.updatedAt
```

This ensures the sidebar can show health metrics from the manifest alone, without loading the full snapshot.

---

**Previous:** [Chapter 5: Layer 3 — Objects](./05-objects.md)
**Next:** [Chapter 7: Operations](./07-operations.md)
