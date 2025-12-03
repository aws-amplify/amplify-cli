/**
 * Drift formatter for output display
 * Processes and formats drift detection results for CloudFormation stacks
 */

import type { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import type { StackResourceDrift } from '@aws-sdk/client-cloudformation';
import { StackResourceDriftStatus } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import type { CombinedDriftResults } from '../detect-stack-drift';
import { CloudFormationService } from './cloudformation-service';
import { AmplifyConfigService } from './amplify-config-service';
import type { Phase3Results } from '../detect-local-drift';

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
 * Output format options
 */
export type DriftDisplayFormat = 'tree' | 'summary' | 'json';

/**
 * Resource count structure
 */
interface ResourceCounts {
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
  stackName: string;
  category: string;
}

/**
 * Simplified JSON output structure
 */
interface SimplifiedJsonOutput {
  stackName: string;
  numResourcesWithDrift: number;
  numResourcesUnchecked: number;
  timestamp: string;
}

/**
 * Stack hierarchy node structure
 */
interface StackHierarchyNode {
  stack: {
    logicalId: string;
    physicalName: string;
    category: string;
    drifts: StackResourceDrift[];
    template: CloudFormationTemplate;
  } | null;
  children: Map<string, StackHierarchyNode>;
}

// Display constants
const DISPLAY_CONSTANTS = {
  BORDER_WIDTH: 61,
  TITLE_PADDING: 19,
  LABEL_PROJECT: 10,
  LABEL_STACKS_CHECKED: 23,
  LABEL_RESOURCES_DRIFT: 23,
  LABEL_RESOURCES_SYNC: 20,
  LABEL_UNCHECKED: 22,
  LABEL_FAILED: 22,
} as const;

// Tree display constants
const TREE_SYMBOLS = {
  BRANCH: '├──',
  LAST_BRANCH: '└──',
  VERTICAL: '│   ',
  EMPTY: '    ',
} as const;

/**
 * Drift formatter that processes and formats drift detection results
 */
export class DriftFormatter {
  private readonly configService: AmplifyConfigService;
  private readonly cfnService: CloudFormationService;

  // Data stored after processing
  private rootStackName = '';
  private rootTemplate: CloudFormationTemplate = {};
  private rootDrifts: StackResourceDrift[] = [];
  private nestedStacks: Array<{
    logicalId: string;
    physicalName: string;
    category: string;
    drifts: StackResourceDrift[];
    template: CloudFormationTemplate;
  }> = [];
  private summary = {
    totalStacks: 0,
    totalDrifted: 0,
    totalInSync: 0,
    totalUnchecked: 0,
    totalFailed: 0,
  };

  // Phase 2 and Phase 3 results storage
  private phase2Results: any = null;
  private phase3Results: Phase3Results | null = null;

  constructor(cfnService: CloudFormationService) {
    this.configService = new AmplifyConfigService();
    this.cfnService = cfnService;
  }

  /**
   * Process raw drift results and prepare for formatting
   */
  public async processResults(
    cfn: CloudFormationClient,
    stackName: string,
    rootTemplate: CloudFormationTemplate,
    combinedResults: CombinedDriftResults,
  ): Promise<void> {
    this.rootStackName = stackName;
    this.rootTemplate = rootTemplate;
    this.rootDrifts = combinedResults.rootStackDrifts.StackResourceDrifts || [];

    // Reset counters
    this.summary = {
      totalStacks: 1,
      totalDrifted: 0,
      totalInSync: 0,
      totalUnchecked: 0,
      totalFailed: 0,
    };

    // Count root stack resources for summary
    this.summary.totalDrifted += this.countDrifted(this.rootDrifts);
    this.summary.totalInSync += this.countInSync(this.rootDrifts);
    this.summary.totalUnchecked += this.countUnchecked(this.rootDrifts, this.rootTemplate);
    this.summary.totalFailed += this.countFailed(this.rootDrifts);

    // Process nested stacks
    this.nestedStacks = [];
    for (const [logicalId, nestedDrift] of combinedResults.nestedStackDrifts.entries()) {
      if (!nestedDrift.StackResourceDrifts) {
        continue;
      }

      const physicalName = combinedResults.nestedStackPhysicalIds.get(logicalId) || logicalId;
      const nestedTemplate = await this.cfnService.getStackTemplate(cfn, physicalName);
      const nestedDrifts = nestedDrift.StackResourceDrifts;

      // Count nested stack resources for summary
      this.summary.totalDrifted += this.countDrifted(nestedDrifts);
      this.summary.totalInSync += this.countInSync(nestedDrifts);
      this.summary.totalUnchecked += this.countUnchecked(nestedDrifts, nestedTemplate);
      this.summary.totalFailed += this.countFailed(nestedDrifts);
      this.summary.totalStacks++;

      this.nestedStacks.push({
        logicalId,
        physicalName,
        category: this.configService.extractCategory(logicalId),
        drifts: nestedDrifts,
        template: nestedTemplate,
      });
    }
  }

  /**
   * Format drift results based on the specified display format
   */
  public formatDrift(format: DriftDisplayFormat = 'tree'): {
    summaryDashboard: string;
    treeView?: string;
    detailedChanges?: string;
    categoryBreakdown?: string;
    totalDrifted: number;
  } {
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
      totalDrifted: this.summary.totalDrifted,
    };
  }

  /**
   * Create simplified JSON output
   */
  public createSimplifiedJsonOutput(): SimplifiedJsonOutput {
    return {
      stackName: this.rootStackName,
      numResourcesWithDrift: this.summary.totalDrifted,
      numResourcesUnchecked: this.summary.totalUnchecked,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a summary dashboard with overall statistics
   */
  private createSummaryDashboard(): string {
    const projectName = this.configService.getProjectName();

    const border = '─'.repeat(DISPLAY_CONSTANTS.BORDER_WIDTH);
    let dashboard = '';

    dashboard += chalk.cyan(`┌${border}┐\n`);
    dashboard += chalk.cyan(
      `│${' '.repeat(DISPLAY_CONSTANTS.TITLE_PADDING)}DRIFT DETECTION SUMMARY${' '.repeat(DISPLAY_CONSTANTS.TITLE_PADDING)}│\n`,
    );
    dashboard += chalk.cyan(`├${border}┤\n`);

    // Project name
    dashboard += this.formatDashboardLine('Project', chalk.bold(projectName), DISPLAY_CONSTANTS.LABEL_PROJECT);

    // Total stacks
    dashboard += this.formatDashboardLine(
      'Total Stacks Checked',
      chalk.bold(this.summary.totalStacks),
      DISPLAY_CONSTANTS.LABEL_STACKS_CHECKED,
    );

    // Resources with drift
    const driftedColor = this.summary.totalDrifted > 0 ? chalk.red : chalk.green;
    dashboard += this.formatDashboardLine(
      'Resources with Drift',
      driftedColor(this.summary.totalDrifted),
      DISPLAY_CONSTANTS.LABEL_RESOURCES_DRIFT,
    );

    // Resources in sync
    dashboard += this.formatDashboardLine(
      'Resources in Sync',
      chalk.green(this.summary.totalInSync),
      DISPLAY_CONSTANTS.LABEL_RESOURCES_SYNC,
    );

    // Unchecked resources
    dashboard += this.formatDashboardLine(
      'Unchecked Resources',
      chalk.gray(this.summary.totalUnchecked),
      DISPLAY_CONSTANTS.LABEL_UNCHECKED,
    );

    // Failed checks (if any)
    if (this.summary.totalFailed > 0) {
      dashboard += this.formatDashboardLine('Failed Drift Checks', chalk.yellow(this.summary.totalFailed), DISPLAY_CONSTANTS.LABEL_FAILED);
    }

    dashboard += chalk.cyan(`└${border}┘`);

    // Warning message for failed checks
    if (this.summary.totalFailed > 0) {
      dashboard +=
        '\n' +
        chalk.yellow(
          `WARNING: Drift detection failed for ${this.summary.totalFailed} resource(s).\n` +
            `This may be due to insufficient permissions or AWS API issues.\n` +
            `Run with --debug to see which resources failed.`,
        );
    }

    return dashboard;
  }

  /**
   * Format a line for the dashboard display
   */
  private formatDashboardLine(label: string, value: any, labelWidth: number): string {
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

  /**
   * Create a tree view showing stack hierarchy and resource status
   */
  private createTreeView(): string {
    let tree = '';

    tree += chalk.bold('\nSTACK HIERARCHY:\n');

    // Root stack with counts
    tree += `${chalk.blue(this.rootStackName)} ${chalk.gray('(ROOT)')}\n`;

    // Calculate and cache root counts for this view
    const rootCounts = this.getResourceCounts(this.rootDrifts, this.rootTemplate);
    tree += this.formatResourceCountsAsTree(rootCounts, '');

    // Build and render nested stack hierarchy
    const stackHierarchy = this.buildStackHierarchy();
    tree = this.renderStackHierarchy(stackHierarchy, tree, '');

    return tree;
  }

  /**
   * Get resource counts for a stack
   */
  private getResourceCounts(drifts: StackResourceDrift[], template: CloudFormationTemplate): ResourceCounts {
    return {
      drifted: this.countDrifted(drifts),
      inSync: this.countInSync(drifts),
      unchecked: this.countUnchecked(drifts, template),
      failed: this.countFailed(drifts),
    };
  }

  /**
   * Format resource counts as tree branches
   */
  private formatResourceCountsAsTree(counts: ResourceCounts, prefix: string): string {
    let result = '';
    const items: Array<{ label: string; count: number; color: (text: any) => string }> = [];

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

  /**
   * Build a hierarchical structure from the flat nested stacks list
   */
  private buildStackHierarchy(): Map<string, StackHierarchyNode> {
    const hierarchy = new Map<string, StackHierarchyNode>();

    this.nestedStacks.forEach((nestedStack) => {
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

  /**
   * Render the stack hierarchy recursively
   */
  private renderStackHierarchy(hierarchy: Map<string, StackHierarchyNode>, tree: string, prefix: string): string {
    const entries = Array.from(hierarchy.entries());

    entries.forEach(([name, node], index) => {
      const isLastItem = index === entries.length - 1;
      const nodePrefix = isLastItem ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;
      const childPrefix = isLastItem ? TREE_SYMBOLS.EMPTY : TREE_SYMBOLS.VERTICAL;

      if (node.stack) {
        // Calculate counts for this nested stack
        const counts = this.getResourceCounts(node.stack.drifts, node.stack.template);
        const categoryName = this.determineCategory(node.stack.category || node.stack.logicalId);

        const displayName = name.includes('/') ? name.split('/').pop() : name;

        tree += `${prefix}${nodePrefix} ${chalk.blue(displayName)} ${chalk.gray(`(${categoryName})`)}\n`;

        // Format resource counts for this stack
        const resourcePrefix = prefix + childPrefix;
        tree += this.formatResourceCountsAsTree(counts, resourcePrefix);

        // Render children if any
        if (node.children && node.children.size > 0) {
          tree = this.renderStackHierarchy(node.children, tree, prefix + childPrefix);
        }
      }
    });

    return tree;
  }

  /**
   * Create detailed changes section showing specific property modifications
   */
  private createDetailedChanges(): string {
    const allDriftedResources = this.getAllDriftedResources();

    if (allDriftedResources.length === 0) {
      return '';
    }

    let details = chalk.bold('\nDETAILED CHANGES:\n');

    allDriftedResources.forEach((drift, index) => {
      const isLast = index === allDriftedResources.length - 1;
      details += this.formatDriftedResource(drift, isLast);
    });

    return details;
  }

  /**
   * Get all drifted resources with context
   */
  private getAllDriftedResources(): ExtendedDriftResource[] {
    const rootDrifted = this.getDriftedResources(this.rootDrifts).map(
      (drift): ExtendedDriftResource => ({
        ...drift,
        stackContext: 'ROOT',
        stackName: this.rootStackName,
        category: 'Core Infrastructure',
      }),
    );

    const nestedDrifted = this.nestedStacks.flatMap((stack) =>
      this.getDriftedResources(stack.drifts).map(
        (drift): ExtendedDriftResource => ({
          ...drift,
          stackContext: stack.logicalId,
          stackName: stack.physicalName,
          category: this.determineCategory(stack.category || stack.logicalId),
        }),
      ),
    );

    return [...rootDrifted, ...nestedDrifted];
  }

  /**
   * Format a single drifted resource
   */
  private formatDriftedResource(drift: ExtendedDriftResource, isLast: boolean): string {
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
      result += this.formatPropertyDifferences(drift.PropertyDifferences, detailPrefix);
    }

    return result;
  }

  /**
   * Format property differences
   */
  private formatPropertyDifferences(differences: any[], prefix: string): string {
    let result = '';

    differences.forEach((propDiff, propIndex) => {
      const isLastProp = propIndex === differences.length - 1;
      const propPrefix = isLastProp ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;

      result += `${prefix}${propPrefix} ${chalk.yellow('PROPERTY:')} ${propDiff.PropertyPath}\n`;

      const valuePrefix = isLastProp ? TREE_SYMBOLS.EMPTY : TREE_SYMBOLS.VERTICAL;
      // ActualValue (current/remote state) is shown first with + (green)
      result += `${prefix}${valuePrefix}├── ${chalk.green('[+]')} ${chalk.green(propDiff.ActualValue)}\n`;
      // ExpectedValue (template/local state) is  shown second with - (red)
      result += `${prefix}${valuePrefix}└── ${chalk.red('[-]')} ${chalk.red(propDiff.ExpectedValue)}\n`;
    });

    return result;
  }

  /**
   * Create category breakdown showing Amplify-specific grouping
   */
  private createCategoryBreakdown(): string {
    let breakdown = chalk.bold('\nAMPLIFY CATEGORIES:\n');

    // Group stacks by category with cached counts
    const categories = this.groupStacksByCategory();

    // Display categories
    const categoryEntries = Array.from(categories.entries());
    categoryEntries.forEach(([categoryName, stacks], categoryIndex) => {
      const isLastCategory = categoryIndex === categoryEntries.length - 1;
      const categoryPrefix = isLastCategory ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;

      const categoryIcon = this.getCategoryIcon(categoryName);
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

  /**
   * Group stacks by category with their resource counts
   */
  private groupStacksByCategory(): Map<string, Array<{ name: string } & ResourceCounts>> {
    const categories = new Map<string, Array<{ name: string } & ResourceCounts>>();

    // Add root stack as "Core Infrastructure"
    const rootCounts = this.getResourceCounts(this.rootDrifts, this.rootTemplate);
    categories.set('Core Infrastructure', [
      {
        name: 'Root Stack',
        ...rootCounts,
      },
    ]);

    // Add nested stacks
    this.nestedStacks.forEach((stack) => {
      const categoryName = this.determineCategory(stack.category || stack.logicalId);
      const counts = this.getResourceCounts(stack.drifts, stack.template);

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

  /**
   * Count drifted resources (MODIFIED or DELETED)
   */
  private countDrifted(drifts: StackResourceDrift[]): number {
    return drifts.filter(
      (d) =>
        d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED,
    ).length;
  }

  /**
   * Count resources in sync
   */
  private countInSync(drifts: StackResourceDrift[]): number {
    return drifts.filter((d) => d.StackResourceDriftStatus === StackResourceDriftStatus.IN_SYNC).length;
  }

  /**
   * Count unchecked resources (NOT_CHECKED or not in results)
   */
  private countUnchecked(drifts: StackResourceDrift[], template: CloudFormationTemplate): number {
    const checkedResourceIds = new Set(drifts.map((d) => d.LogicalResourceId));
    const allResourceIds = Object.keys(template.Resources || {});
    const notInResults = allResourceIds.filter((id) => !checkedResourceIds.has(id)).length;
    const notChecked = drifts.filter((d) => d.StackResourceDriftStatus === StackResourceDriftStatus.NOT_CHECKED).length;
    return notInResults + notChecked;
  }

  /**
   * Count failed drift checks (UNKNOWN status)
   */
  private countFailed(drifts: StackResourceDrift[]): number {
    return drifts.filter((d) => d.StackResourceDriftStatus === StackResourceDriftStatus.UNKNOWN).length;
  }

  /**
   * Get only drifted resources (MODIFIED or DELETED)
   */
  private getDriftedResources(drifts: StackResourceDrift[]): StackResourceDrift[] {
    return drifts.filter(
      (d) =>
        d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED,
    );
  }

  /**
   * Determine Amplify category from identifier
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
   * Get icon for Amplify category
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
   * Add Phase 2 results for formatting
   */
  public addPhase2Results(results: any): void {
    this.phase2Results = results;
  }

  /**
   * Add Phase 3 results for formatting
   */
  public addPhase3Results(results: Phase3Results): void {
    this.phase3Results = results;
  }

  /**
   * Recursively format nested changes at any depth level
   */
  private formatNestedChanges(nestedChanges: any[], prefix: string, level: number): string {
    let output = '';

    nestedChanges.forEach((change: any, index: number) => {
      const isLast = index === nestedChanges.length - 1;
      const changePrefix = isLast ? '└──' : '├──';
      const action = change.action || 'Unknown';
      const resourceId = change.logicalResourceId || 'Unknown';
      const resourceType = change.resourceType || 'Unknown';

      let actionColor = chalk.yellow;
      let actionSymbol = '~';
      if (action === 'Add') {
        actionColor = chalk.green;
        actionSymbol = '+';
      } else if (action === 'Remove') {
        actionColor = chalk.red;
        actionSymbol = '-';
      } else if (action === 'Modify') {
        actionColor = chalk.yellow;
        actionSymbol = '~';
      }

      output += `\n${prefix}${changePrefix} ${actionColor(`${actionSymbol} ${action}`)}: ${chalk.bold(resourceId)} (${chalk.gray(
        resourceType,
      )})`;

      // Show details if available
      if (change.details && change.details.length > 0) {
        const detailPrefix = isLast ? '    ' : '│   ';
        change.details.forEach((detail: any) => {
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
        output += this.formatNestedChanges(change.nestedChanges, prefix + childPrefix, level + 1);
      }
    });

    return output;
  }

  /**
   * Format Phase 2 template drift results with nested changeset details
   */
  public formatPhase2Results(): string | null {
    if (!this.phase2Results) return null;

    if (this.phase2Results.skipped || this.phase2Results.error) {
      return null;
    }

    const changes = this.phase2Results.changes || [];

    if (changes.length === 0) {
      return '\nTEMPLATE CHANGES:\n└── Status: NO DRIFT DETECTED';
    }

    let output = '\nTEMPLATE CHANGES:';

    if (changes.length > 0) {
      output += '\n├── Status: ' + chalk.yellow('DRIFT DETECTED');
      changes.forEach((change: any, index: number) => {
        const isLast = index === changes.length - 1;
        const prefix = isLast ? '└──' : '├──';
        const action = change.action || 'Unknown';
        const resourceId = change.logicalResourceId || 'Unknown';
        const resourceType = change.resourceType || 'Unknown';

        let actionColor = chalk.yellow;
        let actionSymbol = '~';
        if (action === 'Add') {
          actionColor = chalk.green;
          actionSymbol = '+';
        } else if (action === 'Remove') {
          actionColor = chalk.red;
          actionSymbol = '-';
        } else if (action === 'Modify') {
          actionColor = chalk.yellow;
          actionSymbol = '~';
        }

        output += `\n${prefix} ${actionColor(`${actionSymbol} ${action}`)}: ${chalk.bold(resourceId)} (${chalk.gray(resourceType)})`;

        if (change.replacement) {
          output += chalk.red(' [REQUIRES REPLACEMENT]');
        }

        // Add property details if available
        if (change.details && change.details.length > 0) {
          const detailPrefix = isLast ? '    ' : '│   ';

          // Check if this is a nested stack with automatic changes
          const isNestedStack = resourceType === 'AWS::CloudFormation::Stack';
          const hasOnlyAutomaticChanges = change.details.every((d: any) => d.changeSource === 'Automatic' && !d.name);

          if (isNestedStack && hasOnlyAutomaticChanges) {
            // Check for nested changes to provide more detail
            if (change.nestedChanges && change.nestedChanges.length > 0) {
              output += `\n${detailPrefix}└── ${chalk.cyan('Nested stack changes detected:')}`;

              // Format nested changes
              change.nestedChanges.forEach((nestedChange: any, nestedIndex: number) => {
                const isLastNested = nestedIndex === change.nestedChanges.length - 1;
                const nestedPrefix = isLastNested ? '    └──' : '    ├──';
                const nestedAction = nestedChange.action || 'Unknown';
                const nestedResourceId = nestedChange.logicalResourceId || 'Unknown';
                const nestedResourceType = nestedChange.resourceType || 'Unknown';

                let nestedActionColor = chalk.yellow;
                let nestedActionSymbol = '~';
                if (nestedAction === 'Add') {
                  nestedActionColor = chalk.green;
                  nestedActionSymbol = '+';
                } else if (nestedAction === 'Remove') {
                  nestedActionColor = chalk.red;
                  nestedActionSymbol = '-';
                } else if (nestedAction === 'Modify') {
                  nestedActionColor = chalk.yellow;
                  nestedActionSymbol = '~';
                }

                output += `\n${detailPrefix}${nestedPrefix} ${nestedActionColor(`${nestedActionSymbol} ${nestedAction}`)}: ${chalk.bold(
                  nestedResourceId,
                )} (${chalk.gray(nestedResourceType)})`;

                // Show nested resource details if available
                if (nestedChange.details && nestedChange.details.length > 0) {
                  const nestedDetailPrefix = isLastNested ? '            ' : '    │       ';
                  nestedChange.details.forEach((detail: any) => {
                    if (detail.name) {
                      output += `\n${detailPrefix}${nestedDetailPrefix}└── Property: ${detail.name}`;
                    }
                  });
                }

                // Recursively show deeper nested changes if they exist
                if (nestedChange.nestedChanges && nestedChange.nestedChanges.length > 0) {
                  // Recursively format deeper nested changes (3rd level and beyond)
                  output += this.formatNestedChanges(nestedChange.nestedChanges, detailPrefix + '        ', 3);
                }
              });
            } else {
              // No nested changeset details available, show generic message
              output += `\n${detailPrefix}└── ${chalk.cyan('Template changed in nested stack')}`;
              output += `\n${detailPrefix}    ${chalk.gray('(The nested stack template or its resources have been modified)')}`;
            }
          } else {
            // Regular property changes
            const propDetails = change.details.filter((d: any) => d.name);
            if (propDetails.length > 0) {
              propDetails.forEach((detail: any, detailIndex: number) => {
                const isLastDetail = detailIndex === propDetails.length - 1;
                const detailSymbol = isLastDetail ? '└──' : '├──';

                let changeType = 'Modified';
                let changeColor = chalk.yellow;
                if (detail.changeSource === 'DirectModification') {
                  changeType = 'Direct Change';
                  changeColor = chalk.cyan;
                } else if (detail.changeSource === 'Automatic') {
                  changeType = 'Automatic';
                  changeColor = chalk.gray;
                }

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
              // Has details but no specific property names
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

  /**
   * Format Phase 3 drift results (local vs cloud backend)
   */
  public formatPhase3Results(): string {
    if (!this.phase3Results) {
      return '';
    }

    let output = '';

    // Add phase header matching Phase 1 style
    output += chalk.bold('\nLOCAL CHANGES:\n');

    // Handle skipped case
    if (this.phase3Results.skipped) {
      output += `└── Status: ${chalk.gray(this.phase3Results.skipReason)}\n`;
      return output;
    }

    // Group resources by category for structured display (including no-drift categories)
    const categoryGroups = this.groupPhase3ResourcesByCategory();
    const allCategories = this.getAllCategoriesForPhase3(categoryGroups);
    const categoryEntries = Array.from(allCategories.entries());

    categoryEntries.forEach(([categoryName, resources], categoryIndex) => {
      const isLastCategory = categoryIndex === categoryEntries.length - 1;
      const categoryPrefix = isLastCategory ? TREE_SYMBOLS.LAST_BRANCH : TREE_SYMBOLS.BRANCH;

      const categoryIcon = this.getCategoryIcon(categoryName);

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

  /**
   * Group Phase 3 resources by category
   */
  private groupPhase3ResourcesByCategory(): Map<string, any[]> {
    const categories = new Map<string, any[]>();

    if (!this.phase3Results || this.phase3Results.skipped) return categories;

    const allResources = [
      ...(this.phase3Results.resourcesToBeCreated || []),
      ...(this.phase3Results.resourcesToBeUpdated || []),
      ...(this.phase3Results.resourcesToBeDeleted || []),
    ];

    allResources.forEach((resource) => {
      const categoryName = this.determineCategory(resource.category || resource.service || 'Other');

      if (!categories.has(categoryName)) {
        categories.set(categoryName, []);
      }
      categories.get(categoryName)!.push(resource);
    });

    return categories;
  }

  /**
   * Get all categories for Phase 3, including those with no drift (matching CFN style)
   */
  private getAllCategoriesForPhase3(driftedCategories: Map<string, any[]>): Map<string, any[]> {
    const allCategories = new Map<string, any[]>();

    // Add all nested stack categories from Phase 1 (CFN drift)
    this.nestedStacks.forEach((stack) => {
      const categoryName = this.determineCategory(stack.category || stack.logicalId);
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

  /**
   * Get total drift count including Phase 3 if available
   */
  public getTotalDriftCount(): number {
    let total = this.summary.totalDrifted;

    if (this.phase3Results && !this.phase3Results.skipped && this.phase3Results.totalDrifted) {
      total += this.phase3Results.totalDrifted;
    }

    return total;
  }
}
