/**
 * Human-readable colored output formatters.
 */

import pc from 'picocolors';
import type { Manifest, WorkIndex, DecisionsIndex, ReleasesIndex, WorkItem, DecisionRecord, ConsistencyReport } from '@syncfusion/cs-sdlc';

export function printSuccess(message: string): void {
  console.log(`${pc.green('✓')} ${message}`);
}

export function printInfo(label: string, value: string): void {
  console.log(`  ${pc.dim(label + ':')}  ${value}`);
}

export function printStatus(manifest: Manifest): void {
  console.log(pc.bold(`\n  ${manifest.project.name}`));
  if (manifest.project.description) {
    console.log(`  ${pc.dim(manifest.project.description)}`);
  }
  console.log();

  if (manifest.phase) {
    printInfo('Phase', manifest.phase);
  }
  printInfo('Active work', String(manifest.counters.activeWork));
  printInfo('Completed', String(manifest.counters.totalCompleted));
  printInfo('Decisions', String(manifest.counters.decisions));
  printInfo('Releases', String(manifest.counters.releases));

  if (manifest.health) {
    console.log();
    console.log(`  ${pc.dim('Health:')}`);
    if (manifest.health.grade) printInfo('  Grade', manifest.health.grade);
    if (manifest.health.coverage !== undefined) printInfo('  Coverage', `${manifest.health.coverage}%`);
    if (manifest.health.securityIssues !== undefined) printInfo('  Security', `${manifest.health.securityIssues} issues`);
  }

  if (manifest.modules) {
    console.log();
    console.log(`  ${pc.dim('Modules:')}`);
    for (const [id, mod] of Object.entries(manifest.modules)) {
      console.log(`    ${pc.cyan(id)} ${pc.dim(`(${mod.type})`)} → ${mod.path}`);
    }
  }
  console.log();
}

export function printWorkIndex(index: WorkIndex): void {
  if (index.active.length === 0 && index.recent.length === 0) {
    console.log(pc.dim('  No work items.'));
    return;
  }

  if (index.active.length > 0) {
    console.log(pc.bold('\n  Active'));
    for (const item of index.active) {
      const priority = item.priority ? pc.yellow(` [${item.priority}]`) : '';
      const progress = item.progress !== undefined ? pc.dim(` ${item.progress}%`) : '';
      console.log(`    ${pc.green('●')} ${item.title} ${pc.dim(`(${item.id})`)}${priority}${progress}`);
    }
  }

  if (index.recent.length > 0) {
    console.log(pc.bold('\n  Recently Completed'));
    for (const item of index.recent) {
      console.log(`    ${pc.dim('✓')} ${item.title} ${pc.dim(`(${item.id})`)}`);
    }
  }
  console.log();
}

export function printDecisionsIndex(index: DecisionsIndex): void {
  if (index.entries.length === 0) {
    console.log(pc.dim('  No decisions.'));
    return;
  }
  console.log();
  for (const entry of index.entries) {
    const status = entry.status === 'accepted' ? pc.green(entry.status)
      : entry.status === 'superseded' ? pc.dim(entry.status)
      : pc.yellow(entry.status);
    console.log(`  ${pc.bold(`ADR-${entry.id}`)} ${entry.title} ${pc.dim(`[${status}]`)}`);
  }
  console.log();
}

export function printReleasesIndex(index: ReleasesIndex): void {
  if (index.entries.length === 0) {
    console.log(pc.dim('  No releases.'));
    return;
  }
  console.log();
  for (const entry of index.entries) {
    const title = entry.title ? ` — ${entry.title}` : '';
    console.log(`  ${pc.bold(`v${entry.version}`)}${title} ${pc.dim(`(${entry.date})`)}`);
  }
  console.log();
}

export function printWorkItem(item: WorkItem): void {
  const fm = item.brief.frontMatter;
  console.log(pc.bold(`\n  ${fm?.title ?? item.id}`));
  if (fm) {
    printInfo('ID', item.id);
    printInfo('Type', fm.type);
    if (fm.priority) printInfo('Priority', fm.priority);
    if (fm.status) printInfo('Status', fm.status);
    if (fm.modules) printInfo('Modules', fm.modules.join(', '));
    printInfo('Created', fm.createdAt);
    if (fm.completedAt) printInfo('Completed', fm.completedAt);
  }
  console.log();
  if (item.brief.body) {
    console.log(item.brief.body);
  }
}

export function printDecisionRecord(record: DecisionRecord): void {
  const fm = record.document.frontMatter;
  console.log(pc.bold(`\n  ADR-${record.id}: ${fm?.title ?? record.slug}`));
  if (fm) {
    printInfo('Status', fm.status);
    printInfo('Date', fm.date);
    if (fm.supersedes) printInfo('Supersedes', `ADR-${fm.supersedes}`);
    if (fm.supersededBy) printInfo('Superseded by', `ADR-${fm.supersededBy}`);
  }
  console.log();
  if (record.document.body) {
    console.log(record.document.body);
  }
}

export function printConsistencyReport(report: ConsistencyReport): void {
  if (report.valid) {
    printSuccess('All consistency checks passed.');
  } else {
    console.log(`${pc.red('✗')} ${report.issues.length} issue(s) found:\n`);
    for (const issue of report.issues) {
      const icon = issue.type === 'error' ? pc.red('✗') : pc.yellow('⚠');
      console.log(`  ${icon} ${pc.dim(`[${issue.code}]`)} ${issue.message}`);
    }
  }
  console.log();
}
