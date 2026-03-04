/**
 * Drift formatter for output display
 * Processes and formats drift detection results for CloudFormation stacks
 * Organized by category with drift types nested underneath
 */

import type { StackResourceDrift, PropertyDifference } from '@aws-sdk/client-cloudformation';
import { StackResourceDriftStatus } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import type { LocalDriftResults } from '../detect-local-drift';
import type { TemplateDriftResults } from '../detect-template-drift';
import { extractCategory } from '../../gen2-migration/categories';

// Types for Phase 2 changeset formatting (subset of fields used by the formatter)
interface ChangeSetChange {
  logicalResourceId: string;
  resourceType: string;
  action: string;
  nestedChanges?: ChangeSetChange[];
}

// CloudFormation template - only Resources field is used
export type CloudFormationTemplate = { Resources?: Record<string, unknown> };

/**
 * Resource count structure
 */
export interface ResourceCounts {
  drifted: number;
  inSync: number;
  unchecked: number;
  failed: number;
}

/**
 * Per-stack drift data with pre-computed counts
 */
export interface StackDriftData {
  logicalId: string;
  physicalName: string;
  category: string;
  drifts: StackResourceDrift[];
  template: CloudFormationTemplate;
  counts: ResourceCounts;
}

/**
 * Summary counts across all stacks
 */
export interface DriftSummary {
  totalStacks: number;
  totalDrifted: number;
  totalInSync: number;
  totalUnchecked: number;
  totalFailed: number;
}

/**
 * Complete processed drift data for formatting
 */
export interface ProcessedDriftData {
  projectName: string;
  rootStackName: string;
  root: StackDriftData;
  nestedStacks: StackDriftData[];
  summary: DriftSummary;
  phase2Results: TemplateDriftResults | null;
  phase3Results: LocalDriftResults | null;
  driftDetectionId?: string;
  stackDriftDetectionIds?: Map<string, string>;
  changeSetId?: string;
}

// Display constants
const DISPLAY_CONSTANTS = {
  BORDER_WIDTH: 61,
  TITLE_PADDING: 19,
} as const;

/** Check if a resource drift indicates actual drift (MODIFIED or DELETED) */
const isDrifted = (d: StackResourceDrift): boolean =>
  d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED;

/** Count resources with MODIFIED or DELETED status */
export function countDrifted(drifts: StackResourceDrift[]): number {
  return drifts.filter(isDrifted).length;
}

export function countInSync(drifts: StackResourceDrift[]): number {
  return drifts.filter((d) => d.StackResourceDriftStatus === StackResourceDriftStatus.IN_SYNC).length;
}

export function countUnchecked(drifts: StackResourceDrift[], template: CloudFormationTemplate): number {
  const checkedResourceIds = new Set(drifts.map((d) => d.LogicalResourceId));
  const allResourceIds = Object.keys(template.Resources || {});
  const notInResults = allResourceIds.filter((id) => !checkedResourceIds.has(id)).length;
  const notChecked = drifts.filter((d) => d.StackResourceDriftStatus === StackResourceDriftStatus.NOT_CHECKED).length;
  return notInResults + notChecked;
}

export function countFailed(drifts: StackResourceDrift[]): number {
  return drifts.filter((d) => d.StackResourceDriftStatus === StackResourceDriftStatus.UNKNOWN).length;
}

/** Create the summary dashboard box with drift statistics */
export function createSummaryDashboard(data: ProcessedDriftData): string {
  const projectName = data.projectName;
  const summary = data.summary;

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
  // Strip ANSI codes to get actual text length
  const stripAnsi = (str: string): string => {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\u001b\[[0-9;]*m/g, '');
  };

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
  }>;
  templateChanges: ChangeSetChange[];
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
function getActionSymbol(action: string): string {
  if (action === 'Add') return '+';
  if (action === 'Remove') return '-';
  return '~';
}

/**
 * Get the drift status symbol for CF drift resources
 */
function getCFDriftSymbol(status: string | undefined): string {
  if (status === 'MODIFIED') return '~';
  if (status === 'DELETED') return '-';
  return '?';
}

/**
 * Collect all categories that have drift across all 3 phases
 */
function collectDriftCategories(data: ProcessedDriftData): Map<string, CategoryDrift> {
  const categories = new Map<string, CategoryDrift>();

  const ensureCategory = (name: string): CategoryDrift => {
    if (!categories.has(name)) {
      categories.set(name, { cfDriftStacks: [], templateChanges: [], hasLocalDrift: false });
    }
    return categories.get(name)!;
  };

  // Phase 1: CF Drift - group nested stacks by category
  for (const stack of data.nestedStacks) {
    const categoryName = extractCategory(stack.category || stack.logicalId);
    const driftedResources = stack.drifts.filter(isDrifted);
    if (driftedResources.length > 0) {
      const cat = ensureCategory(categoryName);
      cat.cfDriftStacks.push({
        logicalId: stack.logicalId,
        driftedResources,
      });
    }
  }

  // Also check root stack CF drift
  const rootDrifted = data.root.drifts.filter(isDrifted);
  if (rootDrifted.length > 0) {
    const cat = ensureCategory('Core Infrastructure');
    cat.cfDriftStacks.push({
      logicalId: 'ROOT',
      driftedResources: rootDrifted,
    });
  }

  // Phase 2: Template Drift - map changeset changes to categories
  if (data.phase2Results && !data.phase2Results.skipped && data.phase2Results.changes.length > 0) {
    for (const change of data.phase2Results.changes) {
      // For nested stack changes, extract category from logicalResourceId
      if (change.resourceType === 'AWS::CloudFormation::Stack' && change.nestedChanges && change.nestedChanges.length > 0) {
        const categoryName = extractCategory(change.logicalResourceId);
        const cat = ensureCategory(categoryName);
        // Add the nested changes under this category
        for (const nestedChange of change.nestedChanges) {
          cat.templateChanges.push(nestedChange);
        }
      } else {
        // Direct resource change - try to map via logicalResourceId
        const categoryName = extractCategory(change.logicalResourceId);
        const cat = ensureCategory(categoryName);
        cat.templateChanges.push(change);
      }
    }
  }

  // Phase 3: Local Drift - map by category
  if (data.phase3Results && !data.phase3Results.skipped && data.phase3Results.totalDrifted > 0) {
    const allResources = [
      ...(data.phase3Results.resourcesToBeCreated || []),
      ...(data.phase3Results.resourcesToBeUpdated || []),
      ...(data.phase3Results.resourcesToBeDeleted || []),
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
function formatCFDriftForCategory(
  stacks: CategoryDrift['cfDriftStacks'],
  stackDriftDetectionIds?: Map<string, string>,
  driftDetectionId?: string,
): string {
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
      if (drift.StackResourceDriftStatus === 'MODIFIED' && drift.PropertyDifferences && drift.PropertyDifferences.length > 0) {
        output += formatPropertyDiffs(drift.PropertyDifferences);
      }
    }
  }

  // Show drift detection ID
  // Use the most relevant drift detection ID for this category
  let relevantDriftId = driftDetectionId;
  if (stackDriftDetectionIds && stacks.length > 0) {
    const firstStackId = stacks[0].logicalId;
    if (firstStackId !== 'ROOT' && stackDriftDetectionIds.has(firstStackId)) {
      relevantDriftId = stackDriftDetectionIds.get(firstStackId);
    }
  }
  if (relevantDriftId) {
    output += `    Drift Id: ${relevantDriftId}\n`;
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
function formatTemplateDriftForCategory(changes: ChangeSetChange[], changeSetId?: string): string {
  let output = `  Template Drift: S3 and deployed templates differ\n`;

  for (const change of changes) {
    const symbol = getActionSymbol(change.action);
    const resourceType = change.resourceType || 'Unknown';
    const logicalId = change.logicalResourceId || 'Unknown';
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
export function createUnifiedCategoryView(data: ProcessedDriftData): string | undefined {
  const categories = collectDriftCategories(data);

  if (categories.size === 0) {
    return undefined;
  }

  let output = '\n';

  for (const [categoryName, drift] of categories) {
    // Category header: bold uppercase
    output += chalk.bold(categoryName.toUpperCase()) + '\n';

    // CloudFormation Drift
    if (drift.cfDriftStacks.length > 0) {
      output += formatCFDriftForCategory(drift.cfDriftStacks, data.stackDriftDetectionIds, data.driftDetectionId);
    }

    // Template Drift
    if (drift.templateChanges.length > 0) {
      output += formatTemplateDriftForCategory(drift.templateChanges, data.changeSetId);
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
export function formatDriftResults(data: ProcessedDriftData) {
  const summaryDashboard = createSummaryDashboard(data);
  const categoryView = createUnifiedCategoryView(data);

  return {
    summaryDashboard,
    categoryView,
  };
}
