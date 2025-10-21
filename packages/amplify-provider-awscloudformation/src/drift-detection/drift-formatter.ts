/**
 * Drift detection output formatter
 * Based on AWS CDK CLI implementation: aws-cdk-cli/packages/@aws-cdk/toolkit-lib/lib/api/drift/drift-formatter.ts
 */

import { format } from 'util';
import type { StackResourceDrift } from '@aws-sdk/client-cloudformation';
import { StackResourceDriftStatus } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';

/**
 * Props for the Drift Formatter
 */
export interface DriftFormatterProps {
  /**
   * The stack name
   */
  readonly stackName: string;

  /**
   * The CloudFormation template for the stack
   */
  readonly template: CloudFormationTemplate;

  /**
   * The results of stack drift detection
   */
  readonly resourceDrifts: StackResourceDrift[];
}

/**
 * CloudFormation template structure
 */
export interface CloudFormationTemplate {
  Resources?: {
    [logicalId: string]: {
      Type: string;
      Properties?: any;
      [key: string]: any;
    };
  };
  [key: string]: any;
}

/**
 * Output from drift formatter
 */
export interface DriftFormatterOutput {
  /**
   * Number of resources with drift
   */
  readonly numResourcesWithDrift: number;

  /**
   * How many resources were not checked for drift
   */
  readonly numResourcesUnchecked: number;

  /**
   * Resources that have not changed
   */
  readonly unchanged?: string;

  /**
   * Resources that were not checked for drift or have an UNKNOWN drift status
   */
  readonly unchecked?: string;

  /**
   * Resources with drift
   */
  readonly modified?: string;

  /**
   * Resources that have been deleted (drift)
   */
  readonly deleted?: string;

  /**
   * The header, containing the stack name
   */
  readonly stackHeader: string;

  /**
   * The final results (summary) of the drift results
   */
  readonly summary: string;
}

/**
 * Formatted drift sections
 */
interface FormattedDrift {
  unchanged?: string;
  unchecked?: string;
  modified?: string;
  deleted?: string;
}

/**
 * Simple difference representation for property changes
 */
class PropertyDifference {
  constructor(public readonly oldValue: string, public readonly newValue: string) {}

  get isAddition(): boolean {
    return this.oldValue === undefined || this.oldValue === null;
  }

  get isRemoval(): boolean {
    return this.newValue === undefined || this.newValue === null;
  }

  get isUpdate(): boolean {
    return !this.isAddition && !this.isRemoval;
  }
}

/**
 * Class for formatting drift detection output
 * Based on CDK's DriftFormatter
 */
export class DriftFormatter {
  public readonly stackName: string;

  private readonly template: CloudFormationTemplate;
  private readonly resourceDriftResults: StackResourceDrift[];
  private readonly allStackResources: Map<string, string>;

  constructor(props: DriftFormatterProps) {
    this.stackName = props.stackName;
    this.template = props.template;
    this.resourceDriftResults = props.resourceDrifts;

    // Build map of all resources in the template
    this.allStackResources = new Map<string, string>();
    Object.keys(this.template.Resources || {}).forEach((id) => {
      const resource = this.template.Resources![id];
      // Ignore CDK metadata resources (Amplify doesn't have these, but keeping pattern)
      if (resource.Type === 'AWS::CDK::Metadata') {
        return;
      }
      this.allStackResources.set(id, resource.Type);
    });
  }

  /**
   * Format the stack drift detection results
   * Following CDK's formatStackDrift pattern
   */
  public formatStackDrift(): DriftFormatterOutput {
    const formatterOutput = this.formatStackDriftChanges();

    // We are only interested in actual drifts (CDK pattern)
    const actualDrifts = this.resourceDriftResults.filter(
      (d) =>
        (d.StackResourceDriftStatus === 'MODIFIED' || d.StackResourceDriftStatus === 'DELETED') && d.ResourceType !== 'AWS::CDK::Metadata',
    );

    // Stack header (CDK pattern)
    const stackHeader = format(`Stack ${chalk.bold(this.stackName)}\n`);

    if (actualDrifts.length === 0) {
      const finalResult = chalk.green('No drift detected\n');
      return {
        numResourcesWithDrift: 0,
        numResourcesUnchecked: this.allStackResources.size - this.resourceDriftResults.length,
        stackHeader,
        unchecked: formatterOutput.unchecked,
        summary: finalResult,
      };
    }

    const finalResult = chalk.yellow(
      `\n${actualDrifts.length} resource${actualDrifts.length === 1 ? '' : 's'} ${
        actualDrifts.length === 1 ? 'has' : 'have'
      } drifted from their expected configuration\n`,
    );
    return {
      numResourcesWithDrift: actualDrifts.length,
      numResourcesUnchecked: this.allStackResources.size - this.resourceDriftResults.length,
      stackHeader,
      unchanged: formatterOutput.unchanged,
      unchecked: formatterOutput.unchecked,
      modified: formatterOutput.modified,
      deleted: formatterOutput.deleted,
      summary: finalResult,
    };
  }

  /**
   * Renders stack drift information
   * Following CDK's formatStackDriftChanges pattern
   */
  private formatStackDriftChanges(): FormattedDrift {
    if (this.resourceDriftResults.length === 0) {
      return {};
    }

    let unchanged: string | undefined;
    let unchecked: string | undefined;
    let modified: string | undefined;
    let deleted: string | undefined;

    const drifts = this.resourceDriftResults;

    // Process unchanged resources (CDK pattern)
    const unchangedResources = drifts.filter((d) => d.StackResourceDriftStatus === StackResourceDriftStatus.IN_SYNC);
    if (unchangedResources.length > 0) {
      unchanged = this.printSectionHeader('Resources In Sync');

      for (const drift of unchangedResources) {
        if (!drift.LogicalResourceId || !drift.ResourceType) continue;
        unchanged += `${CONTEXT} ${chalk.cyan(drift.ResourceType)} ${this.formatLogicalId(drift.LogicalResourceId)}\n`;
      }
      unchanged += this.printSectionFooter();
    }

    // Process all unchecked and unknown resources (CDK pattern)
    const uncheckedResources = Array.from(this.allStackResources.keys()).filter((logicalId) => {
      const drift = drifts.find((d) => d.LogicalResourceId === logicalId);
      return !drift || drift.StackResourceDriftStatus === StackResourceDriftStatus.NOT_CHECKED;
    });
    if (uncheckedResources.length > 0) {
      unchecked = this.printSectionHeader('Unchecked Resources');
      for (const logicalId of uncheckedResources) {
        const resourceType = this.allStackResources.get(logicalId);
        unchecked += `${CONTEXT} ${chalk.cyan(resourceType)} ${this.formatLogicalId(logicalId)}\n`;
      }
      unchecked += this.printSectionFooter();
    }

    // Process modified resources (CDK pattern)
    const modifiedResources = drifts.filter(
      (d) => d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED && d.ResourceType !== 'AWS::CDK::Metadata',
    );
    if (modifiedResources.length > 0) {
      modified = this.printSectionHeader('Modified Resources');

      for (const drift of modifiedResources) {
        if (!drift.LogicalResourceId || !drift.ResourceType) continue;
        modified += `${UPDATE} ${chalk.cyan(drift.ResourceType)} ${this.formatLogicalId(drift.LogicalResourceId)}\n`;
        if (drift.PropertyDifferences) {
          const propDiffs = drift.PropertyDifferences;
          for (let i = 0; i < propDiffs.length; i++) {
            const diff = propDiffs[i];
            if (!diff.PropertyPath) continue;
            const difference = new PropertyDifference(diff.ExpectedValue as string, diff.ActualValue as string);
            modified += this.formatTreeDiff(diff.PropertyPath, difference, i === propDiffs.length - 1);
          }
        }
      }
      modified += this.printSectionFooter();
    }

    // Process deleted resources (CDK pattern)
    const deletedResources = drifts.filter(
      (d) => d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED && d.ResourceType !== 'AWS::CDK::Metadata',
    );
    if (deletedResources.length > 0) {
      deleted = this.printSectionHeader('Deleted Resources');
      for (const drift of deletedResources) {
        if (!drift.LogicalResourceId || !drift.ResourceType) continue;
        deleted += `${REMOVAL} ${chalk.cyan(drift.ResourceType)} ${this.formatLogicalId(drift.LogicalResourceId)}\n`;
      }
      deleted += this.printSectionFooter();
    }

    return { unchanged, unchecked, modified, deleted };
  }

  /**
   * Format a logical ID for display
   * Simplified version of CDK's formatLogicalId (Amplify doesn't have construct paths)
   */
  private formatLogicalId(logicalId: string): string {
    // For Amplify, we just show the logical ID
    // In the future, we could parse Amplify category/resource info from the logical ID
    return chalk.gray(logicalId);
  }

  /**
   * Print section header (CDK pattern)
   */
  private printSectionHeader(title: string): string {
    return `${chalk.underline(chalk.bold(title))}\n`;
  }

  /**
   * Print section footer (CDK pattern)
   */
  private printSectionFooter(): string {
    return '\n';
  }

  /**
   * Format property differences in tree structure (CDK pattern)
   */
  private formatTreeDiff(propertyPath: string, difference: PropertyDifference, isLast: boolean): string {
    let result = format(
      ' %s─ %s %s\n',
      isLast ? '└' : '├',
      difference.isAddition ? ADDITION : difference.isRemoval ? REMOVAL : UPDATE,
      propertyPath,
    );
    if (difference.isUpdate) {
      result += format('     ├─ %s %s\n', REMOVAL, chalk.red(difference.oldValue));
      result += format('     └─ %s %s\n', ADDITION, chalk.green(difference.newValue));
    }
    return result;
  }
}

// Color-coded symbols (CDK pattern)
const ADDITION = chalk.green('[+]');
const CONTEXT = chalk.grey('[ ]');
const UPDATE = chalk.yellow('[~]');
const REMOVAL = chalk.red('[-]');
