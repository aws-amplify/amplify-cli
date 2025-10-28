/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, stateManager, pathManager, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import {
  detectStackDriftRecursive,
  ConsolidatedDriftFormatter,
  type CloudFormationTemplate,
  type ConsolidatedDriftResults,
  type DriftDisplayFormat,
} from './drift-detection';
import type { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { GetTemplateCommand } from '@aws-sdk/client-cloudformation';

export const name = 'drift';
export const alias = [];

/**
 * Command options
 */
interface DriftOptions {
  verbose?: boolean;
  fail?: boolean;
  format?: 'tree' | 'summary' | 'json';
  'output-file'?: string;
}

/**
 * Executes the drift detection command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const options: DriftOptions = {
    verbose: context.parameters?.options?.verbose || false,
    fail: context.parameters?.options?.fail || false,
    format: context.parameters?.options?.format || 'summary',
    'output-file': context.parameters?.options?.['output-file'],
  };

  const detector = new AmplifyDriftDetector(context);
  const exitCode = await detector.detect(options);

  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
};

/**
 * Amplify drift detector
 */
export class AmplifyDriftDetector {
  constructor(private readonly context: $TSContext) {}

  /**
   * Detect drift for the current Amplify project
   * Simplified implementation using only consolidated formatting
   */
  public async detect(options: DriftOptions = {}): Promise<number> {
    // 1. Validate Amplify project
    this.validateAmplifyProject();

    // 2. Get stack name from team-provider-info
    const stackName = this.getRootStackName();
    const projectName = this.extractProjectName(stackName);

    // Display initial status
    printer.info('');
    printer.info(chalk.cyan.bold(`Started Drift Detection for Project: ${projectName}`));

    // 3. Get CloudFormation client
    const cfn = await this.getCloudFormationClient();

    // 4. Validate stack exists
    if (!(await this.validateStackExists(cfn, stackName))) {
      printer.error(chalk.red('Stack not found'));
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${stackName} does not exist.`,
        resolution: 'Has the project been deployed? Run "amplify push" to deploy your project.',
      });
    }

    // Start drift detection
    printer.info(chalk.gray(`Checking drift for root stack: ${chalk.yellow(stackName)}`));

    // 5. Detect drift recursively (including nested stacks)
    let currentStatus = '';
    const print = {
      info: (msg: string) => {
        // Filter out the old-style messages and show cleaner status
        if (msg.includes('Found') && msg.includes('nested stack')) {
          const count = msg.match(/Found (\d+) nested stack/)?.[1] || '0';
          currentStatus = `Analyzing stack structure... Found ${chalk.yellow(count)} nested stack(s)`;
          printer.info(chalk.gray(currentStatus));
        } else if (msg.includes('Checking drift for nested stack:')) {
          const nestedStackName = msg.replace('Checking drift for nested stack:', '').trim();
          currentStatus = `Checking drift for: ${chalk.yellow(nestedStackName)}`;
          printer.info(chalk.gray(currentStatus));
        } else if (!msg.includes('Checking drift for stack:')) {
          printer.info(msg);
        }
      },
      debug: (msg: string) => {
        if (options.verbose) printer.info(msg);
      },
      warning: (msg: string) => {
        printer.warn(msg);
      },
    };

    const combinedResults = await detectStackDriftRecursive(cfn, stackName, print);
    printer.info(chalk.green('Drift detection completed'));
    printer.info('');

    // 6. Handle no results
    if (!combinedResults.rootStackDrifts.StackResourceDrifts) {
      printer.warn(`${stackName}: No drift results available`);
      return 0;
    }

    // 7. Build consolidated results structure
    const rootTemplate = await this.getStackTemplate(cfn, stackName);
    const consolidatedResults = await this.buildConsolidatedResults(cfn, stackName, rootTemplate, combinedResults);

    // 8. Use consolidated formatter for all formats
    const consolidatedFormatter = new ConsolidatedDriftFormatter(consolidatedResults);

    // 9. Display results based on format
    if (options.format === 'json') {
      const simplifiedJson = this.createSimplifiedJsonOutput(consolidatedResults);
      printer.info(JSON.stringify(simplifiedJson, null, 2));
    } else if (options.format === 'summary') {
      const output = consolidatedFormatter.formatDrift('summary');
      printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        printer.info(output.categoryBreakdown);
      }
    } else if (options.format === 'tree') {
      const output = consolidatedFormatter.formatDrift('tree');
      printer.info(output.summaryDashboard);
      if (output.treeView) {
        printer.info(output.treeView);
      }
      if (output.detailedChanges) {
        printer.info(output.detailedChanges);
      }
      if (options.verbose && output.categoryBreakdown) {
        printer.info(output.categoryBreakdown);
      }
    } else {
      // This shouldn't happen with TypeScript, but handle gracefully
      printer.warn(`Unknown format: ${options.format}. Using summary format.`);
      const output = consolidatedFormatter.formatDrift('summary');
      printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        printer.info(output.categoryBreakdown);
      }
    }

    // 10. Save JSON if requested
    if (options['output-file']) {
      const simplifiedJson = this.createSimplifiedJsonOutput(consolidatedResults);
      await this.saveJsonOutput(options['output-file'], simplifiedJson);
    }

    // 11. Return exit code - always return 1 if drift detected, 0 if no drift
    const hasDrift = consolidatedResults.summary.totalDrifted > 0;
    return hasDrift ? 1 : 0;
  }

  /**
   * Build consolidated results structure for the new formatter
   */
  private async buildConsolidatedResults(
    cfn: any,
    stackName: string,
    rootTemplate: CloudFormationTemplate,
    combinedResults: any,
  ): Promise<ConsolidatedDriftResults> {
    const nestedStacks: Array<{
      logicalId: string;
      physicalName: string;
      category?: string;
      drifts: any[];
      template: CloudFormationTemplate;
    }> = [];
    let totalDrifted = 0;
    let totalInSync = 0;
    let totalUnchecked = 0;
    let totalFailed = 0;

    // Process root stack
    const rootDrifts = combinedResults.rootStackDrifts.StackResourceDrifts || [];
    const rootDrifted = this.countDriftedResources(rootDrifts);
    const rootInSync = this.countInSyncResources(rootDrifts);
    const rootUnchecked = this.countUncheckedResources(rootDrifts, rootTemplate);
    const rootFailed = this.countFailedResources(rootDrifts);

    totalDrifted += rootDrifted;
    totalInSync += rootInSync;
    totalUnchecked += rootUnchecked;
    totalFailed += rootFailed;

    // Process nested stacks
    for (const [logicalId, nestedDrift] of combinedResults.nestedStackDrifts.entries()) {
      if (!nestedDrift.StackResourceDrifts) {
        continue;
      }

      const physicalName = combinedResults.nestedStackPhysicalIds.get(logicalId) || logicalId;
      const nestedTemplate = await this.getStackTemplate(cfn, physicalName);

      const nestedDrifted = this.countDriftedResources(nestedDrift.StackResourceDrifts);
      const nestedInSync = this.countInSyncResources(nestedDrift.StackResourceDrifts);
      const nestedUnchecked = this.countUncheckedResources(nestedDrift.StackResourceDrifts, nestedTemplate);
      const nestedFailed = this.countFailedResources(nestedDrift.StackResourceDrifts);

      totalDrifted += nestedDrifted;
      totalInSync += nestedInSync;
      totalUnchecked += nestedUnchecked;
      totalFailed += nestedFailed;

      nestedStacks.push({
        logicalId,
        physicalName,
        category: this.extractCategory(logicalId),
        drifts: nestedDrift.StackResourceDrifts,
        template: nestedTemplate,
      });
    }

    return {
      rootStack: {
        name: stackName,
        drifts: rootDrifts,
        template: rootTemplate,
      },
      nestedStacks,
      summary: {
        totalStacks: 1 + nestedStacks.length,
        totalDrifted,
        totalInSync,
        totalUnchecked,
        totalFailed,
      },
    };
  }

  /**
   * Helper methods for counting resources
   */
  private countDriftedResources(drifts: any[]): number {
    return drifts.filter((d) => d.StackResourceDriftStatus === 'MODIFIED' || d.StackResourceDriftStatus === 'DELETED').length;
  }

  private countInSyncResources(drifts: any[]): number {
    return drifts.filter((d) => d.StackResourceDriftStatus === 'IN_SYNC').length;
  }

  private countUncheckedResources(drifts: any[], template: CloudFormationTemplate): number {
    // Count resources not in drift results
    const checkedResourceIds = new Set(drifts.map((d) => d.LogicalResourceId));
    const allResourceIds = Object.keys(template.Resources || {});
    const notInResults = allResourceIds.filter((id) => !checkedResourceIds.has(id)).length;

    // Count resources with NOT_CHECKED status
    const notChecked = drifts.filter((d) => d.StackResourceDriftStatus === 'NOT_CHECKED').length;

    return notInResults + notChecked;
  }

  private countFailedResources(drifts: any[]): number {
    // Count resources with UNKNOWN status (drift check failed)
    return drifts.filter((d) => d.StackResourceDriftStatus === 'UNKNOWN').length;
  }

  private extractCategory(logicalId: string): string {
    const idLower = logicalId.toLowerCase();
    if (idLower.includes('auth')) return 'auth';
    if (idLower.includes('storage')) return 'storage';
    if (idLower.includes('function')) return 'function';
    if (idLower.includes('api')) return 'api';
    if (idLower.includes('hosting')) return 'hosting';
    if (idLower.includes('analytics')) return 'analytics';
    return 'other';
  }

  /**
   * Create simplified JSON output structure
   */
  private createSimplifiedJsonOutput(consolidatedResults: ConsolidatedDriftResults): any {
    return {
      stackName: consolidatedResults.rootStack.name,
      numResourcesWithDrift: consolidatedResults.summary.totalDrifted,
      numResourcesUnchecked: consolidatedResults.summary.totalUnchecked,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate this is an Amplify project
   */
  private validateAmplifyProject(): void {
    try {
      const projectPath = pathManager.findProjectRoot();
      if (!projectPath) {
        throw new Error('Not an Amplify project');
      }
    } catch (error) {
      throw new AmplifyError('ProjectNotFoundError', {
        message: 'Not an Amplify project.',
        resolution: 'Run this command from an Amplify project directory.',
      });
    }
  }

  private getRootStackName(): string {
    const projectPath = pathManager.findProjectRoot();
    const meta = stateManager.getMeta(projectPath);

    const stackName = meta?.providers?.awscloudformation?.StackName;
    if (!stackName) {
      throw new AmplifyError('StackNotFoundError', {
        message: 'Stack information not found in amplify-meta.json.',
        resolution: 'Has the project been deployed? Run "amplify push" to deploy your project.',
      });
    }

    return stackName;
  }

  /**
   * Get CloudFormation client (SDK v3)
   * Following the pattern from other SDK v3 clients in Amplify
   */
  private async getCloudFormationClient(): Promise<any> {
    // Use the provider package's loadConfiguration function
    // This is the same pattern used by the CloudFormation class in aws-cfn.js
    const { loadConfiguration } = require('@aws-amplify/amplify-provider-awscloudformation');
    const credentials = await loadConfiguration(this.context);
    const { CloudFormationClient } = require('@aws-sdk/client-cloudformation');

    return new CloudFormationClient({
      ...credentials,
      maxAttempts: 10,
    });
  }

  /**
   * Validate that stack exists in CloudFormation
   */
  private async validateStackExists(cfn: any, stackName: string): Promise<boolean> {
    try {
      await cfn.send(
        new GetTemplateCommand({
          StackName: stackName,
          TemplateStage: 'Original',
        }),
      );
      return true;
    } catch (error: any) {
      if (error.name === 'ValidationError' || error.message?.includes('does not exist')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get stack template from CloudFormation
   */
  private async getStackTemplate(cfn: any, stackName: string): Promise<CloudFormationTemplate> {
    const response = await cfn.send(
      new GetTemplateCommand({
        StackName: stackName,
        TemplateStage: 'Original',
      }),
    );
    return JSON.parse(response.TemplateBody!);
  }

  /**
   * Save JSON output to file (enhancement over CDK)
   */
  private async saveJsonOutput(filePath: string, data: any): Promise<void> {
    const fs = require('fs-extra');
    await fs.writeJson(filePath, data, { spaces: 2 });
    printer.info(`Drift results saved to: ${filePath}`);
  }

  /**
   * Extract project name from stack name
   */
  private extractProjectName(stackName: string): string {
    // Extract project name from stack name (e.g., "amplify-myproject-dev-123" -> "myproject")
    const match = stackName.match(/^amplify-([^-]+)-/);
    return match ? match[1] : stackName;
  }
}
