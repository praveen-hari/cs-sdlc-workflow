/** VS Code API acquired via acquireVsCodeApi() */
export interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

/** Message from extension host → webview */
export interface DataUpdateMessage {
  type: 'dataUpdate';
  isLoaded: boolean;
  activeScreen: string;
  status: ProjectStatus | null;
  workIndex: WorkIndexData | null;
  decisionsIndex: DecisionsIndexData | null;
  releasesIndex: ReleasesIndexData | null;
  snapshot: SnapshotData | null;
  contextDocs: Record<string, ContextDocData>;
  activeWorkDetails: Record<string, ActiveWorkDetail>;
}

export interface SwitchScreenMessage {
  type: 'switchScreen';
  screen: string;
}

export type IncomingMessage = DataUpdateMessage | SwitchScreenMessage;

/** Project status summary */
export interface ProjectStatus {
  projectName: string;
  projectMode: string;
  stack: Record<string, string> | null;
  modules: unknown[];
  activeWorkCount: number;
  activeWork: WorkEntry[];
  recentWork: WorkEntry[];
  totalDecisions: number;
  totalReleases: number;
  counters: Record<string, number> | null;
  health: HealthData | null;
}

export interface WorkEntry {
  id: string;
  title: string;
  type?: string;
  priority?: string;
  phase?: string;
  modules?: string[];
  progress?: number;
  totalTasks?: number;
  completedTasks?: number;
  status?: string;
  completedAt?: string;
}

export interface HealthData {
  grade?: string;
  score?: number;
  coverage?: number;
  tests?: { total: number; passing: number; failing: number };
}

export interface WorkIndexData {
  active: WorkEntry[];
  recent: WorkEntry[];
}

export interface DecisionEntry {
  id: string;
  title: string;
  status?: string;
  date?: string;
  path?: string;
}

export interface DecisionsIndexData {
  entries: DecisionEntry[];
}

export interface ReleaseEntry {
  version: string;
  title?: string;
  date?: string;
}

export interface ReleasesIndexData {
  entries: ReleaseEntry[];
}

/** Snapshot data from snapshots/latest.json */
export interface SnapshotData {
  grade: string | null;
  score: number | null;
  coverage: number | null;
  tests: { total: number; passing: number; failing: number } | null;
  vulnerabilities: number | null;
  generatedAt: string;
}

/** Context document data */
export interface ContextDocData {
  name: string;
  frontMatter: Record<string, unknown> | null;
  body: string;
  hasContent: boolean;
}

/** Active work item with full spec + plan details */
export interface ActiveWorkDetail {
  id: string;
  specFrontMatter: Record<string, unknown> | null;
  specBody: string;
  hasPlan: boolean;
  planBody: string | null;
  planFrontMatter: Record<string, unknown> | null;
  totalTasks: number;
  completedTasks: number;
  tasks: PlanTask[];
}

export interface PlanTask {
  number: number;
  text: string;
  completed: boolean;
}
