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
