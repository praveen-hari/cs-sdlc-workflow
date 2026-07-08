import { defineCommand } from 'citty';
import { createRelease } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printSuccess, printInfo } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'release', description: 'Create a release record' },
  args: {
    version: { type: 'positional', description: 'Semantic version (e.g., 1.0.0)', required: true },
    title: { type: 'string', description: 'Release title/codename' },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const result = await createRelease(projectRoot, {
        version: args.version,
        title: args.title,
      });

      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printSuccess(`Created release v${result.version}`);
        printInfo('Path', `.sdlc/${result.path}`);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
