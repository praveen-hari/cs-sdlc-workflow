import { defineCommand } from 'citty';
import { createDecision, supersedeDecision } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printSuccess, printInfo } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'decide', description: 'Record an architectural decision' },
  args: {
    title: { type: 'positional', description: 'Decision title', required: true },
    context: { type: 'string', description: 'What prompted this decision' },
    decision: { type: 'string', description: 'What was decided' },
    rationale: { type: 'string', description: 'Why this option was chosen' },
    supersedes: { type: 'string', description: 'ID of decision to supersede (e.g., 001)' },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const options = {
        title: args.title,
        context: args.context,
        decision: args.decision,
        rationale: args.rationale,
      };

      const result = args.supersedes
        ? await supersedeDecision(projectRoot, args.supersedes, options)
        : await createDecision(projectRoot, options);

      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printSuccess(`Created ADR-${result.id}: ${args.title}`);
        printInfo('Path', `.sdlc/${result.path}`);
        if (args.supersedes) printInfo('Supersedes', `ADR-${args.supersedes}`);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
