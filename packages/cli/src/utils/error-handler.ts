/**
 * Global error handler — catches SdlcError and formats output.
 */

import pc from 'picocolors';
import { SdlcError } from '@syncfusion/cs-sdlc';

export const EXIT_SUCCESS = 0;
export const EXIT_ERROR = 1;
export const EXIT_VALIDATION = 2;

export function handleError(err: unknown, json: boolean): never {
  if (err instanceof SdlcError) {
    if (json) {
      console.log(JSON.stringify({ error: err.message, code: err.code }));
    } else {
      console.error(`${pc.red('✗')} ${err.message}`);
    }
    process.exit(err.code === 'CONSISTENCY_ERROR' ? EXIT_VALIDATION : EXIT_ERROR);
  }

  // Unknown error
  const message = err instanceof Error ? err.message : String(err);
  if (json) {
    console.log(JSON.stringify({ error: message, code: 'UNKNOWN_ERROR' }));
  } else {
    console.error(`${pc.red('✗')} ${message}`);
  }
  process.exit(EXIT_ERROR);
}
