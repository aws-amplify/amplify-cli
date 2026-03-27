/**
 * Gen2 Migration Executor
 *
 * Executes gen2-migration CLI commands (lock, generate, refactor)
 * from the amplify-cli package to migrate Gen1 apps to Gen2.
 */

import execa from 'execa';
import os from 'os';
import { ILogger } from '../interfaces';
import { LogContext } from '../types';
import { getCLIPath } from '@aws-amplify/amplify-e2e-core';

/**
 * Available gen2-migration steps
 */
export type Gen2MigrationStep = 'lock' | 'generate' | 'refactor';

/**
 * Options for Gen2MigrationExecutor
 */
export interface Gen2MigrationExecutorOptions {
  /** AWS profile to use for CLI commands */
  profile?: string;
}

/**
 * Executor for gen2-migration CLI commands.
 *
 * The migration workflow consists of:
 * 1. lock - Lock the Gen1 environment to prevent updates during migration
 * 2. generate - Generate Gen2 code from Gen1 configuration
 * 3. refactor - Move stateful resources from Gen1 to Gen2 stacks
 */
export class Gen2MigrationExecutor {
  private readonly amplifyPath: string;
  private readonly profile?: string;

  constructor(private readonly logger: ILogger, options?: Gen2MigrationExecutorOptions) {
    this.amplifyPath = getCLIPath(true);
    this.profile = options?.profile;
  }

  /**
   * Execute a gen2-migration step. Throws on failure.
   */
  private async executeStep(step: Gen2MigrationStep, appPath: string, extraArgs: string[] = []): Promise<void> {
    const context: LogContext = { operation: `gen2-migration-${step}` };

    this.logger.info(`Executing gen2-migration ${step}...`, context);
    this.logger.debug(`App path: ${appPath}`, context);
    this.logger.debug(`Using amplify CLI at: ${this.amplifyPath}`, context);

    const args = ['gen2-migration', step, '--yes', ...extraArgs];
    this.logger.debug(`Command: ${this.amplifyPath} ${args.join(' ')}`, context);

    const startTime = Date.now();

    // Set AWS_PROFILE env var if profile is specified
    const env = this.profile ? { ...process.env, AWS_PROFILE: this.profile } : undefined;

    const result = await execa(this.amplifyPath, args, {
      cwd: appPath,
      reject: false,
      env,
      all: true, // Combine stdout and stderr
    });

    const durationMs = Date.now() - startTime;
    const combinedOutput = result.all ?? `${result.stdout}\n${result.stderr}`;

    // Always log output for debugging
    if (combinedOutput.trim()) {
      const outputLines = combinedOutput.split('\n');
      const lastLines = outputLines.slice(-100).join('\n');
      this.logger.info(`gen2-migration ${step} output:\n${lastLines}`, context);
    }

    // Check for command not found - CLI returns exit code 0 but prints help
    const commandNotFound = this.checkForCommandNotFound(combinedOutput);
    if (commandNotFound) {
      this.logger.error(`gen2-migration ${step} command not recognized by CLI`, undefined, context);
      throw new Error(`gen2-migration ${step} failed: command not found. Ensure you are using the correct amplify CLI version.`);
    }

    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || `Exit code ${result.exitCode}`;
      this.logger.error(`gen2-migration ${step} failed: ${errorMessage}`, undefined, context);
      throw new Error(`gen2-migration ${step} failed: ${errorMessage}`);
    }

    this.logger.info(`gen2-migration ${step} completed (${durationMs}ms)`, context);
  }

  /**
   * Check if the CLI output indicates the command was not found.
   * The CLI returns exit code 0 but prints a warning when command is not recognized.
   */
  private checkForCommandNotFound(output: string): boolean {
    return output.includes('The Amplify CLI can NOT find command');
  }

  /**
   * Lock the Gen1 environment.
   *
   * Enables deletion protection on DynamoDB tables, sets a deny-all stack policy,
   * and adds GEN2_MIGRATION_ENVIRONMENT_NAME env var to the Amplify app.
   */
  public async lock(appPath: string): Promise<void> {
    await this.executeStep('lock', appPath);
  }

  /**
   * Generate Gen2 code from Gen1 configuration.
   *
   * Creates/updates package.json with Gen2 dependencies, replaces the amplify
   * folder with Gen2 TypeScript definitions, and installs dependencies.
   */
  public async generate(appPath: string): Promise<void> {
    await this.executeStep('generate', appPath);
  }

  /**
   * Move stateful resources from Gen1 to Gen2 stacks.
   *
   * Requires Gen2 deployment to be complete before running.
   */
  public async refactor(appPath: string, gen2StackName: string): Promise<void> {
    await this.executeStep('refactor', appPath, ['--to', gen2StackName]);
  }

  /**
   * Run pre-deployment workflow: lock -> checkout gen2 branch -> generate
   */
  public async runPreDeploymentWorkflow(appPath: string, envName = 'main'): Promise<void> {
    const context: LogContext = { operation: 'gen2-migration-workflow' };
    this.logger.info('Starting pre-deployment workflow (lock -> checkout -> generate)...', context);

    // Lock on the main branch
    await this.lock(appPath);

    // Create and checkout gen2 branch before generate
    const gen2BranchName = `gen2-${envName}`;
    this.logger.info(`Creating and checking out branch '${gen2BranchName}'...`, context);
    await execa('git', ['checkout', '-b', gen2BranchName], { cwd: appPath });

    // Generate Gen2 code
    await this.generate(appPath);

    this.logger.info('Pre-deployment workflow completed', context);
  }

  /**
   * Deploy Gen2 app using ampx sandbox.
   *
   * Runs `npx ampx sandbox --once` to do a single non-interactive deployment.
   * Returns the Gen2 root stack name by querying CloudFormation.
   *
   * @param appPath - Path to the app directory
   * @param deploymentName - Unique deployment name for stack identification
   * @param branchName - Branch name to set as AWS_BRANCH env var for unique resource naming
   */
  public async deployGen2Sandbox(appPath: string, deploymentName: string, branchName: string): Promise<string> {
    const context: LogContext = { operation: 'gen2-sandbox-deploy' };

    this.logger.info('Deploying Gen2 app using ampx sandbox...', context);
    this.logger.debug(`App path: ${appPath}`, context);
    this.logger.debug(`Branch name (AWS_BRANCH): ${branchName}`, context);

    const startTime = Date.now();

    // Set AWS_PROFILE and AWS_BRANCH env vars
    // AWS_BRANCH ensures unique Lambda function names across sandbox deployments
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      AWS_BRANCH: branchName,
      ...(this.profile && { AWS_PROFILE: this.profile }),
    };

    const result = await execa('npx', ['ampx', 'sandbox', '--once'], {
      cwd: appPath,
      reject: false,
      env,
      all: true, // Combine stdout and stderr into result.all
    });

    const durationMs = Date.now() - startTime;

    // Use result.all if available (combined output), otherwise combine manually
    const combinedOutput = result.all ?? `${result.stdout}\n${result.stderr}`;

    // Check for errors in output (ampx sandbox may return exit code 0 even on failure)
    const hasError = this.checkForAmpxErrors(combinedOutput);

    if (result.exitCode !== 0 || hasError) {
      this.logAmpxOutput(combinedOutput, context);
      const errorMessage = hasError ? 'ampx sandbox failed (found [ERROR] in output)' : `Exit code ${result.exitCode}`;
      throw new Error(`ampx sandbox failed: ${errorMessage}`);
    }

    this.logger.info(`ampx sandbox completed (${durationMs}ms)`, context);

    // Find the Gen2 root stack by querying CloudFormation
    // Pattern: amplify-<app-name>-<username>-sandbox-<hash>
    const username = os.userInfo().username;
    const stackPrefix = `amplify-${deploymentName}-${username}-sandbox`;

    const gen2StackName = await this.findGen2RootStack(stackPrefix);
    this.logger.info(`Gen2 stack name: ${gen2StackName}`, context);

    return gen2StackName;
  }

  /**
   * Check ampx output for error indicators.
   * ampx sandbox may return exit code 0 even on failure, so we check the output.
   */
  private checkForAmpxErrors(output: string): boolean {
    // Check for [ERROR] pattern (with or without timestamp prefix)
    return output.includes('[ERROR]');
  }

  /**
   * Log the last 40 lines of ampx output for debugging.
   */
  private logAmpxOutput(output: string, context: LogContext): void {
    const outputLines = output.split('\n');
    const last40Lines = outputLines.slice(-40).join('\n');
    this.logger.error(`ampx sandbox output (last 40 lines):\n${last40Lines}`, undefined, context);
  }

  /**
   * Find the Gen2 root stack by prefix using AWS CLI.
   */
  private async findGen2RootStack(stackPrefix: string): Promise<string> {
    const context: LogContext = { operation: 'find-gen2-stack' };

    this.logger.debug(`Looking for stack with prefix: ${stackPrefix}`, context);

    const env = this.profile ? { ...process.env, AWS_PROFILE: this.profile } : undefined;

    const result = await execa(
      'aws',
      [
        'cloudformation',
        'list-stacks',
        '--stack-status-filter',
        'CREATE_COMPLETE',
        'UPDATE_COMPLETE',
        '--query',
        `StackSummaries[?starts_with(StackName, '${stackPrefix}')].StackName`,
        '--output',
        'text',
      ],
      { reject: false, env },
    );

    if (result.exitCode !== 0) {
      throw new Error(`Failed to list CloudFormation stacks: ${result.stderr || result.stdout}`);
    }

    const stacks = result.stdout
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0);

    // Find root stacks (those without nested stack suffixes like -auth, -data, -storage)
    const rootStacks = stacks.filter((name) => {
      const suffix = name.replace(stackPrefix, '');
      // Root stack has pattern: -<hash> (10 char hex)
      // Nested stacks have pattern: -<hash>-<category><hash>-<random>
      return /^-[a-f0-9]+$/.test(suffix);
    });

    if (rootStacks.length === 0) {
      throw new Error(`No Gen2 sandbox stack found with prefix: ${stackPrefix}`);
    }

    // Return the most recently created (should only be one)
    return rootStacks[0];
  }
}
