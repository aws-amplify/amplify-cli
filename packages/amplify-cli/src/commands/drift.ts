/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import {
  detectStackDriftRecursive,
  ConsolidatedDriftFormatter,
  type ConsolidatedDriftResults,
  type DriftDisplayFormat,
} from './drift-detection';
import { CloudFormationService, AmplifyConfigService, DriftResultProcessor, FileService } from './drift-detection/services';
import type { CloudFormationClient } from '@aws-sdk/client-cloudformation';

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
 * Amplify drift detector - Orchestrator class
 * Coordinates services to perform drift detection
 */
export class AmplifyDriftDetector {
  private readonly cfnService: CloudFormationService;
  private readonly configService: AmplifyConfigService;
  private readonly resultProcessor: DriftResultProcessor;
  private readonly fileService: FileService;

  constructor(private readonly context: $TSContext) {
    // Initialize services
    this.cfnService = new CloudFormationService();
    this.configService = new AmplifyConfigService();
    this.fileService = new FileService();
    this.resultProcessor = new DriftResultProcessor(this.cfnService, this.configService);
  }

  /**
   * Detect drift for the current Amplify project
   * Orchestrates the drift detection process using services
   */
  public async detect(options: DriftOptions = {}): Promise<number> {
    // 1. Validate Amplify project
    this.configService.validateAmplifyProject();

    // 2. Get stack name and project info
    const stackName = this.configService.getRootStackName();
    const projectName = this.configService.extractProjectName(stackName);

    // Display initial status
    printer.info('');
    printer.info(chalk.cyan.bold(`Started Drift Detection for Project: ${projectName}`));

    // 3. Get CloudFormation client
    const cfn = await this.cfnService.getClient(this.context);

    // 4. Validate stack exists
    if (!(await this.cfnService.validateStackExists(cfn, stackName))) {
      printer.error(chalk.red('Stack not found'));
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${stackName} does not exist.`,
        resolution: 'Has the project been deployed? Run "amplify push" to deploy your project.',
      });
    }

    // Start drift detection
    printer.info(chalk.gray(`Checking drift for root stack: ${chalk.yellow(stackName)}`));

    // 5. Detect drift recursively (including nested stacks)
    const print = this.createPrintObject(options);
    const combinedResults = await detectStackDriftRecursive(cfn, stackName, print);

    printer.info(chalk.green('Drift detection completed'));
    printer.info('');

    // 6. Handle no results
    if (!combinedResults.rootStackDrifts.StackResourceDrifts) {
      printer.warn(`${stackName}: No drift results available`);
      return 0;
    }

    // 7. Build consolidated results structure
    const rootTemplate = await this.cfnService.getStackTemplate(cfn, stackName);
    const consolidatedResults = await this.resultProcessor.buildConsolidatedResults(cfn, stackName, rootTemplate, combinedResults);

    // 8. Display results
    this.displayResults(consolidatedResults, options);

    // 9. Save JSON if requested
    if (options['output-file']) {
      const simplifiedJson = this.resultProcessor.createSimplifiedJsonOutput(consolidatedResults);
      await this.fileService.saveJsonOutput(options['output-file'], simplifiedJson);
    }

    // 10. Return exit code - always return 1 if drift detected, 0 if no drift
    const hasDrift = consolidatedResults.summary.totalDrifted > 0;
    return hasDrift ? 1 : 0;
  }

  /**
   * Create print object for drift detection output
   */
  private createPrintObject(options: DriftOptions) {
    return {
      info: (msg: string) => {
        // Parse and format messages based on their content
        if (msg.includes('Found') && msg.includes('nested')) {
          // Extract indentation, count, and type
          const indent = msg.match(/^(\s*)/)?.[1] || '';
          const count = msg.match(/Found (\d+)/)?.[1] || '0';
          const level = msg.match(/level (\d+)/)?.[1];

          // Always show "Found X nested stack(s)" without indentation
          printer.info(chalk.gray(`Found ${chalk.yellow(count)} nested stack(s)`));
        } else if (msg.includes('Checking drift for nested stack:')) {
          // Show nested stack checking without indentation
          const nestedStackName = msg.replace('Checking drift for nested stack:', '').trim();
          printer.info(chalk.gray(`Checking drift for nested stack: ${chalk.yellow(nestedStackName)}`));
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
  }

  /**
   * Display results based on format option
   */
  private displayResults(consolidatedResults: ConsolidatedDriftResults, options: DriftOptions): void {
    const consolidatedFormatter = new ConsolidatedDriftFormatter(consolidatedResults);

    if (options.format === 'json') {
      const simplifiedJson = this.resultProcessor.createSimplifiedJsonOutput(consolidatedResults);
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
  }
}
