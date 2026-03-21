import chalk from 'chalk';
import { CFNTemplate } from '../cfn-template';

/**
 * Produces a per-resource property diff between a deployed and resolved template.
 */
export function formatTemplateDiff(deployed: CFNTemplate, resolved: CFNTemplate): string {
  const lines: string[] = [];
  const allIds = new Set([...Object.keys(deployed.Resources ?? {}), ...Object.keys(resolved.Resources ?? {})]);

  for (const logicalId of allIds) {
    const oldRes = deployed.Resources?.[logicalId];
    const newRes = resolved.Resources?.[logicalId];

    if (!oldRes && newRes) {
      lines.push(`${chalk.green('+')} ${chalk.bold(logicalId)} (${newRes.Type})`);
      continue;
    }
    if (oldRes && !newRes) {
      lines.push(`${chalk.red('-')} ${chalk.bold(logicalId)} (${oldRes.Type})`);
      continue;
    }
    if (!oldRes || !newRes) continue;

    const propDiffs = diffProperties(oldRes.Properties ?? {}, newRes.Properties ?? {});
    if (propDiffs.length === 0) continue;

    lines.push(`${chalk.yellow('~')} ${chalk.bold(logicalId)} (${oldRes.Type})`);
    lines.push(...propDiffs);
  }

  return lines.join('\n');
}

function diffProperties(oldProps: Record<string, unknown>, newProps: Record<string, unknown>, prefix = ''): string[] {
  const lines: string[] = [];
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const oldVal = oldProps[key];
    const newVal = newProps[key];

    if (oldVal === undefined) {
      lines.push(`  ${chalk.green('+')} ${path}: ${format(newVal)}`);
    } else if (newVal === undefined) {
      lines.push(`  ${chalk.red('-')} ${path}: ${format(oldVal)}`);
    } else if (typeof oldVal === 'object' && typeof newVal === 'object' && oldVal !== null && newVal !== null) {
      if (!Array.isArray(oldVal) && !Array.isArray(newVal)) {
        lines.push(...diffProperties(oldVal as Record<string, unknown>, newVal as Record<string, unknown>, path));
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        lines.push(`  ${chalk.yellow('~')} ${path}: ${format(oldVal)} → ${format(newVal)}`);
      }
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      lines.push(`  ${chalk.yellow('~')} ${path}: ${format(oldVal)} → ${format(newVal)}`);
    }
  }

  return lines;
}

function format(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}
