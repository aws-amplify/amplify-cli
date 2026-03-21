import chalk from 'chalk';
import { DescribeChangeSetOutput } from '@aws-sdk/client-cloudformation';

/**
 * Produces a human-readable report of property changes from a described changeset.
 */
export function formatChangeSetReport(changeSet: DescribeChangeSetOutput): string {
  const changes = changeSet.Changes ?? [];
  if (changes.length === 0) return '';

  const lines: string[] = [];

  for (const change of changes) {
    const rc = change.ResourceChange;
    if (!rc) continue;

    const action = rc.Action ?? 'Unknown';
    const logicalId = rc.LogicalResourceId ?? 'Unknown';
    const resourceType = rc.ResourceType ?? 'Unknown';

    lines.push('');
    lines.push(`${chalk.bold(logicalId)} (${resourceType}) — ${chalk.yellow(action)}`);
    lines.push('');

    const details = rc.Details ?? [];
    const propDetails = details.filter((d) => d.Target?.Attribute === 'Properties' && d.Target?.Name);

    for (const detail of propDetails) {
      const target = detail.Target!;
      const name = target.Name!;
      const before = target.BeforeValue;
      const after = target.AfterValue;

      if (before && after) {
        lines.push(`  ${name}: ${chalk.red(before)} → ${chalk.green(after)}`);
      } else if (after) {
        lines.push(`  ${name}: ${chalk.green(`+ ${after}`)}`);
      } else if (before) {
        lines.push(`  ${name}: ${chalk.red(`- ${before}`)}`);
      } else {
        lines.push(`  ${name}: (changed)`);
      }
    }
  }

  return lines.join('\n');
}
