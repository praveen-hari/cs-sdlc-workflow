/**
 * Auto-discover project root from cwd using SDK's discoverSdlc.
 */

import { discoverSdlc, projectRootFromSdlc } from '@syncfusion/cs-sdlc';

/**
 * Resolve the project root by walking up from cwd to find .sdlc/.
 * Returns the project root (parent of .sdlc/).
 */
export async function resolveProjectRoot(): Promise<string> {
  const sdlcPath = await discoverSdlc(process.cwd());
  return projectRootFromSdlc(sdlcPath);
}
