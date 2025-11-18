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
import { detectOutOfTemplateDrift } from './drift-detection/detect-resource-drift';
import { CloudFormationService, AmplifyConfigService, FileService, DriftFormatter } from './drift-detection/services';
import type { CloudFormationClient } from '@aws-sdk/client-cloudformation';

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

    // 5. Phase 1: Detect CloudFormation drift recursively (including nested stacks)
    const print = this.createPrintObject(options);
    const combinedResults = await detectStackDriftRecursive(cfn, stackName, print);

    // 5b. Phase 1b: Detect out-of-template drift (properties not in CFN templates)
    printer.info(chalk.gray('Detecting out-of-template property changes...'));
    const region = this.configService.getRegion();

    // Collect all resources from root and nested stacks
    const allResources = [
      ...(combinedResults.rootStackDrifts.StackResourceDrifts || []),
      ...Object.values(combinedResults.nestedStackDrifts).flatMap((nested) => nested.StackResourceDrifts || []),
    ];

    const outOfTemplateDrifts = await detectOutOfTemplateDrift(region, allResources, stackName);

    if (options.verbose) {
      if (outOfTemplateDrifts.length > 0) {
        printer.info(chalk.yellow('\nDetected changes in properties NOT managed by CloudFormation templates:'));
        printer.info(chalk.yellow('These properties were added manually and will persist through "amplify push --force"\n'));

        for (const drift of outOfTemplateDrifts) {
          printer.info(chalk.white(`  ${drift.logicalResourceId} (${drift.resourceType})`));
          for (const prop of drift.propertyDifferences) {
            printer.info(chalk.gray(`    → ${prop.propertyPath}`));
            printer.info(chalk.gray(`      Current: ${JSON.stringify(prop.actualValue)}`));
          }
        }

        printer.info(chalk.cyan(`\nDetected ${outOfTemplateDrifts.length} resources with out-of-template drift`));

        printer.info(chalk.yellow('\nIMPORTANT: These drifts cannot be fixed with "amplify push --force"'));
        printer.info(chalk.yellow('You must either:'));
        printer.info(chalk.yellow('  1. Add these properties to your CloudFormation templates, OR'));
        printer.info(chalk.yellow('  2. Manually remove them via AWS Console\n'));
      } else {
        printer.info(chalk.green('No out-of-template drift detected'));
      }
    }

    // 6. Phase 3 (run before Phase 2): Detect local vs S3 drift and sync #current-cloud-backend
    printer.info(chalk.gray('Fetching current backend state from S3...'));
    printer.info(chalk.gray('Checking local files vs cloud backend...'));
    const phase3Results = await detectLocalDrift(this.context);

    // 7. Phase 2: Detect template drift using changesets (after Phase 3 ensures sync)
    printer.info(chalk.gray('Checking for template drift using changesets...'));
    const templateDriftDetector = new TemplateDriftDetector(this.context);
    this.phase2Results = await templateDriftDetector.detect();

    printer.info(chalk.green('Drift detection completed'));
    printer.info('');

    // 7. Handle no results
    if (!combinedResults.rootStackDrifts.StackResourceDrifts) {
      printer.warn(`${stackName}: No drift results available`);
      return 0;
    }

    // 8. Process results with the simplified formatter
    const rootTemplate = await this.cfnService.getStackTemplate(cfn, stackName);
    await this.formatter.processResults(cfn, stackName, rootTemplate, combinedResults);

    // Add Phase 2 and Phase 3 results to formatter
    this.formatter.addPhase2Results(this.phase2Results);
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
      info: (msg: string) => printer.info(msg),
      debug: (msg: string) => {
        if (options.verbose) printer.info(msg);
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
      if (output.detailedChanges) {
        printer.info(output.detailedChanges);
      }
      if (options.verbose && output.categoryBreakdown) {
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
