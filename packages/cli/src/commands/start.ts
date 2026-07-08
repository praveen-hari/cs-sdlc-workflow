import { defineCommand } from 'citty';
import { startWork } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printSuccess, printInfo } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'start', description: 'Start tracking a new work item' },
  args: {
    description: { type: 'positional', description: 'What the work is about', required: true },
    type: { type: 'string', description: 'Work type (feature, bug, refactor, etc.)', default: 'feature' },
    priority: { type: 'string', description: 'Priority (critical, high, medium, low)' },
    modules: { type: 'string', description: 'Comma-separated module IDs' },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const result = await startWork(projectRoot, {
        description: args.description,
        type: args.type,
        priority: args.priority,
        modules: args.modules?.split(',').map((m: string) => m.trim()),
      });

      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printSuccess(`Created work item: ${result.id}`);
        printInfo('Type', args.type ?? 'feature');
        if (args.priority) printInfo('Priority', args.priority);
        printInfo('Path', `.sdlc/work/active/${result.id}/`);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
