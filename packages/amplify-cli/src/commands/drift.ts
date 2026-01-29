/**
 * Amplify drift detection command
 * Based on AWS CDK CLI drift implementation
 */

import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import { detectStackDriftRecursive, type CloudFormationDriftResults, type DriftDisplayFormat } from './drift-detection';
import { detectLocalDrift, type LocalDriftResults } from './drift-detection/detect-local-drift';
import { detectTemplateDrift, type TemplateDriftResults } from './drift-detection/detect-template-drift';
import {
  CloudFormationService,
  AmplifyConfigService,
  FileService,
  type CloudFormationTemplate,
  type ProcessedDriftData,
  type StackDriftData,
  countDrifted,
  countInSync,
  countFailed,
  countUnchecked,
  formatDriftResults,
} from './drift-detection/services';
import { extractCategory } from './gen2-migration/categories';

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
 * Amplify drift detector - Coordinator class
 * Coordinates services to perform drift detection
 */
export class AmplifyDriftDetector {
  private readonly cfnService: CloudFormationService;
  private readonly configService: AmplifyConfigService;
  private readonly fileService: FileService;
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
    this.fileService = new FileService();
  }

  /**
   * Detect drift for the current Amplify project
   * Orchestrates the drift detection process using services
   */
  public async detect(options: DriftOptions = {}): Promise<number> {
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
    this.printer.info('Fetching current backend state from S3...');
    const syncSuccess = await this.cfnService.syncCloudBackendFromS3(this.context);

    // Phase 1: Detect CloudFormation drift recursively (doesn't depend on S3 sync)
    this.printer.debug('Starting Phase 1: CloudFormation drift detection');
    this.printer.info(`Checking drift for root stack: ${chalk.yellow(stackName)}`);
    const phase1Results = await detectStackDriftRecursive(cfn, stackName, this.printer);
    this.printer.debug(`Phase 1 complete: ${phase1Results.totalDrifted} drifted resources detected`);

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
      this.printer.info('Checking for template drift using changesets...');
      phase2Results = await detectTemplateDrift(stackName, this.printer, cfn);
      this.printer.debug(`Phase 2 complete: totalDrifted=${phase2Results.totalDrifted}`);

      this.printer.debug('Starting Phase 3: Local drift detection');
      this.printer.info('Checking local files vs cloud backend...');
      phase3Results = await detectLocalDrift(this.context);
      this.printer.debug(`Phase 3 complete: totalDrifted=${phase3Results.totalDrifted}`);
    }

    this.printer.info(chalk.green('Drift detection completed\n'));

    // Process results with the formatter
    this.printer.debug('Processing and formatting results');
    const processedData = await this.processData(cfn, stackName, projectName, phase1Results, phase2Results, phase3Results);

    this.displayResults(options, processedData);

    // 10. Save JSON if requested
    if (options['output-file']) {
      this.printer.debug(`Saving output to: ${options['output-file']}`);
      const simplifiedJson = {
        stackName,
        numResourcesWithDrift: processedData.summary.totalDrifted,
        numResourcesUnchecked: processedData.summary.totalUnchecked,
        timestamp: new Date().toISOString(),
      };
      await this.fileService.saveJsonOutput(options['output-file'], simplifiedJson, this.printer);
    }

    // 11. Check for errors during detection - including Phase 1 nested stack skips
    const hasPhase1Errors = Boolean(phase1Results.skippedNestedStacks && phase1Results.skippedNestedStacks.length > 0);
    const hasAnyErrors = hasPhase1Errors || phase2Results.skipped || phase3Results.skipped;

    // Debug: Print final error state variables
    this.printer.debug('Error states:');
    this.printer.debug(`Phase 1 errors: ${hasPhase1Errors}`);
    this.printer.debug(`Phase 2 errors: ${phase2Results.skipped}`);
    this.printer.debug(`Phase 3 errors: ${phase3Results.skipped}`);

    if (hasAnyErrors) {
      this.printer.warn(chalk.yellow('Drift detection encountered errors:'));
      if (hasPhase1Errors) {
        this.printer.warn(
          chalk.yellow(`• CloudFormation drift check incomplete - ${phase1Results.skippedNestedStacks.length} nested stack(s) skipped`),
        );
        for (const skippedStack of phase1Results.skippedNestedStacks) {
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
    const totalDriftCount = phase1Results.totalDrifted + phase2Results.totalDrifted + phase3Results.totalDrifted;
    this.printer.debug('Drift count breakdown by phase:');
    this.printer.debug(`Phase 1 (CloudFormation): ${phase1Results.totalDrifted}`);
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
   * Display results based on format option
   */
  private displayResults(options: DriftOptions, data: ProcessedDriftData): void {
    if (options.format === 'json') {
      const simplifiedJson = {
        stackName: data.rootStackName,
        numResourcesWithDrift: data.summary.totalDrifted,
        numResourcesUnchecked: data.summary.totalUnchecked,
        timestamp: new Date().toISOString(),
      };
      printer.info(JSON.stringify(simplifiedJson, null, 2));
    } else if (options.format === 'summary') {
      const output = formatDriftResults(data, 'summary');
      printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        printer.info(output.categoryBreakdown);
      }
      if (output.phase2Output) {
        printer.info(output.phase2Output);
      }
      if (output.phase3Output) {
        printer.info(output.phase3Output);
      }
    } else if (options.format === 'tree') {
      const output = formatDriftResults(data, 'tree');
      printer.info(output.summaryDashboard);
      if (output.treeView) {
        printer.info(output.treeView);
      }
      if (output.detailedChanges) {
        printer.info(output.detailedChanges);
      }
      if (options.debug && output.categoryBreakdown) {
        printer.info(output.categoryBreakdown);
      }
      if (output.phase2Output) {
        printer.info(output.phase2Output);
      }
      if (output.phase3Output) {
        printer.info(output.phase3Output);
      }
    } else {
      printer.warn(`Unknown format: ${options.format}. Using summary format.`);
      const output = formatDriftResults(data, 'summary');
      printer.info(output.summaryDashboard);
      if (output.categoryBreakdown) {
        printer.info(output.categoryBreakdown);
      }
      if (output.phase2Output) {
        printer.info(output.phase2Output);
      }
      if (output.phase3Output) {
        printer.info(output.phase3Output);
      }
    }
  }

  /**
   * Process drift detection results into ProcessedDriftData
   */
  private async processData(
    cfn: CloudFormationClient,
    stackName: string,
    projectName: string,
    phase1Results: CloudFormationDriftResults,
    phase2Results: TemplateDriftResults,
    phase3Results: LocalDriftResults,
  ): Promise<ProcessedDriftData> {
    const rootTemplate = await this.cfnService.getStackTemplate(cfn, stackName);

    // Fetch all nested stack templates
    const nestedTemplates = new Map<string, CloudFormationTemplate>();
    for (const [logicalId] of phase1Results.nestedStackDrifts.entries()) {
      const physicalName = phase1Results.nestedStackPhysicalIds.get(logicalId) || logicalId;
      nestedTemplates.set(logicalId, await this.cfnService.getStackTemplate(cfn, physicalName));
    }

    // Build root counts
    const rootDrifts = phase1Results.rootStackDrifts.StackResourceDrifts || [];
    const rootCounts = {
      drifted: countDrifted(rootDrifts),
      inSync: countInSync(rootDrifts),
      unchecked: countUnchecked(rootDrifts, rootTemplate),
      failed: countFailed(rootDrifts),
    };

    // Build nested stacks data
    const nestedStacks: StackDriftData[] = [];
    let totalInSync = rootCounts.inSync;
    let totalUnchecked = rootCounts.unchecked;
    let totalFailed = rootCounts.failed;

    for (const [logicalId, nestedDrift] of phase1Results.nestedStackDrifts.entries()) {
      if (!nestedDrift.StackResourceDrifts) continue;
      const physicalName = phase1Results.nestedStackPhysicalIds.get(logicalId) || logicalId;
      const template = nestedTemplates.get(logicalId) || {};
      const drifts = nestedDrift.StackResourceDrifts;
      const counts = {
        drifted: countDrifted(drifts),
        inSync: countInSync(drifts),
        unchecked: countUnchecked(drifts, template),
        failed: countFailed(drifts),
      };
      totalInSync += counts.inSync;
      totalUnchecked += counts.unchecked;
      totalFailed += counts.failed;
      nestedStacks.push({ logicalId, physicalName, category: extractCategory(logicalId), drifts, template, counts });
    }

    return {
      projectName,
      rootStackName: stackName,
      root: {
        logicalId: stackName,
        physicalName: stackName,
        category: 'root',
        drifts: rootDrifts,
        template: rootTemplate,
        counts: rootCounts,
      },
      nestedStacks,
      summary: { totalStacks: 1 + nestedStacks.length, totalDrifted: phase1Results.totalDrifted, totalInSync, totalUnchecked, totalFailed },
      phase2Results,
      phase3Results,
    };
  }
}
