import { defineCommand } from 'citty';
import { abandonWork } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printSuccess } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'abandon', description: 'Abandon a work item' },
  args: {
    id: { type: 'positional', description: 'Work item ID', required: true },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const result = await abandonWork(projectRoot, args.id);

      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printSuccess(`Abandoned: ${args.id}`);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
