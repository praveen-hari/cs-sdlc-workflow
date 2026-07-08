import { defineCommand } from 'citty';
import { initSdlc, initSdlcFromScan } from '@syncfusion/cs-sdlc';
import { printSuccess, printInfo, printStatus } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'init', description: 'Initialize a new .sdlc/ directory' },
  args: {
    scan: { type: 'boolean', description: 'Scan existing project (brownfield)', default: false },
    name: { type: 'string', description: 'Project name' },
    description: { type: 'string', description: 'Project description' },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = process.cwd();

      if (args.scan) {
        const result = await initSdlcFromScan(projectRoot);
        if (args.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          printSuccess('Initialized .sdlc/ (brownfield scan)');
          printInfo('Stack', result.detectedStack?.language ?? 'unknown');
          printInfo('Modules', String(result.detectedModules));
          printInfo('CI detected', String(result.detectedArtifacts.hasCI));
          printStatus(result.manifest);
        }
      } else {
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
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
