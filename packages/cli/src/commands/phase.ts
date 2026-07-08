import { defineCommand } from 'citty';
import { updatePhase } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printSuccess } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'phase', description: 'Update the development phase' },
  args: {
    phase: { type: 'positional', description: 'Phase: understand, structure, build, verify, ship', required: true },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const manifest = await updatePhase(projectRoot, args.phase);

      if (args.json) {
        console.log(JSON.stringify({ phase: manifest.phase }, null, 2));
      } else {
        printSuccess(`Phase updated to: ${args.phase}`);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
