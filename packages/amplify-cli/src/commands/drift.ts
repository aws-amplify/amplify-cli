/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, stateManager, pathManager, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { CloudFormationClient, GetTemplateCommand } from '@aws-sdk/client-cloudformation';
import { detectStackDrift, DriftFormatter, type CloudFormationTemplate } from './drift-detection';

export const name = 'drift';
export const alias = [];

/**
 * Command options
 */
interface DriftOptions {
  verbose?: boolean;
  fail?: boolean;
  format?: 'table' | 'json';
  'output-file'?: string;
}

/**
 * Executes the drift detection command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const options: DriftOptions = {
    verbose: context.parameters?.options?.verbose || false,
    fail: context.parameters?.options?.fail || false,
    format: context.parameters?.options?.format || 'table',
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
 * Based on CDK's toolkit drift method
 */
export class AmplifyDriftDetector {
  constructor(private readonly context: $TSContext) {}

  /**
   * Detect drift for the current Amplify project
   * Following CDK's drift orchestration pattern
   */
  public async detect(options: DriftOptions = {}): Promise<number> {
    // 1. Validate Amplify project
    this.validateAmplifyProject();

    // 2. Get stack name from team-provider-info
    const stackName = this.getRootStackName();
    printer.info(`Checking drift for stack: ${stackName}`);

    // 3. Get CloudFormation client
    const cfn = await this.getCloudFormationClient();

    // 4. Validate stack exists
    if (!(await this.validateStackExists(cfn, stackName))) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${stackName} does not exist.`,
        resolution: 'Has the project been deployed? Run "amplify push" to deploy your project.',
      });
    }

    // 5. Detect drift (following CDK pattern)
    const print = {
      info: (msg: string) => printer.info(msg),
      debug: (msg: string) => (options.verbose ? printer.info(msg) : undefined),
      warning: (msg: string) => printer.warn(msg),
    };

    const driftResults = await detectStackDrift(cfn, stackName, print);

    // 6. Handle no results (CDK pattern)
    if (!driftResults.StackResourceDrifts) {
      printer.warn(`${stackName}: No drift results available`);
      return 0;
    }

    // 7. Get stack template for formatting
    const template = await this.getStackTemplate(cfn, stackName);

    // 8. Format and display results (CDK pattern)
    const formatter = new DriftFormatter({
      stackName,
      template,
      resourceDrifts: driftResults.StackResourceDrifts,
    });

    const driftOutput = formatter.formatStackDrift();

    // 9. Display output (CDK pattern)
    printer.info(driftOutput.stackHeader);

    if (driftOutput.unchanged && options.verbose) {
      printer.info(driftOutput.unchanged);
    }
    if (driftOutput.unchecked && options.verbose) {
      printer.info(driftOutput.unchecked);
    }
    if (driftOutput.modified) {
      printer.info(driftOutput.modified);
    }
    if (driftOutput.deleted) {
      printer.info(driftOutput.deleted);
    }

    printer.info(driftOutput.summary);

    // 10. Save JSON if requested (enhancement over CDK)
    if (options['output-file']) {
      await this.saveJsonOutput(options['output-file'], {
        stackName,
        numResourcesWithDrift: driftOutput.numResourcesWithDrift,
        numResourcesUnchecked: driftOutput.numResourcesUnchecked,
        timestamp: new Date().toISOString(),
      });
    }

    // 11. Return exit code (CDK pattern)
    const hasDrift = driftOutput.numResourcesWithDrift > 0;
    return hasDrift && options.fail ? 1 : 0;
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
  private async getCloudFormationClient(): Promise<CloudFormationClient> {
    // Use the provider package's loadConfiguration function
    // This is the same pattern used by the CloudFormation class in aws-cfn.js
    const { loadConfiguration } = require('@aws-amplify/amplify-provider-awscloudformation');
    const credentials = await loadConfiguration(this.context);

    return new CloudFormationClient({
      ...credentials,
      maxAttempts: 10,
    });
  }

  /**
   * Validate that stack exists in CloudFormation
   */
  private async validateStackExists(cfn: CloudFormationClient, stackName: string): Promise<boolean> {
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
  private async getStackTemplate(cfn: CloudFormationClient, stackName: string): Promise<CloudFormationTemplate> {
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
}
