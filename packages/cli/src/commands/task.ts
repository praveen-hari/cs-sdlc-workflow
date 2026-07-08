import { defineCommand } from 'citty';
import { listPlanTasks, syncPlanProgress } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { printSuccess } from '../output/human.js';
import { handleError } from '../utils/error-handler.js';
import pc from 'picocolors';

const listSubcommand = defineCommand({
  meta: { name: 'list', description: 'List tasks in a work item plan' },
  args: {
    'work-id': { type: 'positional', description: 'Work item ID', required: true },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const summary = await listPlanTasks(projectRoot, args['work-id']);

      if (args.json) {
        console.log(JSON.stringify(summary, null, 2));
      } else {
        console.log(`\n  ${pc.bold(args['work-id'])} — ${summary.completedTasks}/${summary.totalTasks} tasks done\n`);
        for (const task of summary.tasks) {
          const icon = task.completed ? pc.green('✓') : pc.dim('○');
          const text = task.completed ? pc.dim(task.text) : task.text;
          console.log(`  ${pc.dim(`${task.number}.`)} ${icon} ${text}`);
        }
        console.log();
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});

const syncSubcommand = defineCommand({
  meta: { name: 'sync', description: 'Sync plan front matter counters from checkbox state' },
  args: {
    'work-id': { type: 'positional', description: 'Work item ID', required: true },
    json: { type: 'boolean', description: 'Output as JSON', default: false },
  },
  async run({ args }) {
    try {
      const projectRoot = await resolveProjectRoot();
      const summary = await syncPlanProgress(projectRoot, args['work-id']);

      if (args.json) {
        console.log(JSON.stringify(summary, null, 2));
      } else {
        printSuccess(`Plan synced: ${summary.completedTasks}/${summary.totalTasks} tasks done`);
      }
    } catch (err) {
      handleError(err, args.json);
    }
  },
});

export default defineCommand({
  meta: { name: 'task', description: 'View and sync tasks within a work item plan' },
  subCommands: {
    list: listSubcommand,
    sync: syncSubcommand,
  },
});
