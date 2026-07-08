import { defineCommand } from 'citty';
import { readWorkIndex, readDecisionsIndex, readReleasesIndex } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printWorkIndex, printDecisionsIndex, printReleasesIndex } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'list', description: 'List work items, decisions, or releases' },
  args: {
    type: { type: 'positional', description: 'What to list: work, decisions, releases', required: true },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();

      switch (args.type) {
        case 'work': {
          const index = await readWorkIndex(projectRoot);
          if (args.json) { console.log(JSON.stringify(index, null, 2)); }
          else { printWorkIndex(index); }
          break;
        }
        case 'decisions': {
          const index = await readDecisionsIndex(projectRoot);
          if (args.json) { console.log(JSON.stringify(index, null, 2)); }
          else { printDecisionsIndex(index); }
          break;
        }
        case 'releases': {
          const index = await readReleasesIndex(projectRoot);
          if (args.json) { console.log(JSON.stringify(index, null, 2)); }
          else { printReleasesIndex(index); }
          break;
        }
        default:
          console.error(`Unknown list type: ${args.type}. Use: work, decisions, releases`);
          process.exit(1);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
