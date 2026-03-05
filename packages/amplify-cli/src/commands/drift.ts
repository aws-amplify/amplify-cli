/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import { detectStackDriftRecursive, type CloudFormationDriftResults } from './drift-detection';
import { detectLocalDrift, type LocalDriftResults } from './drift-detection/detect-local-drift';
import { detectTemplateDrift, type TemplateDriftResults } from './drift-detection/detect-template-drift';
import { CloudFormationService, AmplifyConfigService, formatDriftResults } from './drift-detection/services';

/**
 * Print interface for consistent logging across drift detection
 */
export interface Print {
  info: (msg: string) => void;
  debug: (msg: string) => void;
  warn: (msg: string) => void;
  warning: (msg: string) => void;
}

/**
 * Command options
 */
interface DriftOptions {
  debug?: boolean;
}

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
  private readonly printer: Print;
  private readonly options: DriftOptions;

  constructor(private readonly context: $TSContext, print?: Print) {
    // Store options from context for later use
    this.options = {
      debug: context.parameters?.options?.debug || false,
    };

    if (!print) {
      // Default printer with grey for debug
      this.printer = {
        info: (message: string) => printer.info(message),
        warning: (message: string) => printer.warn(message),
        warn: (message: string) => printer.warn(message),
        debug: (message: string) => {
          if (this.options.debug) {
            printer.debug(chalk.gray(message));
          }
        },
      };
    } else {
      this.printer = print;
    }

    this.cfnService = new CloudFormationService(this.printer);
    this.configService = new AmplifyConfigService();
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
    this.printer.debug(`Stack: ${stackName}, Project: ${projectName}`);
    this.printer.info('');
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

    // Start drift detection
    // Sync cloud backend from S3 before running any phases
    this.printer.debug('Syncing cloud backend from S3...');
    const syncSuccess = await this.cfnService.syncCloudBackendFromS3(this.context);

    // Phase 1: Detect CloudFormation drift recursively (doesn't depend on S3 sync)
    this.printer.debug('Starting Phase 1: CloudFormation drift detection');
    this.printer.debug(`Checking drift for root stack: ${stackName}`);
    const phase1Results = await detectStackDriftRecursive(cfn, stackName, this.printer);
    this.printer.debug(`Phase 1 complete: ${phase1Results.summary.totalDrifted} drifted resources detected`);

    // Initialize phase results with skipped status if sync fails
    let phase2Results: TemplateDriftResults = {
      totalDrifted: 0,
      changes: [],
      skipped: true,
      skipReason: 'S3 backend sync failed - cannot compare templates',
    };
    let phase3Results: LocalDriftResults = {
      totalDrifted: 0,
      skipped: true,
      skipReason: 'S3 backend sync failed - cannot compare local vs cloud',
    };

    if (!syncSuccess) {
      this.printer.warn(chalk.yellow('S3 sync failed - Phase 2 and Phase 3 will be skipped'));
      this.printer.debug('S3 sync skipped or failed - cannot run Phase 2 and Phase 3 without accurate cloud backend');
    } else {
      this.printer.debug('S3 sync completed successfully');

      this.printer.debug('Starting Phase 2: Template drift detection');
      this.printer.debug('Checking for template drift using changesets...');
      phase2Results = await detectTemplateDrift(stackName, this.printer, cfn);
      this.printer.debug(`Phase 2 complete: totalDrifted=${phase2Results.totalDrifted}`);

      this.printer.debug('Starting Phase 3: Local drift detection');
      this.printer.debug('Checking local files vs cloud backend...');
      phase3Results = await detectLocalDrift(this.context);
      this.printer.debug(`Phase 3 complete: totalDrifted=${phase3Results.totalDrifted}`);
    }

    this.printer.info(chalk.green('Drift detection completed\n'));

    // Display results directly
    this.printer.debug('Formatting results');
    this.displayResults(phase1Results, phase2Results, phase3Results, projectName);

    // Check for errors during detection
    const hasAnyErrors = phase1Results.incomplete || phase2Results.skipped || phase3Results.skipped;

    // Debug: Print final error state variables
    this.printer.debug('Error states:');
    this.printer.debug(`Phase 1 incomplete: ${phase1Results.incomplete}`);
    this.printer.debug(`Phase 2 skipped: ${phase2Results.skipped}`);
    this.printer.debug(`Phase 3 skipped: ${phase3Results.skipped}`);

    if (hasAnyErrors) {
      this.printer.warn(chalk.yellow('Drift detection encountered errors:'));
      if (phase1Results.incomplete) {
        this.printer.warn(
          chalk.yellow(`• CloudFormation drift check incomplete - ${phase1Results.skippedStacks.length} nested stack(s) skipped`),
        );
        for (const skippedStack of phase1Results.skippedStacks) {
          this.printer.debug(`    - ${skippedStack}`);
        }
      }
      if (phase2Results.skipped) {
        this.printer.warn(chalk.yellow(`• Template drift error: ${phase2Results.skipReason}`));
      }
      if (phase3Results.skipped) {
        this.printer.warn(chalk.yellow(`• Local drift error: ${phase3Results.skipReason}`));
      }
    }

    // Aggregate drift counts from all phases
    const totalDriftCount = phase1Results.summary.totalDrifted + phase2Results.totalDrifted + phase3Results.totalDrifted;
    this.printer.debug('Drift count breakdown by phase:');
    this.printer.debug(`Phase 1 (CloudFormation): ${phase1Results.summary.totalDrifted}`);
    this.printer.debug(`Phase 2 (Template):       ${phase2Results.totalDrifted}`);
    this.printer.debug(`Phase 3 (Local):          ${phase3Results.totalDrifted}`);
    this.printer.debug(`Total:                    ${totalDriftCount}`);

    // Return exit code - return 1 if any drift detected OR if any phase had errors/skips (uncertainty)
    // Fail-safe principle: any uncertainty means we cannot guarantee no drift
    if (hasAnyErrors) {
      this.printer.debug('Exit code 1: Incomplete drift detection - cannot guarantee no drift');
      return 1;
    }
    if (totalDriftCount > 0) {
      this.printer.debug(`Exit code 1: ${totalDriftCount} drift(s) detected across all phases`);
      return 1;
    }
    this.printer.debug('Exit code 0: No drift detected in any phase');
    return 0;
  }

  /**
   * Display drift detection results
   */
  private displayResults(
    phase1: CloudFormationDriftResults,
    phase2: TemplateDriftResults,
    phase3: LocalDriftResults,
    projectName: string,
  ): void {
    const output = formatDriftResults(phase1, phase2, phase3, projectName);
    this.printer.info(output.summaryDashboard);
    if (output.categoryView !== undefined) this.printer.info(output.categoryView);
  }
}
