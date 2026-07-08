import { defineCommand } from 'citty';
import { readWorkItem, readDecision } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printWorkItem, printDecisionRecord } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'show', description: 'Show details of a work item or decision' },
  args: {
    id: { type: 'positional', description: 'Work item ID (kebab-case) or decision ID (3-digit)', required: true },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const isDecisionId = /^\d{3}$/.test(args.id);

      if (isDecisionId) {
        const record = await readDecision(projectRoot, args.id);
        if (args.json) { console.log(JSON.stringify(record, null, 2)); }
        else { printDecisionRecord(record); }
      } else {
        const item = await readWorkItem(projectRoot, args.id);
        if (args.json) { console.log(JSON.stringify(item, null, 2)); }
        else { printWorkItem(item); }
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
