/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import { detectStackDriftRecursive, type DriftDisplayFormat } from './drift-detection';
import { detectLocalDrift } from './drift-detection/detect-local-drift';
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
    this.printer = print ?? {
      info: (message: string) => printer.info(message),
      warning: (message: string) => printer.warn(message),
      warn: (message: string) => printer.warn(message),
      debug: (message: string) => printer.debug(message),
    };
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

    // 6. Phase 3: Detect local vs S3 drift
    this.printer.info(chalk.gray('Fetching current backend state from S3...'));
    this.printer.info(chalk.gray('Checking local files vs cloud backend...'));
    // Fix #5: Pass context to detectLocalDrift
    const phase3Results = await detectLocalDrift(this.context);

    this.printer.info(chalk.green('Drift detection completed'));
    this.printer.info('');

    // 7. Handle no results
    if (!combinedResults.rootStackDrifts.StackResourceDrifts) {
      this.printer.warn(`${stackName}: No drift results available`);
      return 0;
    }

    // 8. Process results with the simplified formatter
    const rootTemplate = await this.cfnService.getStackTemplate(cfn, stackName);
    await this.formatter.processResults(cfn, stackName, rootTemplate, combinedResults);

    // Add Phase 3 results to formatter
    this.formatter.addPhase3Results(phase3Results);

    // 9. Display results
    this.displayResults(options);

    // 10. Save JSON if requested
    if (options['output-file']) {
      const simplifiedJson = this.formatter.createSimplifiedJsonOutput();
      await this.fileService.saveJsonOutput(options['output-file'], simplifiedJson);
    }

    // 11. Return exit code - return 1 if any drift detected (Phase 1 or Phase 3), 0 if no drift
    const totalDriftCount = this.formatter.getTotalDriftCount();
    return totalDriftCount > 0 ? 1 : 0;
  }

  /**
   * Create print object for drift detection output
   */
  private createPrintObject(options: DriftOptions) {
    return {
      info: (msg: string) => this.printer.info(msg),
      debug: (msg: string) => {
        if (options.verbose) this.printer.debug(msg);
      },
      warn: (msg: string) => {
        this.printer.warn(msg);
      },
      warning: (msg: string) => {
        this.printer.warn(msg);
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
      // Display Phase 3 results
      const phase3Output = this.formatter.formatPhase3Results();
      if (phase3Output) {
        printer.info(phase3Output);
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
      // Display Phase 3 results
      const phase3Output = this.formatter.formatPhase3Results();
      if (phase3Output) {
        printer.info(phase3Output);
      }
    } else {
      // This shouldn't happen with TypeScript, but handle gracefully
      this.printer.warn(`Unknown format: ${options.format}. Using summary format.`);
      const output = this.formatter.formatDrift('summary');
      this.printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        this.printer.info(output.categoryBreakdown);
      }
      // Display Phase 3 results
      const phase3Output = this.formatter.formatPhase3Results();
      if (phase3Output) {
        printer.info(phase3Output);
      }
    }
  }
}
