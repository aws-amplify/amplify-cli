/**
 * Drift formatter for output display
 * Formats drift detection results for various output formats
 */

import type { StackResourceDrift } from '@aws-sdk/client-cloudformation';
import { StackResourceDriftStatus } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import { ResourceCounter } from './resource-counter';

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
 * Drift results for all stacks
 */
export interface DriftResults {
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
 * Drift formatter output
 */
export interface DriftOutput {
  summaryDashboard: string;
  treeView?: string;
  detailedChanges?: string;
  categoryBreakdown?: string;
  totalDrifted: number;
}

/**
 * Drift formatter that provides unified output for all stacks
 */
export class DriftFormatter {
  constructor(private readonly results: DriftResults) {}

  /**
   * Format drift results based on the specified display format
   */
  public formatDrift(format: DriftDisplayFormat = 'tree'): DriftOutput {
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

    // Build a hierarchical structure from the flat nested stacks list
    const stackHierarchy = this.buildStackHierarchy();

    // Render the hierarchy
    tree = this.renderStackHierarchy(stackHierarchy, tree, '', false);

    return tree;
  }

  /**
   * Build a hierarchical structure from the flat nested stacks list
   */
  private buildStackHierarchy(): Map<string, any> {
    const hierarchy = new Map<string, any>();

    this.results.nestedStacks.forEach((nestedStack) => {
      const parts = nestedStack.logicalId.split('/');

      if (parts.length === 1) {
        // Top-level nested stack
        if (!hierarchy.has(parts[0])) {
          hierarchy.set(parts[0], {
            stack: nestedStack,
            children: new Map<string, any>(),
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
            children: new Map<string, any>(),
          });
        }

        hierarchy.get(topLevel).children.set(childName, {
          stack: nestedStack,
          children: new Map<string, any>(),
        });
      }
    });

    return hierarchy;
  }

  /**
   * Render the stack hierarchy recursively
   */
  private renderStackHierarchy(hierarchy: Map<string, any>, tree: string, prefix: string, isLast: boolean): string {
    let index = 0;
    const entries = Array.from(hierarchy.entries());

    entries.forEach(([name, node]) => {
      const isLastItem = index === entries.length - 1;
      const nodePrefix = isLastItem ? '└──' : '├──';
      const childPrefix = isLastItem ? '    ' : '│   ';

      if (node.stack) {
        const nestedDrifted = this.countDriftedResources(node.stack.drifts);
        const nestedInSync = this.countInSyncResources(node.stack.drifts);
        const nestedUnchecked = this.countUncheckedResources(node.stack.drifts, node.stack.template);
        const categoryName = this.getCategoryName(node.stack.category || node.stack.logicalId);

        // Display the stack name (use the last part if it's a nested path)
        const displayName = name.includes('/') ? name.split('/').pop() : name;

        tree += `${prefix}${nodePrefix} ${chalk.blue(displayName)} ${chalk.gray(`(${categoryName})`)}\n`;

        // Add resource counts
        const resourcePrefix = prefix + childPrefix;
        let hasMoreResources = false;

        if (nestedDrifted > 0) {
          tree += `${resourcePrefix}├── ${chalk.red('DRIFTED:')} ${nestedDrifted} resource${nestedDrifted === 1 ? '' : 's'}\n`;
          hasMoreResources = true;
        }
        if (nestedInSync > 0) {
          const resourceNodePrefix = hasMoreResources || nestedUnchecked > 0 ? '├──' : '└──';
          tree += `${resourcePrefix}${resourceNodePrefix} ${chalk.green('IN SYNC:')} ${nestedInSync} resource${
            nestedInSync === 1 ? '' : 's'
          }\n`;
          hasMoreResources = true;
        }
        if (nestedUnchecked > 0) {
          tree += `${resourcePrefix}└── ${chalk.gray('UNCHECKED:')} ${nestedUnchecked} resource${nestedUnchecked === 1 ? '' : 's'}\n`;
        }

        // Render children if any
        if (node.children && node.children.size > 0) {
          tree = this.renderStackHierarchy(node.children, tree, prefix + childPrefix, isLastItem);
        }
      }

      index++;
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
   * Count drifted resources (MODIFIED or DELETED)
   */
  private countDriftedResources(drifts: StackResourceDrift[]): number {
    return ResourceCounter.countDriftedResources(drifts);
  }

  /**
   * Count resources in sync
   */
  private countInSyncResources(drifts: StackResourceDrift[]): number {
    return ResourceCounter.countInSyncResources(drifts);
  }

  /**
   * Count unchecked resources (NOT_CHECKED status + resources not in drift results)
   */
  private countUncheckedResources(drifts: StackResourceDrift[], template: CloudFormationTemplate): number {
    return ResourceCounter.countUncheckedResources(drifts, template);
  }

  /**
   * Count failed resources (UNKNOWN status - drift check failed)
   */
  private countFailedResources(drifts: StackResourceDrift[]): number {
    return ResourceCounter.countFailedResources(drifts);
  }

  /**
   * Get drifted resources (MODIFIED or DELETED)
   */
  private getDriftedResources(drifts: StackResourceDrift[]): StackResourceDrift[] {
    return ResourceCounter.getDriftedResources(drifts);
  }
}
