/**
 * Amplify drift detection command
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import { detectStackDriftRecursive, type CloudFormationDriftResults } from './drift-detection';
import { detectLocalDrift, type LocalDriftResults } from './drift-detection/detect-local-drift';
import { detectTemplateDrift, type TemplateDriftResults } from './drift-detection/detect-template-drift';
import { CloudFormationService, AmplifyConfigService, createUnifiedCategoryView } from './drift-detection/services';
import { SpinningLogger } from './gen2-migration/_spinning-logger';

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
 * Executes the drift detection command.
 */
export const run = async (context: $TSContext): Promise<void> => {
  const logger = new SpinningLogger('drift');
  const detector = new AmplifyDriftDetector(context, logger);

  logger.start('Drift detection');
  const result = await detector.detect();
  logger.succeed('Drift detection');

  if (result.report) {
    printer.info(result.report);
  }

  if (result.code !== 0) {
    process.exitCode = result.code;
  }
};

/**
 * Coordinates services to perform drift detection.
 * Accepts a SpinningLogger; the caller owns the spinner lifecycle.
 */
export class AmplifyDriftDetector {
  private readonly cfnService: CloudFormationService;
  private readonly configService: AmplifyConfigService;

  constructor(private readonly context: $TSContext, private readonly logger: SpinningLogger) {
    this.cfnService = new CloudFormationService(this.logger);
    this.configService = new AmplifyConfigService();
  }

  /** Detects drift for the current Amplify project. */
  public async detect(): Promise<DriftDetectionResult> {
    this.configService.validateAmplifyProject();
    this.logger.debug('Amplify project validated');

    this.context.amplify.constructExeInfo(this.context);
    const stackName = this.configService.getRootStackName();
    this.logger.debug(`Root Stack: ${stackName}`);

    const cfn = await this.cfnService.getClient(this.context);
    this.logger.debug('CloudFormation client initialized');

    if (!(await this.cfnService.validateStackExists(cfn, stackName))) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${stackName} does not exist.`,
        resolution: 'Has the project been deployed? Run "amplify push" to deploy your project.',
      });
    }

    let phase1Results: CloudFormationDriftResults;
    let phase2Results: TemplateDriftResults;
    let phase3Results: LocalDriftResults;

    this.logger.debug('Syncing cloud backend');
    const syncSuccess = await this.cfnService.syncCloudBackendFromS3(this.context);

    try {
      this.logger.push('CloudFormation drift');
      phase1Results = await detectStackDriftRecursive(cfn, stackName, this.logger);
      this.logger.pop();
      this.logger.debug('Phase 1 complete');

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
        this.logger.warn(chalk.yellow('Cloud backend sync failed - template drift and local drift will be skipped'));
      } else {
        this.logger.debug('S3 sync completed successfully');

        // eslint-disable-next-line spellcheck/spell-checker
        this.logger.push('Template changes');
        // eslint-disable-next-line spellcheck/spell-checker
        this.logger.debug('Checking for template drift using changesets...');
        phase2Results = await detectTemplateDrift(stackName, this.logger, cfn);
        this.logger.pop();
        this.logger.debug(`Phase 2 complete: ${phase2Results.changes.length} changes`);

        this.logger.push('Local changes');
        this.logger.debug('Checking local files vs cloud backend...');
        phase3Results = await detectLocalDrift(this.context);
        this.logger.pop();
        this.logger.debug('Phase 3 complete');
      }
    } catch (error) {
      this.logger.pop();
      throw error;
    }

    const driftReport = createUnifiedCategoryView(phase1Results, phase2Results, phase3Results);
    const hasAnyErrors = phase1Results.incomplete || phase2Results.skipped || phase3Results.skipped;

    if (hasAnyErrors) {
      this.logger.warn(chalk.yellow('Drift detection encountered errors, results may be incomplete:'));
      if (phase1Results.incomplete) {
        this.logger.warn(
          chalk.yellow(`CloudFormation drift check incomplete - ${phase1Results.skippedStacks.length} nested stack(s) skipped`),
        );
        for (const skippedStack of phase1Results.skippedStacks) {
          this.logger.debug(`  - ${skippedStack}`);
        }
      }
      if (phase2Results.skipped) {
        this.logger.warn(chalk.yellow(`Template drift error: ${phase2Results.skipReason}`));
      }
      if (phase3Results.skipped) {
        this.logger.warn(chalk.yellow(`Local drift error: ${phase3Results.skipReason}`));
      }
      this.logger.debug('Exit code 1: Incomplete drift detection - cannot guarantee no drift');
      return { code: 1, report: driftReport ?? undefined };
    }
    return { code: driftReport ? 1 : 0, report: driftReport };
  }
}
