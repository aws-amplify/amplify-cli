/**
 * Consolidated drift formatter for improved output display
 * Addresses the sequential output issue by collecting all results first
 */

import { format } from 'util';
import type { StackResourceDrift } from '@aws-sdk/client-cloudformation';
import { StackResourceDriftStatus } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';

// CloudFormation template type definition
export interface CloudFormationTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Transform?: any;
  Metadata?: Record<string, any>;
}

/**
 * Consolidated drift results for all stacks
 */
export interface ConsolidatedDriftResults {
  rootStack: {
    name: string;
    drifts: StackResourceDrift[];
    template: CloudFormationTemplate;
  };
  nestedStacks: Array<{
    logicalId: string;
    physicalName: string;
    category?: string;
    drifts: StackResourceDrift[];
    template: CloudFormationTemplate;
  }>;
  summary: {
    totalStacks: number;
    totalDrifted: number;
    totalInSync: number;
    totalUnchecked: number;
    totalFailed: number; // Resources with UNKNOWN status (drift check failed)
  };
}

/**
 * Output format options
 */
export type DriftDisplayFormat = 'tree' | 'summary' | 'json';

/**
 * Consolidated drift formatter output
 */
export interface ConsolidatedDriftOutput {
  summaryDashboard: string;
  treeView?: string;
  detailedChanges?: string;
  categoryBreakdown?: string;
  totalDrifted: number;
}

/**
 * Enhanced drift formatter that provides unified output for all stacks
 */
export class ConsolidatedDriftFormatter {
  constructor(private readonly results: ConsolidatedDriftResults) {}

  /**
   * Format drift results based on the specified display format
   */
  public formatDrift(format: DriftDisplayFormat = 'tree'): ConsolidatedDriftOutput {
    const summaryDashboard = this.createSummaryDashboard();

    let treeView: string | undefined;
    let detailedChanges: string | undefined;
    let categoryBreakdown: string | undefined;

    switch (format) {
      case 'tree':
        treeView = this.createTreeView();
        detailedChanges = this.createDetailedChanges();
        categoryBreakdown = this.createCategoryBreakdown();
        break;
      case 'summary':
        categoryBreakdown = this.createCategoryBreakdown();
        break;
      case 'json':
        // JSON format handled separately in CLI
        break;
    }

    return {
      summaryDashboard,
      treeView,
      detailedChanges,
      categoryBreakdown,
      totalDrifted: this.results.summary.totalDrifted,
    };
  }

  /**
   * Create a summary dashboard with overall statistics
   */
  private createSummaryDashboard(): string {
    const { summary, rootStack } = this.results;
    const projectName = this.extractProjectName(rootStack.name);

    const border = '─'.repeat(61);
    let dashboard = '';

    dashboard += chalk.cyan(`┌${border}┐\n`);
    dashboard += chalk.cyan(`│${' '.repeat(19)}DRIFT DETECTION SUMMARY${' '.repeat(19)}│\n`);
    dashboard += chalk.cyan(`├${border}┤\n`);
    dashboard += chalk.cyan(`│ Project: ${chalk.bold(projectName)}${' '.repeat(61 - 10 - projectName.length)}│\n`);
    dashboard += chalk.cyan(
      `│ Total Stacks Checked: ${chalk.bold(summary.totalStacks)}${' '.repeat(61 - 23 - summary.totalStacks.toString().length)}│\n`,
    );

    const driftedColor = summary.totalDrifted > 0 ? chalk.red : chalk.green;
    dashboard += chalk.cyan(
      `│ Resources with Drift: ${driftedColor(summary.totalDrifted)}${' '.repeat(61 - 23 - summary.totalDrifted.toString().length)}│\n`,
    );
    dashboard += chalk.cyan(
      `│ Resources in Sync: ${chalk.green(summary.totalInSync)}${' '.repeat(61 - 20 - summary.totalInSync.toString().length)}│\n`,
    );
    dashboard += chalk.cyan(
      `│ Unchecked Resources: ${chalk.gray(summary.totalUnchecked)}${' '.repeat(61 - 22 - summary.totalUnchecked.toString().length)}│\n`,
    );

    // Only show failed drift checks if there are any
    if (summary.totalFailed > 0) {
      dashboard += chalk.cyan(
        `│ Failed Drift Checks: ${chalk.yellow(summary.totalFailed)}${' '.repeat(61 - 22 - summary.totalFailed.toString().length)}│\n`,
      );
    }

    dashboard += chalk.cyan(`└${border}┘`);

    // Add warning message if there are failed checks
    if (summary.totalFailed > 0) {
      dashboard +=
        '\n' +
        chalk.yellow(
          `WARNING: Drift detection failed for ${summary.totalFailed} resource(s).\n` +
            `This may be due to insufficient permissions or AWS API issues.\n` +
            `Run with --verbose to see which resources failed.`,
        );
    }

    return dashboard;
  }

  /**
   * Create a tree view showing stack hierarchy and resource status
   */
  private createTreeView(): string {
    let tree = '';

    tree += chalk.bold('\nSTACK HIERARCHY:\n');

    // Root stack
    const rootDrifted = this.countDriftedResources(this.results.rootStack.drifts);
    const rootInSync = this.countInSyncResources(this.results.rootStack.drifts);
    const rootUnchecked = this.countUncheckedResources(this.results.rootStack.drifts, this.results.rootStack.template);

    tree += `${chalk.blue(this.results.rootStack.name)} ${chalk.gray('(ROOT)')}\n`;
    if (rootDrifted > 0) {
      tree += `├── ${chalk.red('DRIFTED:')} ${rootDrifted} resource${rootDrifted === 1 ? '' : 's'}\n`;
    }
    if (rootInSync > 0) {
      tree += `├── ${chalk.green('IN SYNC:')} ${rootInSync} resource${rootInSync === 1 ? '' : 's'}\n`;
    }
    if (rootUnchecked > 0) {
      tree += `├── ${chalk.gray('UNCHECKED:')} ${rootUnchecked} resource${rootUnchecked === 1 ? '' : 's'}\n`;
    }

    // Nested stacks
    this.results.nestedStacks.forEach((nestedStack, index) => {
      const isLast = index === this.results.nestedStacks.length - 1;
      const prefix = isLast ? '└──' : '├──';

      const nestedDrifted = this.countDriftedResources(nestedStack.drifts);
      const nestedInSync = this.countInSyncResources(nestedStack.drifts);
      const nestedUnchecked = this.countUncheckedResources(nestedStack.drifts, nestedStack.template);

      const categoryName = this.getCategoryName(nestedStack.category || nestedStack.logicalId);

      tree += `${prefix} ${chalk.blue(nestedStack.logicalId)} ${chalk.gray(`(${categoryName})`)}\n`;

      const nestedPrefix = isLast ? '    ' : '│   ';
      if (nestedDrifted > 0) {
        tree += `${nestedPrefix}├── ${chalk.red('DRIFTED:')} ${nestedDrifted} resource${nestedDrifted === 1 ? '' : 's'}\n`;
      }
      if (nestedInSync > 0) {
        tree += `${nestedPrefix}├── ${chalk.green('IN SYNC:')} ${nestedInSync} resource${nestedInSync === 1 ? '' : 's'}\n`;
      }
      if (nestedUnchecked > 0) {
        tree += `${nestedPrefix}└── ${chalk.gray('UNCHECKED:')} ${nestedUnchecked} resource${nestedUnchecked === 1 ? '' : 's'}\n`;
      }
    });

    return tree;
  }

  /**
   * Create detailed changes section showing specific property modifications with parent context
   */
  private createDetailedChanges(): string {
    let details = '';

    const allDriftedResources = [
      ...this.getDriftedResources(this.results.rootStack.drifts).map((drift) => ({
        ...drift,
        stackContext: 'ROOT',
        stackName: this.results.rootStack.name,
        category: 'Core Infrastructure',
      })),
      ...this.results.nestedStacks.flatMap((stack) =>
        this.getDriftedResources(stack.drifts).map((drift) => ({
          ...drift,
          stackContext: stack.logicalId,
          stackName: stack.physicalName,
          category: this.getCategoryName(stack.category || stack.logicalId),
        })),
      ),
    ];

    if (allDriftedResources.length === 0) {
      return '';
    }

    details += chalk.bold('\nDETAILED CHANGES:\n');

    allDriftedResources.forEach((drift, index) => {
      const isLast = index === allDriftedResources.length - 1;
      const prefix = isLast ? '└──' : '├──';

      const extendedDrift = drift as any;
      const parentContext =
        extendedDrift.stackContext === 'ROOT'
          ? chalk.gray(` → ${chalk.bold('Root Stack')}`)
          : chalk.gray(` → ${chalk.bold(extendedDrift.category)} → ${extendedDrift.stackContext}`);

      details += `${prefix} ${chalk.red('DRIFTED:')} ${chalk.cyan(drift.ResourceType)} ${chalk.bold(
        drift.LogicalResourceId,
      )}${parentContext}\n`;

      if (drift.PropertyDifferences && drift.PropertyDifferences.length > 0) {
        const detailPrefix = isLast ? '    ' : '│   ';
        drift.PropertyDifferences.forEach((propDiff, propIndex) => {
          const isLastProp = propIndex === drift.PropertyDifferences!.length - 1;
          const propPrefix = isLastProp ? '└──' : '├──';

          details += `${detailPrefix}${propPrefix} ${chalk.yellow('PROPERTY:')} ${propDiff.PropertyPath}\n`;

          const valuePrefix = isLastProp ? '    ' : '│   ';
          details += `${detailPrefix}${valuePrefix}├── ${chalk.red('[-]')} ${chalk.red(propDiff.ExpectedValue)}\n`;
          details += `${detailPrefix}${valuePrefix}└── ${chalk.green('[+]')} ${chalk.green(propDiff.ActualValue)}\n`;
        });
      }
    });

    return details;
  }

  /**
   * Create category breakdown showing Amplify-specific grouping
   */
  private createCategoryBreakdown(): string {
    let breakdown = '';

    breakdown += chalk.bold('\nAMPLIFY CATEGORIES:\n');

    // Group stacks by category
    const categories = new Map<
      string,
      Array<{
        name: string;
        drifted: number;
        inSync: number;
        unchecked: number;
        isRoot?: boolean;
      }>
    >();

    // Add root stack as "Core Infrastructure"
    const rootDrifted = this.countDriftedResources(this.results.rootStack.drifts);
    const rootInSync = this.countInSyncResources(this.results.rootStack.drifts);
    const rootUnchecked = this.countUncheckedResources(this.results.rootStack.drifts, this.results.rootStack.template);

    categories.set('Core Infrastructure', [
      {
        name: 'Root Stack',
        drifted: rootDrifted,
        inSync: rootInSync,
        unchecked: rootUnchecked,
        isRoot: true,
      },
    ]);

    // Add nested stacks
    this.results.nestedStacks.forEach((stack) => {
      const categoryName = this.getCategoryName(stack.category || stack.logicalId);
      const drifted = this.countDriftedResources(stack.drifts);
      const inSync = this.countInSyncResources(stack.drifts);
      const unchecked = this.countUncheckedResources(stack.drifts, stack.template);

      if (!categories.has(categoryName)) {
        categories.set(categoryName, []);
      }
      categories.get(categoryName)!.push({
        name: stack.logicalId,
        drifted,
        inSync,
        unchecked,
      });
    });

    // Display categories
    Array.from(categories.entries()).forEach(([categoryName, stacks], categoryIndex) => {
      const isLastCategory = categoryIndex === categories.size - 1;
      const categoryPrefix = isLastCategory ? '└──' : '├──';

      const categoryIcon = this.getCategoryIcon(categoryName);
      const totalDrifted = stacks.reduce((sum, stack) => sum + stack.drifted, 0);
      const statusText =
        totalDrifted > 0
          ? chalk.red(`DRIFT DETECTED: ${totalDrifted} resource${totalDrifted === 1 ? '' : 's'}`)
          : chalk.green('NO DRIFT DETECTED');

      breakdown += `${categoryPrefix} ${categoryIcon} ${chalk.bold(categoryName)}\n`;

      const stackPrefix = isLastCategory ? '    ' : '│   ';
      breakdown += `${stackPrefix}└── Status: ${statusText}\n`;
    });

    return breakdown;
  }

  /**
   * Helper methods
   */
  private extractProjectName(stackName: string): string {
    // Extract project name from stack name (e.g., "amplify-myproject-dev-123" -> "myproject")
    const match = stackName.match(/^amplify-([^-]+)-/);
    return match ? match[1] : stackName;
  }

  /**
   * Determine the category from a logical ID or category string
   */
  private determineCategory(identifier: string): string {
    const idLower = identifier.toLowerCase();
    if (idLower.includes('auth')) return 'Auth';
    if (idLower.includes('storage')) return 'Storage';
    if (idLower.includes('function')) return 'Function';
    if (idLower.includes('api')) return 'API';
    if (idLower.includes('hosting')) return 'Hosting';
    if (idLower.includes('analytics')) return 'Analytics';
    if (idLower.includes('core') || idLower.includes('infrastructure')) return 'Core Infrastructure';
    return 'Other';
  }

  /**
   * Get the icon for a category
   */
  private getCategoryIcon(category: string): string {
    switch (category) {
      case 'Auth':
        return chalk.magenta('[AUTH]');
      case 'Storage':
        return chalk.blue('[STORAGE]');
      case 'Function':
        return chalk.yellow('[FUNCTION]');
      case 'API':
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

  /**
   * Get the category name from a logical ID
   */
  private getCategoryName(logicalId: string): string {
    return this.determineCategory(logicalId);
  }

  /**
   * Generic method to count resources by status
   */
  private countResourcesByStatus(drifts: StackResourceDrift[], ...statuses: StackResourceDriftStatus[]): number {
    return drifts.filter((d) => statuses.includes(d.StackResourceDriftStatus!)).length;
  }

  /**
   * Count drifted resources (MODIFIED or DELETED)
   */
  private countDriftedResources(drifts: StackResourceDrift[]): number {
    return this.countResourcesByStatus(drifts, StackResourceDriftStatus.MODIFIED, StackResourceDriftStatus.DELETED);
  }

  /**
   * Count resources in sync
   */
  private countInSyncResources(drifts: StackResourceDrift[]): number {
    return this.countResourcesByStatus(drifts, StackResourceDriftStatus.IN_SYNC);
  }

  /**
   * Count unchecked resources (NOT_CHECKED status + resources not in drift results)
   */
  private countUncheckedResources(drifts: StackResourceDrift[], template: CloudFormationTemplate): number {
    // Count resources not in drift results
    const checkedResourceIds = new Set(drifts.map((d) => d.LogicalResourceId));
    const allResourceIds = Object.keys(template.Resources || {});
    const notInResults = allResourceIds.filter((id) => !checkedResourceIds.has(id)).length;

    // Count resources with NOT_CHECKED status
    const notChecked = this.countResourcesByStatus(drifts, StackResourceDriftStatus.NOT_CHECKED);

    return notInResults + notChecked;
  }

  /**
   * Count failed resources (UNKNOWN status - drift check failed)
   */
  private countFailedResources(drifts: StackResourceDrift[]): number {
    return this.countResourcesByStatus(drifts, StackResourceDriftStatus.UNKNOWN);
  }

  /**
   * Get drifted resources (MODIFIED or DELETED)
   */
  private getDriftedResources(drifts: StackResourceDrift[]): StackResourceDrift[] {
    return drifts.filter(
      (d) =>
        d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED,
    );
  }
}
