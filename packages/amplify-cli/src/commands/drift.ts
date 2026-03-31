/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import chalk from 'chalk';
import { detectStackDriftRecursive, type CloudFormationDriftResults } from './drift-detection';
import { detectLocalDrift, type LocalDriftResults } from './drift-detection/detect-local-drift';
import { detectTemplateDrift, type TemplateDriftResults } from './drift-detection/detect-template-drift';
import { CloudFormationService, AmplifyConfigService, createUnifiedCategoryView } from './drift-detection/services';
import { SpinningLogger } from './gen2-migration/_infra/spinning-logger';

/**
 * Result of drift detection.
 */
export interface DriftDetectionResult {
  /** 0 = no drift, 1 = drift detected or incomplete. */
  readonly code: number;
  /** Human-readable drift report, undefined when no drift. */
  readonly report?: string;
}

/**
 * Executes the drift detection command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const detector = new AmplifyDriftDetector(context);
  const result = await detector.detect();

  if (result.code !== 0) {
    process.exitCode = result.code;
  }
};

/**
 * Amplify drift detector - Coordinator class
 * Coordinates services to perform drift detection
 */
export class AmplifyDriftDetector {
  private readonly cfnService: CloudFormationService;
  private readonly configService: AmplifyConfigService;
  private readonly printer: SpinningLogger;

  constructor(private readonly context: $TSContext, logger?: SpinningLogger) {
    this.printer = logger ?? new SpinningLogger('Drift');
    this.cfnService = new CloudFormationService(this.printer);
    this.configService = new AmplifyConfigService();
  }

  /**
   * Detect drift for the current Amplify project
   * Orchestrates the drift detection process using services
   */
  public async detect(): Promise<DriftDetectionResult> {
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
      this.printer.start('Syncing cloud backend from S3...');
      const syncSuccess = await this.cfnService.syncCloudBackendFromS3(this.context);

      // Phase 1: Detect CloudFormation drift recursively
      this.printer.push('Detecting CloudFormation drift...');
      phase1Results = await detectStackDriftRecursive(cfn, stackName, this.printer);
      this.printer.debug('Phase 1 complete');

      if (!syncSuccess) {
        phase2Results = {
          changes: [],
          incomplete: true,
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
        this.printer.push('Analyzing template changes...');
        this.printer.debug('Checking for template drift using changesets...');
        phase2Results = await detectTemplateDrift(stackName, this.printer, cfn);
        this.printer.debug(`Phase 2 complete: ${phase2Results.changes.length} changes`);

        // Phase 3: Local drift detection
        this.printer.push('Checking local changes...');
        this.printer.debug('Checking local files vs cloud backend...');
        phase3Results = await detectLocalDrift(this.context);
        this.printer.debug('Phase 3 complete');
      }

      this.printer.succeed('Drift detection completed');
    } catch (error) {
      this.printer.stop();
      throw error;
    }

    const driftReport = createUnifiedCategoryView(phase1Results, phase2Results, phase3Results);
    if (driftReport) {
      this.printer.info(driftReport);
      this.printer.info(chalk.yellow('Drift detected'));
    } else {
      this.printer.info(chalk.green('No drift detected'));
    }

    const hasAnyErrors = phase1Results.incomplete || phase2Results.incomplete || phase3Results.skipped;

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
      if (phase2Results.incomplete) {
        const reason = phase2Results.skipReason
          ? `Template drift error: ${phase2Results.skipReason}`
          : `Template drift incomplete - ${phase2Results.skippedStacks?.length ?? 0} nested stack(s) skipped`;
        this.printer.warn(chalk.yellow(reason));
      }
      if (phase3Results.skipped) {
        this.printer.warn(chalk.yellow(`Local drift error: ${phase3Results.skipReason}`));
      }
      this.printer.debug('Exit code 1: Incomplete drift detection - cannot guarantee no drift');
      return { code: 1, report: driftReport ?? undefined };
    }
    return { code: driftReport ? 1 : 0, report: driftReport };
  }
}
