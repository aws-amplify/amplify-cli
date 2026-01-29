/**
 * Drift formatter for output display
 * Processes and formats drift detection results for CloudFormation stacks
 */

import type { StackResourceDrift, PropertyDifference } from '@aws-sdk/client-cloudformation';
import { StackResourceDriftStatus } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import type { LocalDriftResults, ResourceInfo } from '../detect-local-drift';
import type { TemplateDriftResults } from '../detect-template-drift';
import { extractCategory } from '../../gen2-migration/categories';

// Types for Phase 2 changeset formatting
interface ChangeSetDetail {
  name?: string;
  changeSource?: string;
  requiresRecreation?: string;
}

interface ChangeSetChange {
  logicalResourceId: string;
  resourceType: string;
  action: string;
  replacement: boolean;
  details?: ChangeSetDetail[];
  nestedChanges?: ChangeSetChange[];
}

// CloudFormation template - only Resources field is used
export type CloudFormationTemplate = { Resources?: Record<string, unknown> };

/**
 * Output format options
 */
export type DriftDisplayFormat = 'tree' | 'summary' | 'json';

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
 * Extended drift resource with context
 */
interface ExtendedDriftResource extends StackResourceDrift {
  stackContext: string;
  category: string;
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
}

/**
 * Output from formatting functions
 */
export interface FormattedDriftOutput {
  summaryDashboard: string;
  treeView?: string;
  detailedChanges?: string;
  categoryBreakdown?: string;
  phase2Output?: string;
  phase3Output?: string;
  totalDrifted: number;
}

// Display constants
const DISPLAY_CONSTANTS = {
  BORDER_WIDTH: 61,
  TITLE_PADDING: 19,
} as const;

// Tree display constants
const TREE_SYMBOLS = {
  BRANCH: '├──',
  LAST_BRANCH: '└──',
  VERTICAL: '│   ',
  EMPTY: '    ',
} as const;

/** Count resources with MODIFIED or DELETED status */
export function countDrifted(drifts: StackResourceDrift[]): number {
  return drifts.filter(
    (d) =>
      d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED,
  ).length;
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

  dashboard += chalk.cyan(`┌${border}┐\n`);
  dashboard += chalk.cyan(
    `│${' '.repeat(DISPLAY_CONSTANTS.TITLE_PADDING)}DRIFT DETECTION SUMMARY${' '.repeat(DISPLAY_CONSTANTS.TITLE_PADDING)}│\n`,
  );
  dashboard += chalk.cyan(`├${border}┤\n`);

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

  dashboard += chalk.cyan(`└${border}┘`);

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

  const valueStr = value.toString();
  const actualValueLength = stripAnsi(valueStr).length;

  // Calculate padding: border width - "│ " (2) - label - ": " (2) - value length - "│" (1)
  const usedLength = 2 + label.length + 2 + actualValueLength + 1;
  const padding = DISPLAY_CONSTANTS.BORDER_WIDTH + 2 - usedLength;

  return chalk.cyan(`│ ${label}: ${value}${' '.repeat(Math.max(0, padding))}│\n`);
}

/** Create hierarchical tree view of stacks and their drift status */
export function createTreeView(data: ProcessedDriftData): string {
  let tree = '';

  tree += chalk.bold('\nSTACK HIERARCHY:\n');

  // Root stack with counts
  tree += `${chalk.blue(data.rootStackName)} ${chalk.gray('(ROOT)')}\n`;

  // Use pre-computed root counts
  const rootCounts = data.root.counts;
  tree += formatResourceCountsAsTree(rootCounts, '');

  // Build and render nested stack hierarchy
  const stackHierarchy = buildStackHierarchy(data.nestedStacks);
  tree = renderStackHierarchy(stackHierarchy, tree, '');

  return tree;
}

function formatResourceCountsAsTree(counts: ResourceCounts, prefix: string): string {
  let result = '';
  const items: Array<{ label: string; count: number; color: (text: string) => string }> = [];

  if (counts.drifted > 0) {
    items.push({ label: 'DRIFTED', count: counts.drifted, color: chalk.red });
  }
  if (counts.inSync > 0) {
    items.push({ label: 'IN SYNC', count: counts.inSync, color: chalk.green });
  }
  if (counts.unchecked > 0) {
    items.push({ label: 'UNCHECKED', count: counts.unchecked, color: chalk.gray });
  }
  if (counts.failed > 0) {
    items.push({ label: 'FAILED', count: counts.failed, color: chalk.yellow });
  }

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const symbol = isLast ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;
    const plural = item.count === 1 ? '' : 's';
    result += `${prefix}${symbol} ${item.color(`${item.label}:`)} ${item.count} resource${plural}\n`;
  });

  return result;
}

interface StackHierarchyNode {
  stack: StackDriftData | null;
  children: Map<string, StackHierarchyNode>;
}

function buildStackHierarchy(nestedStacks: StackDriftData[]): Map<string, StackHierarchyNode> {
  const hierarchy = new Map<string, StackHierarchyNode>();

  nestedStacks.forEach((nestedStack) => {
    const parts = nestedStack.logicalId.split('/');

    if (parts.length === 1) {
      // Top-level nested stack
      if (!hierarchy.has(parts[0])) {
        hierarchy.set(parts[0], {
          stack: nestedStack,
          children: new Map<string, StackHierarchyNode>(),
        });
      }
    } else {
      // Nested within another nested stack
      const topLevel = parts[0];
      const childName = parts.slice(1).join('/');

      if (!hierarchy.has(topLevel)) {
        // Create placeholder for parent if it doesn't exist
        hierarchy.set(topLevel, {
          stack: null,
          children: new Map<string, StackHierarchyNode>(),
        });
      }

      const parent = hierarchy.get(topLevel)!;
      parent.children.set(childName, {
        stack: nestedStack,
        children: new Map<string, StackHierarchyNode>(),
      });
    }
  });

  return hierarchy;
}

function renderStackHierarchy(hierarchy: Map<string, StackHierarchyNode>, tree: string, prefix: string): string {
  const entries = Array.from(hierarchy.entries());

  entries.forEach(([name, node], index) => {
    const isLastItem = index === entries.length - 1;
    const nodePrefix = isLastItem ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;
    const childPrefix = isLastItem ? TREE_SYMBOLS.EMPTY : TREE_SYMBOLS.VERTICAL;

    if (node.stack) {
      // Use pre-computed counts from StackDriftData
      const counts = node.stack.counts;
      const categoryName = extractCategory(node.stack.category || node.stack.logicalId);

      const displayName = name.includes('/') ? name.split('/').pop() : name;

      tree += `${prefix}${nodePrefix} ${chalk.blue(displayName)} ${chalk.gray(`(${categoryName})`)}\n`;

      // Format resource counts for this stack
      const resourcePrefix = prefix + childPrefix;
      tree += formatResourceCountsAsTree(counts, resourcePrefix);

      // Render children if any
      if (node.children && node.children.size > 0) {
        tree = renderStackHierarchy(node.children, tree, prefix + childPrefix);
      }
    }
  });

  return tree;
}

const isDrifted = (d: StackResourceDrift): boolean =>
  d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED;

function getAllDriftedResources(data: ProcessedDriftData): ExtendedDriftResource[] {
  const rootDrifted = data.root.drifts.filter(isDrifted).map(
    (drift): ExtendedDriftResource => ({
      ...drift,
      stackContext: 'ROOT',
      category: 'Core Infrastructure',
    }),
  );

  const nestedDrifted = data.nestedStacks.flatMap((stack) =>
    stack.drifts.filter(isDrifted).map(
      (drift): ExtendedDriftResource => ({
        ...drift,
        stackContext: stack.logicalId,
        category: extractCategory(stack.category || stack.logicalId),
      }),
    ),
  );

  return [...rootDrifted, ...nestedDrifted];
}

function formatPropertyDifferences(differences: PropertyDifference[], prefix: string): string {
  let result = '';

  differences.forEach((propDiff, propIndex) => {
    const isLastProp = propIndex === differences.length - 1;
    const propPrefix = isLastProp ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;

    result += `${prefix}${propPrefix} ${chalk.yellow('PROPERTY:')} ${propDiff.PropertyPath}\n`;

    const valuePrefix = isLastProp ? TREE_SYMBOLS.EMPTY : TREE_SYMBOLS.VERTICAL;
    // ActualValue (current/remote state) is shown first with + (green)
    result += `${prefix}${valuePrefix}├── ${chalk.green('[+]')} ${chalk.green(propDiff.ActualValue)}\n`;
    // ExpectedValue (template/local state) is shown second with - (red)
    result += `${prefix}${valuePrefix}└── ${chalk.red('[-]')} ${chalk.red(propDiff.ExpectedValue)}\n`;
  });

  return result;
}

function formatDriftedResource(drift: ExtendedDriftResource, isLast: boolean): string {
  const prefix = isLast ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;

  const parentContext =
    drift.stackContext === 'ROOT'
      ? chalk.gray(` → ${chalk.bold('Root Stack')}`)
      : chalk.gray(` → ${chalk.bold(drift.category)} → ${drift.stackContext}`);

  let result = `${prefix} ${chalk.red('DRIFTED:')} ${chalk.cyan(drift.ResourceType)} ${chalk.bold(
    drift.LogicalResourceId,
  )}${parentContext}\n`;

  // Add property differences if any
  if (drift.PropertyDifferences && drift.PropertyDifferences.length > 0) {
    const detailPrefix = isLast ? TREE_SYMBOLS.EMPTY : TREE_SYMBOLS.VERTICAL;
    result += formatPropertyDifferences(drift.PropertyDifferences, detailPrefix);
  }

  return result;
}

export function createDetailedChanges(data: ProcessedDriftData): string {
  const allDriftedResources = getAllDriftedResources(data);

  if (allDriftedResources.length === 0) {
    return '';
  }

  let details = chalk.bold('\nDETAILED CHANGES:\n');

  allDriftedResources.forEach((drift, index) => {
    const isLast = index === allDriftedResources.length - 1;
    details += formatDriftedResource(drift, isLast);
  });

  return details;
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Auth':
      return chalk.magenta('[AUTH]');
    case 'Storage':
      return chalk.blue('[STORAGE]');
    case 'Function':
      return chalk.yellow('[FUNCTION]');
    case 'Api':
      return chalk.green('[API]');
    case 'Hosting':
      return chalk.cyan('[HOSTING]');
    case 'Analytics':
      return chalk.red('[ANALYTICS]');
    case 'Core Infrastructure':
      return chalk.gray('[CORE]');
    default:
      return chalk.white('[OTHER]');
  }
}

function groupStacksByCategory(data: ProcessedDriftData): Map<string, Array<{ name: string } & ResourceCounts>> {
  const categories = new Map<string, Array<{ name: string } & ResourceCounts>>();

  // Add root stack as "Core Infrastructure"
  const rootCounts = data.root.counts;
  categories.set('Core Infrastructure', [
    {
      name: 'Root Stack',
      ...rootCounts,
    },
  ]);

  // Add nested stacks
  data.nestedStacks.forEach((stack) => {
    const categoryName = extractCategory(stack.category || stack.logicalId);
    const counts = stack.counts;

    if (!categories.has(categoryName)) {
      categories.set(categoryName, []);
    }
    categories.get(categoryName)!.push({
      name: stack.logicalId,
      ...counts,
    });
  });

  return categories;
}

export function createCategoryBreakdown(data: ProcessedDriftData): string {
  let breakdown = chalk.bold('\nAMPLIFY CATEGORIES:\n');

  // Group stacks by category with cached counts
  const categories = groupStacksByCategory(data);

  // Display categories
  const categoryEntries = Array.from(categories.entries());
  categoryEntries.forEach(([categoryName, stacks], categoryIndex) => {
    const isLastCategory = categoryIndex === categoryEntries.length - 1;
    const categoryPrefix = isLastCategory ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;

    const categoryIcon = getCategoryIcon(categoryName);
    const totalDrifted = stacks.reduce((sum, stack) => sum + stack.drifted, 0);
    const statusText =
      totalDrifted > 0
        ? chalk.red(`DRIFT DETECTED: ${totalDrifted} resource${totalDrifted === 1 ? '' : 's'}`)
        : chalk.green('NO DRIFT DETECTED');

    breakdown += `${categoryPrefix} ${categoryIcon} ${chalk.bold(categoryName)}\n`;

    const stackPrefix = isLastCategory ? TREE_SYMBOLS.EMPTY : TREE_SYMBOLS.VERTICAL;
    breakdown += `${stackPrefix}└── Status: ${statusText}\n`;
  });

  return breakdown;
}

// Phase 2/3 formatting functions

function getActionStyle(action: string): { color: (s: string) => string; symbol: string } {
  if (action === 'Add') return { color: chalk.green, symbol: '+' };
  if (action === 'Remove') return { color: chalk.red, symbol: '-' };
  return { color: chalk.yellow, symbol: '~' };
}

function formatNestedChanges(nestedChanges: ChangeSetChange[], prefix: string): string {
  let output = '';

  nestedChanges.forEach((change: ChangeSetChange, index: number) => {
    const isLast = index === nestedChanges.length - 1;
    const changePrefix = isLast ? '└──' : '├──';
    const action = change.action || 'Unknown';
    const resourceId = change.logicalResourceId || 'Unknown';
    const resourceType = change.resourceType || 'Unknown';
    const { color: actionColor, symbol: actionSymbol } = getActionStyle(action);

    output += `\n${prefix}${changePrefix} ${actionColor(`${actionSymbol} ${action}`)}: ${chalk.bold(resourceId)} (${chalk.gray(
      resourceType,
    )})`;

    // Show details if available
    if (change.details && change.details.length > 0) {
      const detailPrefix = isLast ? '    ' : '│   ';
      change.details.forEach((detail: ChangeSetDetail) => {
        if (detail.name) {
          output += `\n${prefix}${detailPrefix}└── Property: ${detail.name}`;
          if (detail.changeSource) {
            output += chalk.gray(` (${detail.changeSource})`);
          }
        }
      });
    }

    // Recursively show even deeper nested changes
    if (change.nestedChanges && change.nestedChanges.length > 0) {
      const childPrefix = isLast ? '    ' : '│   ';
      output += formatNestedChanges(change.nestedChanges, prefix + childPrefix);
    }
  });

  return output;
}

export function formatPhase2Results(phase2Results: TemplateDriftResults | null): string | null {
  if (!phase2Results) return null;

  if (phase2Results.skipped) {
    return null;
  }

  const changes = phase2Results.changes || [];

  if (changes.length === 0) {
    return '\nTEMPLATE CHANGES:\n└── Status: NO DRIFT DETECTED';
  }

  let output = '\nTEMPLATE CHANGES:';

  if (changes.length > 0) {
    output += '\n├── Status: ' + chalk.yellow('DRIFT DETECTED');
    changes.forEach((change: ChangeSetChange, index: number) => {
      const isLast = index === changes.length - 1;
      const prefix = isLast ? '└──' : '├──';
      const action = change.action || 'Unknown';
      const resourceId = change.logicalResourceId || 'Unknown';
      const resourceType = change.resourceType || 'Unknown';
      const { color: actionColor, symbol: actionSymbol } = getActionStyle(action);

      output += `\n${prefix} ${actionColor(`${actionSymbol} ${action}`)}: ${chalk.bold(resourceId)} (${chalk.gray(resourceType)})`;

      if (change.replacement) {
        output += chalk.red(' [REQUIRES REPLACEMENT]');
      }

      // Add property details if available
      if (change.details && change.details.length > 0) {
        const detailPrefix = isLast ? '    ' : '│   ';

        // Check if this is a nested stack with automatic changes
        const isNestedStack = resourceType === 'AWS::CloudFormation::Stack';
        const hasOnlyAutomaticChanges = change.details.every((d: ChangeSetDetail) => d.changeSource === 'Automatic' && !d.name);

        if (isNestedStack && hasOnlyAutomaticChanges) {
          // Check for nested changes to provide more detail
          if (change.nestedChanges && change.nestedChanges.length > 0) {
            output += `\n${detailPrefix}└── ${chalk.cyan('Nested stack changes detected:')}`;

            // Format nested changes
            change.nestedChanges.forEach((nestedChange: ChangeSetChange, nestedIndex: number) => {
              const isLastNested = nestedIndex === change.nestedChanges!.length - 1;
              const nestedPrefix = isLastNested ? '    └──' : '    ├──';
              const nestedAction = nestedChange.action || 'Unknown';
              const nestedResourceId = nestedChange.logicalResourceId || 'Unknown';
              const nestedResourceType = nestedChange.resourceType || 'Unknown';
              const { color: nestedActionColor, symbol: nestedActionSymbol } = getActionStyle(nestedAction);

              output += `\n${detailPrefix}${nestedPrefix} ${nestedActionColor(`${nestedActionSymbol} ${nestedAction}`)}: ${chalk.bold(
                nestedResourceId,
              )} (${chalk.gray(nestedResourceType)})`;

              // Show nested resource details if available
              if (nestedChange.details && nestedChange.details.length > 0) {
                const nestedDetailPrefix = isLastNested ? '            ' : '    │       ';
                nestedChange.details.forEach((detail: ChangeSetDetail) => {
                  if (detail.name) {
                    output += `\n${detailPrefix}${nestedDetailPrefix}└── Property: ${detail.name}`;
                  }
                });
              }

              // Recursively show deeper nested changes if they exist
              if (nestedChange.nestedChanges && nestedChange.nestedChanges.length > 0) {
                output += formatNestedChanges(nestedChange.nestedChanges, detailPrefix + '        ');
              }
            });
          } else {
            output += `\n${detailPrefix}└── ${chalk.cyan('Template changed in nested stack')}`;
            output += `\n${detailPrefix}    ${chalk.gray('(The nested stack template or its resources have been modified)')}`;
          }
        } else {
          // Regular property changes
          const propDetails = change.details.filter((d: ChangeSetDetail) => d.name);
          if (propDetails.length > 0) {
            propDetails.forEach((detail: ChangeSetDetail, detailIndex: number) => {
              const isLastDetail = detailIndex === propDetails.length - 1;
              const detailSymbol = isLastDetail ? '└──' : '├──';

              output += `\n${detailPrefix}${detailSymbol} ${chalk.bold('Property')}: ${detail.name}`;

              if (detail.requiresRecreation) {
                const recreationPrefix = isLastDetail ? '        ' : '│       ';
                const recreationType =
                  detail.requiresRecreation === 'Always'
                    ? chalk.red('Always requires replacement')
                    : detail.requiresRecreation === 'Never'
                    ? chalk.green('No replacement needed')
                    : chalk.yellow('May require replacement');
                output += `\n${detailPrefix}${recreationPrefix}└── Impact: ${recreationType}`;
              }
            });
          } else if (change.details.length > 0) {
            output += `\n${detailPrefix}└── ${chalk.gray('Template or configuration change detected')}`;
          }
        }
      }
    });
  } else {
    output += '\n└── Status: NO DRIFT DETECTED';
  }

  return output;
}

function groupPhase3ResourcesByCategory(phase3Results: LocalDriftResults): Map<string, ResourceInfo[]> {
  const categories = new Map<string, ResourceInfo[]>();

  if (!phase3Results || phase3Results.skipped) return categories;

  const allResources = [
    ...(phase3Results.resourcesToBeCreated || []),
    ...(phase3Results.resourcesToBeUpdated || []),
    ...(phase3Results.resourcesToBeDeleted || []),
  ];

  allResources.forEach((resource) => {
    const categoryName = extractCategory(resource.category || resource.service || 'Other');

    if (!categories.has(categoryName)) {
      categories.set(categoryName, []);
    }
    categories.get(categoryName)!.push(resource);
  });

  return categories;
}

function getAllCategoriesForPhase3(
  driftedCategories: Map<string, ResourceInfo[]>,
  nestedStacks: StackDriftData[],
): Map<string, ResourceInfo[]> {
  const allCategories = new Map<string, ResourceInfo[]>();

  // Add all nested stack categories from Phase 1 (CFN drift)
  nestedStacks.forEach((stack) => {
    const categoryName = extractCategory(stack.category || stack.logicalId);
    if (!allCategories.has(categoryName)) {
      allCategories.set(categoryName, driftedCategories.get(categoryName) || []);
    }
  });

  // Add any additional categories from Phase 3 that weren't in Phase 1
  driftedCategories.forEach((resources, categoryName) => {
    if (!allCategories.has(categoryName)) {
      allCategories.set(categoryName, resources);
    }
  });

  return allCategories;
}

export function formatPhase3Results(data: ProcessedDriftData): string {
  const phase3Results = data.phase3Results;
  if (!phase3Results) {
    return '';
  }

  let output = '';

  // Add phase header matching Phase 1 style
  output += chalk.bold('\nLOCAL CHANGES:\n');

  // Handle skipped case
  if (phase3Results.skipped) {
    output += `└── Status: ${chalk.gray(phase3Results.skipReason)}\n`;
    return output;
  }

  // Check if there are any local changes
  if (phase3Results.totalDrifted === 0) {
    output += `└── Status: ${chalk.green('NO DRIFT DETECTED')}\n`;
    return output;
  }

  // Group resources by category for structured display (including no-drift categories)
  const categoryGroups = groupPhase3ResourcesByCategory(phase3Results);
  const allCategories = getAllCategoriesForPhase3(categoryGroups, data.nestedStacks);
  const categoryEntries = Array.from(allCategories.entries());

  categoryEntries.forEach(([categoryName, resources], categoryIndex) => {
    const isLastCategory = categoryIndex === categoryEntries.length - 1;
    const categoryPrefix = isLastCategory ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;

    const categoryIcon = getCategoryIcon(categoryName);

    const statusText =
      resources.length > 0
        ? chalk.red(`DRIFT DETECTED: ${resources.length} resource${resources.length === 1 ? '' : 's'}`)
        : chalk.green('NO DRIFT DETECTED');

    output += `${categoryPrefix} ${categoryIcon} ${chalk.bold(categoryName)}\n`;

    const stackPrefix = isLastCategory ? TREE_SYMBOLS.EMPTY : TREE_SYMBOLS.VERTICAL;
    output += `${stackPrefix}└── Status: ${statusText}\n`;
  });

  return output;
}

export function formatDriftResults(data: ProcessedDriftData, format: DriftDisplayFormat = 'tree'): FormattedDriftOutput {
  const summaryDashboard = createSummaryDashboard(data);

  let treeView: string | undefined;
  let detailedChanges: string | undefined;
  let categoryBreakdown: string | undefined;

  switch (format) {
    case 'tree':
      treeView = createTreeView(data);
      detailedChanges = createDetailedChanges(data);
      categoryBreakdown = createCategoryBreakdown(data);
      break;
    case 'summary':
      categoryBreakdown = createCategoryBreakdown(data);
      break;
    case 'json':
      // JSON format handled separately
      break;
  }

  const phase2Output = formatPhase2Results(data.phase2Results) || undefined;
  const phase3Output = formatPhase3Results(data) || undefined;

  return {
    summaryDashboard,
    treeView,
    detailedChanges,
    categoryBreakdown,
    phase2Output,
    phase3Output,
    totalDrifted: data.summary.totalDrifted,
  };
}
