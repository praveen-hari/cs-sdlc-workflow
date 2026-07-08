import { defineCommand } from 'citty';
import { validateConsistency } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printConsistencyReport } from '../output/human.js';
import { handleError, EXIT_SUCCESS, EXIT_VALIDATION } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'validate', description: 'Check consistency of .sdlc/ directory' },
  args: {
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const report = await validateConsistency(projectRoot);

      if (args.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        printConsistencyReport(report);
      }

      process.exit(report.valid ? EXIT_SUCCESS : EXIT_VALIDATION);
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
