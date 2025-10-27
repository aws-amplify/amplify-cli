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
    dashboard += chalk.cyan(`└${border}┘`);

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

  private getCategoryIcon(category: string): string {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('auth')) return chalk.magenta('[AUTH]');
    if (categoryLower.includes('storage')) return chalk.blue('[STORAGE]');
    if (categoryLower.includes('function')) return chalk.yellow('[FUNCTION]');
    if (categoryLower.includes('api')) return chalk.green('[API]');
    if (categoryLower.includes('hosting')) return chalk.cyan('[HOSTING]');
    if (categoryLower.includes('analytics')) return chalk.red('[ANALYTICS]');
    if (categoryLower.includes('core') || categoryLower.includes('infrastructure')) return chalk.gray('[CORE]');
    return chalk.white('[OTHER]');
  }

  private getCategoryName(logicalId: string): string {
    const idLower = logicalId.toLowerCase();
    if (idLower.includes('auth')) return 'Auth';
    if (idLower.includes('storage')) return 'Storage';
    if (idLower.includes('function')) return 'Function';
    if (idLower.includes('api')) return 'API';
    if (idLower.includes('hosting')) return 'Hosting';
    if (idLower.includes('analytics')) return 'Analytics';
    return 'Other';
  }

  private countDriftedResources(drifts: StackResourceDrift[]): number {
    return drifts.filter(
      (d) =>
        d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED,
    ).length;
  }

  private countInSyncResources(drifts: StackResourceDrift[]): number {
    return drifts.filter((d) => d.StackResourceDriftStatus === StackResourceDriftStatus.IN_SYNC).length;
  }

  private countUncheckedResources(drifts: StackResourceDrift[], template: CloudFormationTemplate): number {
    const checkedResourceIds = new Set(drifts.map((d) => d.LogicalResourceId));
    const allResourceIds = Object.keys(template.Resources || {});
    return allResourceIds.filter((id) => !checkedResourceIds.has(id)).length;
  }

  private getDriftedResources(drifts: StackResourceDrift[]): StackResourceDrift[] {
    return drifts.filter(
      (d) =>
        d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED,
    );
  }
}
