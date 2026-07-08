import { defineCommand } from 'citty';
import { generateSnapshot } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printSuccess, printInfo } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';

export default defineCommand({
  meta: { name: 'snapshot', description: 'Generate a quality snapshot' },
  args: {
    grade: { type: 'string', description: 'Overall grade (A+ through F)', required: true },
    score: { type: 'string', description: 'Overall score (0-100)' },
    coverage: { type: 'string', description: 'Test coverage percentage' },
    'tests-total': { type: 'string', description: 'Total number of tests' },
    'tests-passing': { type: 'string', description: 'Passing tests' },
    'tests-failing': { type: 'string', description: 'Failing tests' },
    vulnerabilities: { type: 'string', description: 'Security vulnerabilities count' },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();

      const testsTotal = args['tests-total'] ? Number(args['tests-total']) : undefined;
      const testsPassing = args['tests-passing'] ? Number(args['tests-passing']) : undefined;
      const testsFailing = args['tests-failing'] ? Number(args['tests-failing']) : undefined;

      const snapshot = await generateSnapshot(projectRoot, {
        grade: args.grade,
        score: args.score ? Number(args.score) : undefined,
        coverage: args.coverage ? Number(args.coverage) : undefined,
        tests: testsTotal !== undefined && testsPassing !== undefined && testsFailing !== undefined
          ? { total: testsTotal, passing: testsPassing, failing: testsFailing }
          : undefined,
        vulnerabilities: args.vulnerabilities ? Number(args.vulnerabilities) : undefined,
      });

      if (args.json) {
        console.log(JSON.stringify(snapshot, null, 2));
      } else {
        printSuccess('Quality snapshot generated.');
        printInfo('Grade', snapshot.overall.grade);
        if (snapshot.overall.score !== undefined) printInfo('Score', String(snapshot.overall.score));
        if (snapshot.coverage) printInfo('Coverage', `${snapshot.coverage.total}%`);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});
