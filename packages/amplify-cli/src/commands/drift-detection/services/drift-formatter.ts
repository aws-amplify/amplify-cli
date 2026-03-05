/**
 * Drift formatter for output display
 * Processes and formats drift detection results for CloudFormation stacks
 * Organized by category with drift types nested underneath
 */

import type { StackResourceDrift, PropertyDifference } from '@aws-sdk/client-cloudformation';
import { StackResourceDriftStatus, ChangeAction } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import type { LocalDriftResults } from '../detect-local-drift';
import type { TemplateDriftResults, ResourceChangeWithNested } from '../detect-template-drift';
import { type StackDriftNode, type CloudFormationDriftResults, type DriftSummary, isDrifted } from '../detect-stack-drift';
import { extractCategory } from '../../gen2-migration/categories';

/** Strip ANSI escape codes to get actual text length */
// eslint-disable-next-line no-control-regex
const stripAnsi = (str: string): string => str.replace(/\u001b\[[0-9;]*m/g, '');

// Display constants
const DISPLAY_CONSTANTS = {
  BORDER_WIDTH: 61,
  TITLE_PADDING: 19,
} as const;

/** Create the summary dashboard box with drift statistics */
export function createSummaryDashboard(summary: DriftSummary, projectName: string): string {
  const border = '─'.repeat(DISPLAY_CONSTANTS.BORDER_WIDTH);
  let dashboard = '';

  dashboard += `┌${border}┐\n`;
  dashboard += `│${' '.repeat(DISPLAY_CONSTANTS.TITLE_PADDING)}DRIFT DETECTION SUMMARY${' '.repeat(DISPLAY_CONSTANTS.TITLE_PADDING)}│\n`;
  dashboard += `├${border}┤\n`;

  // Project name
  dashboard += formatDashboardLine('Project', chalk.bold(projectName));

  // Total stacks
  dashboard += formatDashboardLine('Total Stacks Checked', chalk.bold(String(summary.totalStacks)));

  // Resources with drift
  const driftedColor = summary.totalDrifted > 0 ? chalk.red : chalk.green;
  dashboard += formatDashboardLine('Resources with Drift', driftedColor(String(summary.totalDrifted)));

  // Resources in sync
  dashboard += formatDashboardLine('Resources in Sync', chalk.green(String(summary.totalInSync)));

  // Unchecked resources
  dashboard += formatDashboardLine('Unchecked Resources', chalk.gray(String(summary.totalUnchecked)));

  // Failed checks (if any)
  if (summary.totalFailed > 0) {
    dashboard += formatDashboardLine('Failed Drift Checks', chalk.yellow(String(summary.totalFailed)));
  }

  dashboard += `└${border}┘`;

  // Warning message for failed checks
  if (summary.totalFailed > 0) {
    dashboard +=
      '\n' +
      chalk.yellow(
        `WARNING: Drift detection failed for ${summary.totalFailed} resource(s).\n` +
          `This may be due to insufficient permissions or AWS API issues.\n` +
          `Run with --debug to see which resources failed.`,
      );
  }

  return dashboard;
}

/** Format a single line in the dashboard box with proper padding */
function formatDashboardLine(label: string, value: string): string {
  const actualValueLength = stripAnsi(value).length;

  // Calculate padding: border width - "│ " (2) - label - ": " (2) - value length - "│" (1)
  const usedLength = 2 + label.length + 2 + actualValueLength + 1;
  const padding = DISPLAY_CONSTANTS.BORDER_WIDTH + 2 - usedLength;

  return `│ ${label}: ${value}${' '.repeat(Math.max(0, padding))}│\n`;
}

interface CategoryDrift {
  cfDriftStacks: Array<{
    logicalId: string;
    driftedResources: StackResourceDrift[];
    driftDetectionId: string;
  }>;
  templateChanges: ResourceChangeWithNested[];
  hasLocalDrift: boolean;
}

/**
 * Color a resource line based on its action/status symbol
 */
function colorResourceLine(symbol: string, line: string): string {
  if (symbol === '+') return chalk.green(line);
  if (symbol === '-') return chalk.red(line);
  if (symbol === '~') return chalk.yellow(line);
  return line;
}

/**
 * Get action symbol for changeset resource changes (Add/Remove/Modify)
 */
function getActionSymbol(action: ChangeAction | undefined): string {
  if (action === ChangeAction.Add) return '+';
  if (action === ChangeAction.Remove) return '-';
  return '~';
}

/**
 * Get the drift status symbol for CF drift resources
 */
function getCFDriftSymbol(status: StackResourceDriftStatus | undefined): string {
  if (status === StackResourceDriftStatus.MODIFIED) return '~';
  if (status === StackResourceDriftStatus.DELETED) return '-';
  return '?';
}

/**
 * Flatten a StackDriftNode tree into a flat list (root + all descendants)
 */
function flattenTree(node: StackDriftNode, result: StackDriftNode[] = []): StackDriftNode[] {
  result.push(node);
  for (const child of node.children) flattenTree(child, result);
  return result;
}

/**
 * Collect all categories that have drift across all 3 phases
 */
function collectDriftCategories(
  phase1: CloudFormationDriftResults,
  phase2: TemplateDriftResults,
  phase3: LocalDriftResults,
): Map<string, CategoryDrift> {
  const categories = new Map<string, CategoryDrift>();

  const ensureCategory = (name: string): CategoryDrift => {
    if (!categories.has(name)) {
      categories.set(name, { cfDriftStacks: [], templateChanges: [], hasLocalDrift: false });
    }
    return categories.get(name)!;
  };

  // Phase 1: CF Drift — flatten tree and iterate uniformly
  const allNodes = flattenTree(phase1.root);
  for (const node of allNodes) {
    const driftedResources = node.drifts.filter(isDrifted);
    if (driftedResources.length > 0) {
      const categoryName = node.category;
      const cat = ensureCategory(categoryName);
      cat.cfDriftStacks.push({
        logicalId: node.logicalId,
        driftedResources,
        driftDetectionId: node.driftDetectionId,
      });
    }
  }

  // Phase 2: Template Drift - map changeset changes to categories
  if (!phase2.skipped && phase2.changes.length > 0) {
    for (const change of phase2.changes) {
      // For nested stack changes, extract category from LogicalResourceId
      if (change.ResourceType === 'AWS::CloudFormation::Stack' && change.nestedChanges && change.nestedChanges.length > 0) {
        const categoryName = extractCategory(change.LogicalResourceId);
        const cat = ensureCategory(categoryName);
        // Add the nested changes under this category
        for (const nestedChange of change.nestedChanges) {
          cat.templateChanges.push(nestedChange);
        }
      } else {
        // Direct resource change - try to map via LogicalResourceId
        const categoryName = extractCategory(change.LogicalResourceId);
        const cat = ensureCategory(categoryName);
        cat.templateChanges.push(change);
      }
    }
  }

  // Phase 3: Local Drift - map by category
  if (!phase3.skipped && phase3.totalDrifted > 0) {
    const allResources = [
      ...(phase3.resourcesToBeCreated || []),
      ...(phase3.resourcesToBeUpdated || []),
      ...(phase3.resourcesToBeDeleted || []),
    ];

    for (const resource of allResources) {
      const categoryName = extractCategory(resource.category || resource.service || 'Other');
      const cat = ensureCategory(categoryName);
      cat.hasLocalDrift = true;
    }
  }

  return categories;
}

/**
 * Format CloudFormation drift resources for a category
 */
function formatCFDriftForCategory(stacks: CategoryDrift['cfDriftStacks']): string {
  let output = `  CloudFormation Drift: Deployed resources do not match templates\n`;

  for (const stack of stacks) {
    for (const drift of stack.driftedResources) {
      const symbol = getCFDriftSymbol(drift.StackResourceDriftStatus);
      const resourceType = drift.ResourceType || 'Unknown';
      const logicalId = drift.LogicalResourceId || 'Unknown';
      const arn = drift.PhysicalResourceId || '';
      const arnSuffix = arn ? `      ${arn}` : '';
      const line = `${symbol} ${resourceType}  (${logicalId})${arnSuffix}`;

      output += `    ${colorResourceLine(symbol, line)}\n`;

      // Show property differences for MODIFIED resources
      if (
        drift.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED &&
        drift.PropertyDifferences &&
        drift.PropertyDifferences.length > 0
      ) {
        output += formatPropertyDiffs(drift.PropertyDifferences);
      }
    }

    if (stack.driftDetectionId) {
      output += `    Drift Id: ${stack.driftDetectionId}\n`;
    }
  }

  return output;
}

/**
 * Format property differences for CF drift resources
 */
function formatPropertyDiffs(differences: PropertyDifference[]): string {
  let output = '';
  for (const propDiff of differences) {
    output += `      Property: ${propDiff.PropertyPath}\n`;
    if (propDiff.ActualValue) {
      output += `        ${chalk.green(`+ "${propDiff.ActualValue}"`)}\n`;
    }
    if (propDiff.ExpectedValue) {
      output += `        ${chalk.red(`- "${propDiff.ExpectedValue}"`)}\n`;
    }
  }
  return output;
}

/**
 * Format template drift changes for a category
 */
function formatTemplateDriftForCategory(changes: ResourceChangeWithNested[], changeSetId?: string): string {
  let output = `  Template Drift: S3 and deployed templates differ\n`;

  for (const change of changes) {
    const symbol = getActionSymbol(change.Action);
    const resourceType = change.ResourceType || 'Unknown';
    const logicalId = change.LogicalResourceId || 'Unknown';
    const line = `${symbol} ${resourceType}  (${logicalId})`;

    output += `    ${colorResourceLine(symbol, line)}\n`;
  }

  if (changeSetId) {
    output += `    Changeset Id: ${changeSetId}\n`;
  }

  return output;
}

/**
 * Format local drift for a category
 */
function formatLocalDriftForCategory(): string {
  return `  Local Drift: Undeployed changes in this category\n`;
}

/**
 * Create unified category view — the main output function
 * Groups all drift types by category
 */
export function createUnifiedCategoryView(
  phase1: CloudFormationDriftResults,
  phase2: TemplateDriftResults,
  phase3: LocalDriftResults,
): string | undefined {
  const categories = collectDriftCategories(phase1, phase2, phase3);

  if (categories.size === 0) {
    return undefined;
  }

  const changeSetId = phase2.changeSetId;

  let output = '\n';

  for (const [categoryName, drift] of categories) {
    // Category header: bold uppercase
    output += chalk.bold(categoryName.toUpperCase()) + '\n';

    // CloudFormation Drift
    if (drift.cfDriftStacks.length > 0) {
      output += formatCFDriftForCategory(drift.cfDriftStacks);
    }

    // Template Drift
    if (drift.templateChanges.length > 0) {
      output += formatTemplateDriftForCategory(drift.templateChanges, changeSetId);
    }

    // Local Drift
    if (drift.hasLocalDrift) {
      output += formatLocalDriftForCategory();
    }

    output += '\n';
  }

  return output;
}

/**
 * Format drift results into display strings
 * Returns summary dashboard and category view
 */
export function formatDriftResults(
  phase1: CloudFormationDriftResults,
  phase2: TemplateDriftResults,
  phase3: LocalDriftResults,
  projectName: string,
): { summaryDashboard: string; categoryView: string | undefined } {
  const summaryDashboard = createSummaryDashboard(phase1.summary, projectName);
  const categoryView = createUnifiedCategoryView(phase1, phase2, phase3);

  return {
    summaryDashboard,
    categoryView,
  };
}
