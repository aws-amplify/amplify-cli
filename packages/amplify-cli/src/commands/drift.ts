/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer, AmplifySpinner, type Printer, isDebug } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import { detectStackDriftRecursive, type CloudFormationDriftResults } from './drift-detection';
import { detectLocalDrift, type LocalDriftResults } from './drift-detection/detect-local-drift';
import { detectTemplateDrift, type TemplateDriftResults } from './drift-detection/detect-template-drift';
import { CloudFormationService, AmplifyConfigService, createUnifiedCategoryView } from './drift-detection/services';

/**
 * Executes the drift detection command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const detector = new AmplifyDriftDetector(context);
  const exitCode = await detector.detect();

  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
};

/**
 * Amplify drift detector - Coordinator class
 * Coordinates services to perform drift detection
 */
export class AmplifyDriftDetector {
  private readonly cfnService: CloudFormationService;
  private readonly configService: AmplifyConfigService;
  private readonly printer: Printer;
  private readonly spinner = new AmplifySpinner();
  private spinnerText = '';
  private spinnerActive = false;

  constructor(private readonly context: $TSContext, basePrint: Pick<Printer, 'info' | 'debug' | 'warn'> = printer) {
    // Wrap each method to pause/resume spinner so output never collides
    this.printer = {
      info: (msg: string) => this.withSpinnerPaused(() => basePrint.info(msg)),
      debug: (msg: string) => {
        if (!isDebug) return;
        basePrint.debug(msg);
      },
      warn: (msg: string) => this.withSpinnerPaused(() => basePrint.warn(msg)),
      blankLine: () => this.withSpinnerPaused(() => printer.blankLine()),
      success: (msg: string) => this.withSpinnerPaused(() => printer.success(msg)),
      error: (msg: string) => this.withSpinnerPaused(() => printer.error(msg)),
    };

    this.cfnService = new CloudFormationService(this.printer);
    this.configService = new AmplifyConfigService();
  }

  private withSpinnerPaused(fn: () => void): void {
    if (this.spinnerActive) {
      this.spinner.stop();
      fn();
      this.spinner.start(this.spinnerText);
    } else {
      fn();
    }
  }

  private startSpinner(text: string): void {
    this.spinnerText = text;
    if (isDebug) return;
    this.spinnerActive = true;
    this.spinner.start(text);
  }

  private updateSpinner(text: string): void {
    this.spinnerText = text;
    if (this.spinnerActive) this.spinner.resetMessage(text);
  }

  private stopSpinner(text?: string): void {
    if (!this.spinnerActive) return;
    this.spinnerActive = false;
    this.spinner.stop(text);
    this.spinnerText = '';
  }

  /**
   * Detect drift for the current Amplify project
   * Orchestrates the drift detection process using services
   */
  public async detect(): Promise<number> {
    // Validate Amplify project exists and is initialized
    this.configService.validateAmplifyProject();
    this.printer.debug('Amplify project validated');

    // Get stack name and project info, init environment info
    // constructExeInfo is necessary to initialize env info used in getClient's CloudFormation object
    this.context.amplify.constructExeInfo(this.context);
    const stackName = this.configService.getRootStackName();
    const projectName = this.configService.getProjectName();
    this.printer.debug(`Root Stack: ${stackName}`);
    this.printer.info(chalk.cyan.bold(`Started Drift Detection for Project: ${projectName}`));
    this.printer.debug('Phase 1: CloudFormation drift \nPhase 2: Template changes \nPhase 3: Local vs cloud files\n');

    // Get CloudFormation client
    const cfn = await this.cfnService.getClient(this.context);
    this.printer.debug('CloudFormation client initialized');

    // Validate root stack exists
    if (!(await this.cfnService.validateStackExists(cfn, stackName))) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${stackName} does not exist.`,
        resolution: 'Has the project been deployed? Run "amplify push" to deploy your project.',
      });
    }

    // Start drift detection phases with spinner
    let phase1Results: CloudFormationDriftResults;
    let phase2Results: TemplateDriftResults;
    let phase3Results: LocalDriftResults;

    try {
      // Sync cloud backend from S3 before running any phases
      this.startSpinner('Syncing cloud backend from S3...');
      const syncSuccess = await this.cfnService.syncCloudBackendFromS3(this.context);

      // Phase 1: Detect CloudFormation drift recursively
      this.updateSpinner('Detecting CloudFormation drift...');
      phase1Results = await detectStackDriftRecursive(cfn, stackName, this.printer);
      this.printer.debug('Phase 1 complete');

      if (!syncSuccess) {
        phase2Results = {
          changes: [],
          skipped: true,
          skipReason: 'S3 backend sync failed - cannot compare templates',
        };
        phase3Results = {
          skipped: true,
          skipReason: 'S3 backend sync failed - cannot compare local vs cloud',
        };
        this.printer.warn(chalk.yellow('Cloud backend sync failed - template drift and local drift will be skipped'));
      } else {
        this.printer.debug('S3 sync completed successfully');

        // Phase 2: Template drift detection
        this.updateSpinner('Analyzing template changes...');
        this.printer.debug('Checking for template drift using changesets...');
        phase2Results = await detectTemplateDrift(stackName, this.printer, cfn);
        this.printer.debug(`Phase 2 complete: ${phase2Results.changes.length} changes`);

        // Phase 3: Local drift detection
        this.updateSpinner('Checking local changes...');
        this.printer.debug('Checking local files vs cloud backend...');
        phase3Results = await detectLocalDrift(this.context);
        this.printer.debug('Phase 3 complete');
      }

      this.stopSpinner('Drift detection completed');
    } catch (error) {
      this.stopSpinner();
      throw error;
    }

    const driftReport = createUnifiedCategoryView(phase1Results, phase2Results, phase3Results);
    if (driftReport) {
      this.printer.info(driftReport);
      this.printer.info(chalk.yellow('Drift detected'));
    } else {
      this.printer.info(chalk.green('No drift detected'));
    }

    const hasAnyErrors = phase1Results.incomplete || phase2Results.skipped || phase3Results.skipped;

    if (hasAnyErrors) {
      this.printer.warn(chalk.yellow('Drift detection encountered errors, results may be incomplete:'));
      if (phase1Results.incomplete) {
        this.printer.warn(
          chalk.yellow(`CloudFormation drift check incomplete - ${phase1Results.skippedStacks.length} nested stack(s) skipped`),
        );
        for (const skippedStack of phase1Results.skippedStacks) {
          this.printer.debug(`  - ${skippedStack}`);
        }
      }
      if (phase2Results.skipped) {
        this.printer.warn(chalk.yellow(`Template drift error: ${phase2Results.skipReason}`));
      }
      if (phase3Results.skipped) {
        this.printer.warn(chalk.yellow(`Local drift error: ${phase3Results.skipReason}`));
      }
      this.printer.debug('Exit code 1: Incomplete drift detection - cannot guarantee no drift');
      return 1;
    }
    if (driftReport) {
      this.printer.debug('Exit code 1: drift detected across phases');
      return 1;
    }
    return 0;
  }
}
