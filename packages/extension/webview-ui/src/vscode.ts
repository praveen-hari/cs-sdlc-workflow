import type { VsCodeApi } from './types';

/** Singleton VS Code API instance */
let _vscodeApi: VsCodeApi | undefined;

export function getVsCodeApi(): VsCodeApi {
  if (!_vscodeApi) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _vscodeApi = (window as any).acquireVsCodeApi() as VsCodeApi;
  }
  return _vscodeApi;
}

/** Send a message to the extension host */
export function postMessage(message: Record<string, unknown>): void {
  getVsCodeApi().postMessage(message);
}

/** Open a prompt in the chat panel */
export function openInChat(prompt: string): void {
  postMessage({ type: 'openInChat', prompt });
}

/** Execute a VS Code command */
export function executeCommand(command: string, ...args: unknown[]): void {
  postMessage({ type: 'executeCommand', command, args });
}

/** Notify extension of screen change */
export function switchScreen(screen: string): void {
  postMessage({ type: 'switchScreen', screen });
}
