/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import { detectStackDriftRecursive, type DriftDisplayFormat } from './drift-detection';
import { detectLocalDrift } from './drift-detection/detect-local-drift';
import { detectTemplateDrift } from './drift-detection/detect-template-drift';
import { CloudFormationService, AmplifyConfigService, FileService, DriftFormatter } from './drift-detection/services';
import type { CloudFormationClient } from '@aws-sdk/client-cloudformation';

/**
 * Print interface for consistent logging across drift detection
 */
export interface Print {
  info: (msg: string) => void;
  debug: (msg: string) => void;
  warn: (msg: string) => void;
  warning: (msg: string) => void;
}

export const name = 'drift';
export const alias = [];

/**
 * Command options
 */
interface DriftOptions {
  debug?: boolean;
  format?: 'tree' | 'summary' | 'json';
  'output-file'?: string;
}

/**
 * Executes the drift detection command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const options: DriftOptions = {
    debug: context.parameters?.options?.debug || false,
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
  private readonly options: DriftOptions;

  constructor(private readonly context: $TSContext, print?: Print) {
    // Store options from context for later use
    this.options = {
      debug: context.parameters?.options?.debug || false,
      format: context.parameters?.options?.format || 'summary',
      'output-file': context.parameters?.options?.['output-file'],
    };

    if (!print) {
      // Default printer with custom colors
      this.printer = {
        info: (message: string) => printer.info(message),
        warning: (message: string) => printer.warn(message),
        warn: (message: string) => printer.warn(message),
        debug: (message: string) => {
          if (this.options.debug) {
            printer.debug(chalk.gray(message)); // Grey for debug
          }
        },
      };
    } else {
      // External print object passed in
      this.printer = print;
    }

    // Initialize services with print interface where needed
    this.cfnService = new CloudFormationService(this.printer);
    this.configService = new AmplifyConfigService();
    this.fileService = new FileService();
    this.formatter = new DriftFormatter(this.cfnService);
  }

  /**
   * Detect drift for the current Amplify project
   * Orchestrates the drift detection process using services
   */
  public async detect(options: DriftOptions = {}): Promise<number> {
    // 1. Validate Amplify project exists and is initialized
    this.configService.validateAmplifyProject();
    this.printer.debug('Amplify project validated');

    // 2. Get stack name and project info, init environment info
    // constructExeInfo is necessary to initialize env info used in getClient's CloudFormation object
    this.context.amplify.constructExeInfo(this.context);
    const stackName = this.configService.getRootStackName();
    const projectName = this.configService.getProjectName();
    this.printer.debug(`Stack: ${stackName}, Project: ${projectName}`);
    this.printer.info('');
    this.printer.info(chalk.cyan.bold(`Started Drift Detection for Project: ${projectName}`));
    this.printer.debug('Phase 1: CloudFormation drift \nPhase 2: Template changes \nPhase 3: Local vs cloud files\n');

    // 4. Get CloudFormation client (now with proper context)
    const cfn = await this.cfnService.getClient(this.context);
    this.printer.debug('CloudFormation client initialized');

    // 5. Validate stack exists
    if (!(await this.cfnService.validateStackExists(cfn, stackName))) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${stackName} does not exist.`,
        resolution: 'Has the project been deployed? Run "amplify push" to deploy your project.',
      });
    }

    // Start drift detection
    // 6. Sync cloud backend from S3 before running any phases
    this.printer.debug('Syncing cloud backend from S3...');
    this.printer.info('Fetching current backend state from S3...');
    const syncSuccess = await this.cfnService.syncCloudBackendFromS3(this.context);

    // Initialize phase results with skipped status if sync fails
    let phase2Results: any = {
      skipped: true,
      skipReason: 'S3 backend sync failed - cannot compare templates',
      hasDrift: false,
    };
    let phase3Results: any = {
      hasDrift: false,
      skipped: true,
      skipReason: 'S3 backend sync failed - cannot compare local vs cloud',
    };

    if (!syncSuccess) {
      this.printer.warn(chalk.yellow('S3 sync failed - Phase 2 and Phase 3 will be skipped'));
      this.printer.debug('S3 sync skipped or failed - cannot run Phase 2 and Phase 3 without accurate cloud backend');
    } else {
      this.printer.debug('S3 sync completed successfully');

      // Phase 2: Detect template drift using changesets (only if sync succeeded)
      this.printer.debug('Starting Phase 2: Template drift detection');
      this.printer.info('Checking for template drift using changesets...');
      phase2Results = await detectTemplateDrift(this.context, this.printer);
      this.printer.debug(`Phase 2 complete: hasDrift=${phase2Results.hasDrift}`);

      // Phase 3: Detect local vs cloud backend drift (only if sync succeeded)
      this.printer.debug('Starting Phase 3: Local drift detection');
      this.printer.info('Checking local files vs cloud backend...');
      phase3Results = await detectLocalDrift(this.context);
      this.printer.debug(`Phase 3 complete: hasDrift=${phase3Results.hasDrift}`);
    }

    // Phase 1: Detect CloudFormation drift recursively (always runs, doesn't depend on S3 sync)
    this.printer.debug('Starting Phase 1: CloudFormation drift detection');
    this.printer.info(`Checking drift for root stack: ${chalk.yellow(stackName)}`);
    const combinedResults = await detectStackDriftRecursive(cfn, stackName, this.printer);
    const totalDrifts =
      (combinedResults.rootStackDrifts.StackResourceDrifts?.length || 0) +
      Object.values(combinedResults.nestedStackDrifts).reduce((sum, nested) => sum + (nested.StackResourceDrifts?.length || 0), 0);
    this.printer.debug(`Phase 1 complete: ${totalDrifts} total drifts detected`);

    this.printer.info(chalk.green('Drift detection completed'));
    this.printer.info('');

    // 7. Handle no results
    if (!combinedResults.rootStackDrifts.StackResourceDrifts) {
      this.printer.warn(`${stackName}: No drift results available`);
      return 0;
    }

    // 8. Process results with the simplified formatter
    this.printer.debug('Processing and formatting results');
    const rootTemplate = await this.cfnService.getStackTemplate(cfn, stackName);
    await this.formatter.processResults(cfn, stackName, rootTemplate, combinedResults);

    // 9. Display results
    this.displayResults(options, phase2Results, phase3Results);

    // 10. Save JSON if requested
    if (options['output-file']) {
      this.printer.debug(`Saving output to: ${options['output-file']}`);
      const simplifiedJson = this.formatter.createSimplifiedJsonOutput();
      await this.fileService.saveJsonOutput(options['output-file'], simplifiedJson, this.printer);
    }

    // 11. Check for errors during detection - including Phase 1 nested stack skips
    const hasPhase1Errors = Boolean(combinedResults.skippedNestedStacks && combinedResults.skippedNestedStacks.length > 0);
    const hasPhase2Errors = Boolean(phase2Results.skipped || phase2Results.error);
    const hasPhase3Errors = Boolean(phase3Results.skipped);
    const hasAnyErrors = hasPhase1Errors || hasPhase2Errors || hasPhase3Errors;

    // Debug: Print final error state variables
    this.printer.debug('Final error states:');
    this.printer.debug(`Phase 1 errors: ${hasPhase1Errors}`);
    this.printer.debug(`Phase 2 errors: ${hasPhase2Errors} (skipped: ${phase2Results.skipped})`);
    this.printer.debug(`Phase 3 errors: ${hasPhase3Errors} (skipped: ${phase3Results.skipped})`);
    this.printer.debug(`Any errors: ${hasAnyErrors}`);

    if (hasAnyErrors) {
      this.printer.warn('');
      this.printer.warn(chalk.yellow('Drift detection encountered errors:'));
      if (hasPhase1Errors && combinedResults.skippedNestedStacks) {
        this.printer.warn(
          chalk.yellow(`  • CloudFormation drift check incomplete - ${combinedResults.skippedNestedStacks.length} nested stack(s) skipped`),
        );
        for (const skippedStack of combinedResults.skippedNestedStacks) {
          this.printer.debug(`    - ${skippedStack}`);
        }
      }
      if (phase2Results.skipped) {
        this.printer.warn(chalk.yellow(`  • Template changes check: ${phase2Results.skipReason}`));
      }
      if (phase3Results.skipped) {
        this.printer.warn(chalk.yellow(`  • Local changes check: ${phase3Results.skipReason}`));
      }
      this.printer.warn('');
    }

    // 12. Return exit code - return 1 if any drift detected OR if any phase had errors/skips (uncertainty)
    const totalDriftCount = this.formatter.getTotalDriftCount();
    this.printer.debug(`Total drift count: ${totalDriftCount}`);

    // Fail-safe principle: any uncertainty means we cannot guarantee no drift
    if (hasAnyErrors) {
      this.printer.debug('Exit code 1: Incomplete drift detection - cannot guarantee no drift');
      return 1;
    }

    if (totalDriftCount > 0) {
      this.printer.debug(`Exit code 1: ${totalDriftCount} drift(s) detected`);
      return 1;
    }

    this.printer.debug('Exit code 0: No drift detected');
    return 0;
  }

  /**
   * Display results based on format option
   */
  private displayResults(options: DriftOptions, phase2Results: any, phase3Results: any): void {
    // Add Phase 2 and Phase 3 results to formatter for display
    this.formatter.addPhase2Results(phase2Results);
    this.formatter.addPhase3Results(phase3Results);

    if (options.format === 'json') {
      const simplifiedJson = this.formatter.createSimplifiedJsonOutput();
      this.printer.info(JSON.stringify(simplifiedJson, null, 2));
    } else if (options.format === 'summary') {
      const output = this.formatter.formatDrift('summary');
      this.printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        this.printer.info(output.categoryBreakdown);
      }

      // Display Phase 2 results (between AMPLIFY CATEGORIES and LOCAL CHANGES)
      const phase2Output = this.formatter.formatPhase2Results();
      if (phase2Output) {
        this.printer.info(phase2Output);
      }

      // Display Phase 3 results
      const phase3Output = this.formatter.formatPhase3Results();
      if (phase3Output) {
        this.printer.info(phase3Output);
      }
    } else if (options.format === 'tree') {
      const output = this.formatter.formatDrift('tree');
      this.printer.info(output.summaryDashboard);
      if (output.treeView) {
        this.printer.info(output.treeView);
      }

      // Display detailed changes for drifted resources
      if (output.detailedChanges) {
        this.printer.info(output.detailedChanges);
      }

      if (options.debug && output.categoryBreakdown) {
        this.printer.info(output.categoryBreakdown);
      }

      // Display Phase 2 results (between AMPLIFY CATEGORIES and LOCAL CHANGES)
      const phase2Output = this.formatter.formatPhase2Results();
      if (phase2Output) {
        this.printer.info(phase2Output);
      }

      // Display Phase 3 results
      const phase3Output = this.formatter.formatPhase3Results();
      if (phase3Output) {
        this.printer.info(phase3Output);
      }
    } else {
      // This shouldn't happen with TypeScript, but handle gracefully
      this.printer.warn(`Unknown format: ${options.format}. Using summary format.`);
      const output = this.formatter.formatDrift('summary');
      this.printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        this.printer.info(output.categoryBreakdown);
      }

      // Display Phase 2 results (between AMPLIFY CATEGORIES and LOCAL CHANGES)
      const phase2Output = this.formatter.formatPhase2Results();
      if (phase2Output) {
        this.printer.info(phase2Output);
      }

      // Display Phase 3 results
      const phase3Output = this.formatter.formatPhase3Results();
      if (phase3Output) {
        this.printer.info(phase3Output);
      }
    }
  }
}
