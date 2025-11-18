/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import { detectStackDriftRecursive, type DriftDisplayFormat } from './drift-detection';
import { detectLocalDrift } from './drift-detection/detect-local-drift';
import { TemplateDriftDetector } from './drift-detection/detect-template-drift';
import { CloudFormationService, AmplifyConfigService, FileService, DriftFormatter } from './drift-detection/services';
import type { CloudFormationClient } from '@aws-sdk/client-cloudformation';

export const name = 'drift';
export const alias = [];

/**
 * Command options
 */
interface DriftOptions {
  verbose?: boolean;
  debug?: boolean;
  format?: 'tree' | 'summary' | 'json';
  'output-file'?: string;
}

/**
 * Executes the drift detection command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const options: DriftOptions = {
    verbose: context.parameters?.options?.verbose || false,
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
  private phase2Results: any = null;

  constructor(private readonly context: $TSContext) {
    // Initialize services
    this.cfnService = new CloudFormationService();
    this.configService = new AmplifyConfigService();
    this.fileService = new FileService();
    this.formatter = new DriftFormatter();
  }

  /**
   * Detect drift for the current Amplify project
   * Orchestrates the drift detection process using services
   */
  public async detect(options: DriftOptions = {}): Promise<number> {
    // 1. Validate Amplify project
    this.configService.validateAmplifyProject();
    printer.debug('Amplify project validated');

    // 2. Get stack name and project info
    const stackName = this.configService.getRootStackName();
    const projectName = this.configService.extractProjectName(stackName);
    printer.debug(`Stack: ${stackName}, Project: ${projectName}`);

    // Display initial status
    printer.info('');
    printer.info(chalk.cyan.bold(`Started Drift Detection for Project: ${projectName}`));
    printer.debug('Phase 1: CloudFormation drift | Phase 2: Template changes | Phase 3: Local vs cloud files');

    // 3. Get CloudFormation client
    const cfn = await this.cfnService.getClient(this.context);
    printer.debug('CloudFormation client initialized');

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

    // 5. Sync cloud backend from S3 before running any phases
    printer.debug('Syncing cloud backend from S3...');
    printer.info(chalk.gray('Fetching current backend state from S3...'));
    const syncSuccess = await this.cfnService.syncCloudBackendFromS3(this.context);

    // Initialize phase results with skipped status if sync fails
    let phase2Results: any = {
      skipped: true,
      skipReason: 'S3 backend sync failed - cannot compare templates',
      hasTemplateDrift: false,
    };
    let phase3Results: any = {
      phase: 3,
      hasDrift: false,
      skipped: true,
      skipReason: 'S3 backend sync failed - cannot compare local vs cloud',
    };

    if (!syncSuccess) {
      printer.warn(chalk.yellow('⚠ S3 sync failed - Phase 2 and Phase 3 will be skipped'));
      printer.debug('S3 sync skipped or failed - cannot run Phase 2 and Phase 3 without accurate cloud backend');
    } else {
      printer.debug('S3 sync completed successfully');

      // 7. Phase 2: Detect template drift using changesets (only if sync succeeded)
      printer.debug('Starting Phase 2: Template drift detection');
      printer.info(chalk.gray('Checking for template drift using changesets...'));
      const templateDriftDetector = new TemplateDriftDetector(this.context);
      phase2Results = await templateDriftDetector.detect();
      printer.debug(`Phase 2 complete: hasTemplateDrift=${phase2Results.hasTemplateDrift}`);

      // 8. Phase 3: Detect local vs cloud backend drift (only if sync succeeded)
      printer.debug('Starting Phase 3: Local drift detection');
      printer.info(chalk.gray('Checking local files vs cloud backend...'));
      phase3Results = await detectLocalDrift(this.context);
      printer.debug(`Phase 3 complete: hasDrift=${phase3Results.hasDrift}`);
    }

    // Store Phase 2 results for later use
    this.phase2Results = phase2Results;

    // 6. Phase 1: Detect CloudFormation drift recursively (always runs, doesn't depend on S3 sync)
    printer.debug('Starting Phase 1: CloudFormation drift detection');
    const print = this.createPrintObject(options);
    const combinedResults = await detectStackDriftRecursive(cfn, stackName, print);
    const totalDrifts =
      (combinedResults.rootStackDrifts.StackResourceDrifts?.length || 0) +
      Object.values(combinedResults.nestedStackDrifts).reduce((sum, nested) => sum + (nested.StackResourceDrifts?.length || 0), 0);
    printer.debug(`Phase 1 complete: ${totalDrifts} total drifts detected`);

    printer.info(chalk.green('Drift detection completed'));
    printer.info('');

    // 9. Handle no results
    if (!combinedResults.rootStackDrifts.StackResourceDrifts) {
      printer.warn(`${stackName}: No drift results available`);
      return 0;
    }

    // 10. Process results with the simplified formatter
    printer.debug('Processing and formatting results');
    const rootTemplate = await this.cfnService.getStackTemplate(cfn, stackName);
    await this.formatter.processResults(cfn, stackName, rootTemplate, combinedResults);

    // Add Phase 2 and Phase 3 results to formatter
    this.formatter.addPhase2Results(this.phase2Results);
    this.formatter.addPhase3Results(phase3Results);

    // 11. Display results
    this.displayResults(options);

    // 12. Save JSON if requested
    if (options['output-file']) {
      printer.debug(`Saving output to: ${options['output-file']}`);
      const simplifiedJson = this.formatter.createSimplifiedJsonOutput();
      await this.fileService.saveJsonOutput(options['output-file'], simplifiedJson);
    }

    // 13. Check for errors during detection
    const hasErrors = phase3Results.skipped || this.phase2Results?.skipped;
    if (hasErrors) {
      printer.warn('');
      printer.warn(chalk.yellow('⚠ Drift detection encountered errors:'));
      if (phase3Results.skipped) {
        printer.warn(chalk.yellow(`  • Local changes check: ${phase3Results.skipReason}`));
      }
      if (this.phase2Results?.skipped) {
        printer.warn(chalk.yellow(`  • Template changes check: ${this.phase2Results.skipReason}`));
      }
      printer.warn('');
    }

    // 14. Return exit code - return 1 if any drift detected or if errors occurred
    const totalDriftCount = this.formatter.getTotalDriftCount();
    printer.debug(`Total drift count: ${totalDriftCount}, Has errors: ${hasErrors}`);
    return totalDriftCount > 0 || hasErrors ? 1 : 0;
  }

  /**
   * Create print object for drift detection output
   */
  private createPrintObject(options: DriftOptions) {
    return {
      info: (msg: string) => printer.info(msg),
      debug: (msg: string) => {
        if (options.verbose || options.debug) printer.info(chalk.gray(msg));
      },
      warning: (msg: string) => printer.warn(msg),
    };
  }

  /**
   * Display results based on format option
   */
  private displayResults(options: DriftOptions): void {
    if (options.format === 'json') {
      const simplifiedJson = this.formatter.createSimplifiedJsonOutput();
      printer.info(JSON.stringify(simplifiedJson, null, 2));
    } else if (options.format === 'summary') {
      const output = this.formatter.formatDrift('summary');
      printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        printer.info(output.categoryBreakdown);
      }

      // Display Phase 2 results (between AMPLIFY CATEGORIES and LOCAL CHANGES)
      const phase2Output = this.formatter.formatPhase2Results();
      if (phase2Output) {
        printer.info(phase2Output);
      }

      // Display Phase 3 results
      const phase3Output = this.formatter.formatPhase3Results();
      if (phase3Output) {
        printer.info(phase3Output);
      }
    } else if (options.format === 'tree') {
      const output = this.formatter.formatDrift('tree');
      printer.info(output.summaryDashboard);
      if (output.treeView) {
        printer.info(output.treeView);
      }

      // Display detailed changes for drifted resources
      if (output.detailedChanges) {
        printer.info(output.detailedChanges);
      }

      if ((options.verbose || options.debug) && output.categoryBreakdown) {
        printer.info(output.categoryBreakdown);
      }

      // Display Phase 2 results (between AMPLIFY CATEGORIES and LOCAL CHANGES)
      const phase2Output = this.formatter.formatPhase2Results();
      if (phase2Output) {
        printer.info(phase2Output);
      }

      // Display Phase 3 results
      const phase3Output = this.formatter.formatPhase3Results();
      if (phase3Output) {
        printer.info(phase3Output);
      }
    } else {
      // This shouldn't happen with TypeScript, but handle gracefully
      printer.warn(`Unknown format: ${options.format}. Using summary format.`);
      const output = this.formatter.formatDrift('summary');
      printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        printer.info(output.categoryBreakdown);
      }

      // Display Phase 2 results (between AMPLIFY CATEGORIES and LOCAL CHANGES)
      const phase2Output = this.formatter.formatPhase2Results();
      if (phase2Output) {
        printer.info(phase2Output);
      }

      // Display Phase 3 results
      const phase3Output = this.formatter.formatPhase3Results();
      if (phase3Output) {
        printer.info(phase3Output);
      }
    }
  }
}
