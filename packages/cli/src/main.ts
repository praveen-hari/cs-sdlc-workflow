import { defineCommand } from 'citty';

import init from './commands/init.js';
import start from './commands/start.js';
import done from './commands/done.js';
import abandon from './commands/abandon.js';
import decide from './commands/decide.js';
import release from './commands/release.js';
import status from './commands/status.js';
import list from './commands/list.js';
import show from './commands/show.js';
import validate from './commands/validate.js';
import sync from './commands/sync.js';
import phase from './commands/phase.js';
import snapshot from './commands/snapshot.js';

export const main = defineCommand({
  meta: {
    name: 'cs-sdlc',
    version: '0.1.0',
    description: 'CLI for the .sdlc/ file format — manage project context, work items, decisions, and quality.',
  },
  subCommands: {
    init,
    start,
    done,
    abandon,
    decide,
    release,
    status,
    list,
    show,
    validate,
    sync,
    phase,
    snapshot,
  },
});
