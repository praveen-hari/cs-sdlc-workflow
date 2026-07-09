import { defineCommand } from 'citty';
import { initSdlc } from '@syncfusion/cs-sdlc';
import { printSuccess } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'init', description: 'Initialize a new .sdlc/ directory' },
  args: {
    name: { type: 'string', description: 'Project name' },
    description: { type: 'string', description: 'Project description' },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = process.cwd();

      const manifest = await initSdlc({
        projectRoot,
        name: args.name,
        description: args.description,
      });
      if (args.json) {
        console.log(JSON.stringify(manifest, null, 2));
      } else {
        printSuccess(`Initialized .sdlc/ for "${manifest.project.name}"`);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
