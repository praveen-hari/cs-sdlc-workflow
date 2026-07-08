import { defineCommand } from 'citty';
import { readManifest } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printStatus } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'status', description: 'Show project summary' },
  args: {
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const manifest = await readManifest(projectRoot);

      if (args.json) {
        console.log(JSON.stringify(manifest, null, 2));
      } else {
        printStatus(manifest);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
