/**
 * Gen2 Migration Executor
 *
 * Executes gen2-migration CLI commands (lock, generate, refactor, decommission)
 * from the amplify-cli package to migrate Gen1 apps to Gen2.
 */

import execa from 'execa';
import fs from 'fs';
import { ILogger } from '../interfaces';
import { LogContext } from '../types';

/**
 * Available gen2-migration steps
 */
export type Gen2MigrationStep = 'lock' | 'generate' | 'refactor' | 'decommission';

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
 * 4. decommission - Delete the Gen1 environment post-migration
 */
export class Gen2MigrationExecutor {
  private readonly amplifyPath: string;
  private readonly profile?: string;

  constructor(private readonly logger: ILogger, options?: Gen2MigrationExecutorOptions) {
    this.amplifyPath = this.getAmplifyCliPath();
    this.profile = options?.profile;
  }

  /**
   * Execute a gen2-migration step. Throws on failure.
   */
  private async executeStep(step: Gen2MigrationStep, appPath: string): Promise<void> {
    const context: LogContext = { operation: `gen2-migration-${step}` };

    this.logger.info(`Executing gen2-migration ${step}...`, context);
    this.logger.debug(`App path: ${appPath}`, context);
    this.logger.debug(`Using amplify CLI at: ${this.amplifyPath}`, context);

    const args = ['gen2-migration', step, '--yes'];
    this.logger.debug(`Command: ${this.amplifyPath} ${args.join(' ')}`, context);

    const startTime = Date.now();

    // Set AWS_PROFILE env var if profile is specified
    const env = this.profile ? { ...process.env, AWS_PROFILE: this.profile } : undefined;

    const result = await execa(this.amplifyPath, args, {
      cwd: appPath,
      reject: false,
      env,
    });

    const durationMs = Date.now() - startTime;

    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || `Exit code ${result.exitCode}`;
      this.logger.error(`gen2-migration ${step} failed: ${errorMessage}`, undefined, context);
      throw new Error(`gen2-migration ${step} failed: ${errorMessage}`);
    }

    this.logger.info(`gen2-migration ${step} completed (${durationMs}ms)`, context);
  }

  /**
   * Lock the Gen1 environment.
   *
   * Enables deletion protection on DynamoDB tables, sets a deny-all stack policy,
   * and adds GEN2_MIGRATION_ENVIRONMENT_NAME env var to the Amplify app.
   */
  async lock(appPath: string): Promise<void> {
    await this.executeStep('lock', appPath);
  }

  /**
   * Generate Gen2 code from Gen1 configuration.
   *
   * Creates/updates package.json with Gen2 dependencies, replaces the amplify
   * folder with Gen2 TypeScript definitions, and installs dependencies.
   */
  async generate(appPath: string): Promise<void> {
    await this.executeStep('generate', appPath);
  }

  /**
   * Move stateful resources from Gen1 to Gen2 stacks.
   *
   * Requires Gen2 deployment to be complete before running.
   */
  async refactor(appPath: string): Promise<void> {
    await this.executeStep('refactor', appPath);
  }

  /**
   * Delete the Gen1 environment.
   *
   * Should only be run after successful refactor.
   */
  async decommission(appPath: string): Promise<void> {
    await this.executeStep('decommission', appPath);
  }

  /**
   * Run pre-deployment workflow: lock -> checkout gen2 branch -> generate
   */
  async runPreDeploymentWorkflow(appPath: string, envName = 'main'): Promise<void> {
    const context: LogContext = { operation: 'gen2-migration-workflow' };
    this.logger.info('Starting pre-deployment workflow (lock -> checkout -> generate)...', context);

    // Step 1: Lock on the main branch
    await this.lock(appPath);

    // Step 2: Create and checkout gen2 branch before generate
    const gen2BranchName = `gen2-${envName}`;
    this.logger.info(`Creating and checking out branch '${gen2BranchName}'...`, context);
    await execa('git', ['checkout', '-b', gen2BranchName], { cwd: appPath });

    // Step 3: Generate Gen2 code
    await this.generate(appPath);

    this.logger.info('Pre-deployment workflow completed', context);
  }

  /**
   * Run post-deployment workflow: refactor -> decommission
   */
  async runPostDeploymentWorkflow(appPath: string): Promise<void> {
    const context: LogContext = { operation: 'gen2-migration-workflow' };
    this.logger.info('Starting post-deployment workflow (refactor -> decommission)...', context);

    await this.refactor(appPath);
    await this.decommission(appPath);

    this.logger.info('Post-deployment workflow completed', context);
  }

  private getAmplifyCliPath(): string {
    const amplifyPath = process.env.AMPLIFY_PATH;
    if (amplifyPath && fs.existsSync(amplifyPath)) {
      return amplifyPath;
    }
    return process.platform === 'win32' ? 'amplify.exe' : 'amplify';
  }
}
