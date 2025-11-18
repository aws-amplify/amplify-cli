/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import { detectStackDriftRecursive, type DriftDisplayFormat } from './drift-detection';
import { CloudFormationService, AmplifyConfigService, FileService, DriftFormatter } from './drift-detection/services';
import type { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { Print } from './drift-detection/detect-stack-drift';

export const name = 'drift';
export const alias = [];

/**
 * Command options
 */
interface DriftOptions {
  verbose?: boolean;
  format?: 'tree' | 'summary' | 'json';
  'output-file'?: string;
}

/**
 * Executes the drift detection command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const options: DriftOptions = {
    verbose: context.parameters?.options?.verbose || false,
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
  private readonly fileService: FileService;
  private readonly formatter: DriftFormatter;
  private readonly printer: Print;

  constructor(private readonly context: $TSContext, print?: Print) {
    // Initialize services
    this.cfnService = new CloudFormationService();
    this.configService = new AmplifyConfigService();
    this.fileService = new FileService();
    this.formatter = new DriftFormatter();
    this.printer = print ?? printer;
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
    this.printer.info('');
    this.printer.info(chalk.cyan.bold(`Started Drift Detection for Project: ${projectName}`));

    // 3. Get CloudFormation client
    const cfn = await this.cfnService.getClient(this.context);

    // 4. Validate stack exists
    if (!(await this.cfnService.validateStackExists(cfn, stackName))) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${stackName} does not exist.`,
        resolution: 'Has the project been deployed? Run "amplify push" to deploy your project.',
      });
    }

    // Start drift detection
    this.printer.info(chalk.gray(`Checking drift for root stack: ${chalk.yellow(stackName)}`));

    // 5. Detect drift recursively (including nested stacks)
    const print = this.createPrintObject(options);
    const combinedResults = await detectStackDriftRecursive(cfn, stackName, print);

    this.printer.info(chalk.green('Drift detection completed'));
    this.printer.info('');

    // 6. Handle no results
    if (!combinedResults.rootStackDrifts.StackResourceDrifts) {
      this.printer.warning(`${stackName}: No drift results available`);
      return 0;
    }

    // 7. Process results with the simplified formatter
    const rootTemplate = await this.cfnService.getStackTemplate(cfn, stackName);
    await this.formatter.processResults(cfn, stackName, rootTemplate, combinedResults);

    // 8. Display results
    this.displayResults(options);

    // 9. Save JSON if requested
    if (options['output-file']) {
      const simplifiedJson = this.formatter.createSimplifiedJsonOutput();
      await this.fileService.saveJsonOutput(options['output-file'], simplifiedJson);
    }

    // 10. Return exit code - always return 1 if drift detected, 0 if no drift
    const output = this.formatter.formatDrift('summary');
    const hasDrift = output.totalDrifted > 0;
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
          this.printer.info(chalk.gray(`Found ${chalk.yellow(count)} nested stack(s)`));
        } else if (msg.includes('Checking drift for nested stack:')) {
          // Show nested stack checking without indentation
          const nestedStackName = msg.replace('Checking drift for nested stack:', '').trim();
          this.printer.info(chalk.gray(`Checking drift for nested stack: ${chalk.yellow(nestedStackName)}`));
        } else if (!msg.includes('Checking drift for stack:')) {
          this.printer.info(msg);
        }
      },
      debug: (msg: string) => {
        if (options.verbose) this.printer.info(msg);
      },
      warning: (msg: string) => {
        this.printer.warning(msg);
      },
    };
  }

  /**
   * Display results based on format option
   */
  private displayResults(options: DriftOptions): void {
    if (options.format === 'json') {
      const simplifiedJson = this.formatter.createSimplifiedJsonOutput();
      this.printer.info(JSON.stringify(simplifiedJson, null, 2));
    } else if (options.format === 'summary') {
      const output = this.formatter.formatDrift('summary');
      this.printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        this.printer.info(output.categoryBreakdown);
      }
    } else if (options.format === 'tree') {
      const output = this.formatter.formatDrift('tree');
      this.printer.info(output.summaryDashboard);
      if (output.treeView) {
        this.printer.info(output.treeView);
      }
      if (output.detailedChanges) {
        this.printer.info(output.detailedChanges);
      }
      if (options.verbose && output.categoryBreakdown) {
        this.printer.info(output.categoryBreakdown);
      }
    } else {
      // This shouldn't happen with TypeScript, but handle gracefully
      this.printer.warning(`Unknown format: ${options.format}. Using summary format.`);
      const output = this.formatter.formatDrift('summary');
      this.printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        this.printer.info(output.categoryBreakdown);
      }
    }
  }
}
