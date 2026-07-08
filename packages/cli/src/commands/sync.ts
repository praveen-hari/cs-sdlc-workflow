import { defineCommand } from 'citty';
import { rebuildIndexes, recalculateCounters } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printSuccess } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'sync', description: 'Rebuild indexes from filesystem' },
  args: {
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      await rebuildIndexes(projectRoot);
      const manifest = await recalculateCounters(projectRoot);

      if (args.json) {
        console.log(JSON.stringify({ synced: true, counters: manifest.counters }, null, 2));
      } else {
        printSuccess('Indexes rebuilt and counters recalculated.');
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
