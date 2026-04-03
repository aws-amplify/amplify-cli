#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * CLI entry point for the Amplify Migration System
 */

// eslint-disable-next-line spellcheck/spell-checker
import * as yargs from 'yargs';
import chalk from 'chalk';
import { Logger, LogLevel } from './utils/logger';
import { AmplifyInitializer } from './core/amplify-initializer';
import { Gen2MigrationExecutor } from './core/gen2-migration-executor';
import execa from 'execa';
import path from 'path';
import os from 'os';
import fs from 'fs';
import * as fsExtra from 'fs-extra';
import { getCLIPath } from '@aws-amplify/amplify-e2e-core';
import * as git from './utils/git';

// Initialize core components
const logger = new Logger(LogLevel.INFO);
const amplifyInitializer = new AmplifyInitializer(logger);
const gen2MigrationExecutor = new Gen2MigrationExecutor(logger);

// Default migration target directory
const MIGRATION_TARGET_DIR = path.join(os.tmpdir(), 'amplify-gen2-migration-e2e-system', 'output-apps');

async function main(): Promise<void> {
  try {
    // eslint-disable-next-line spellcheck/spell-checker
    const argv = await yargs
      .scriptName('amplify-migrate')
      .usage('$0 [options]')
      .option('app', {
        alias: 'a',
        type: 'string',
        description: 'App to migrate (e.g., project-boards)',
        string: true,
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Enable verbose logging',
        default: false,
      })
      .option('profile', {
        type: 'string',
        description: 'AWS profile to use',
        string: true,
      })
      .help()
      .alias('help', 'h')
      .version()
      .alias('version', 'V')
      .example('$0 -a project-boards', 'Migrate specific app').argv;

    // Set log level based on verbose flag
    if (argv.verbose) {
      logger.setLogLevel(LogLevel.DEBUG);
    }

    // Print banner
    printBanner();

    // Validate required options for migration
    if (!argv.app) {
      logger.error('Error: --app is required for migration');
      process.exit(1);
    }

    if (!argv.profile) {
      throw new Error('--profile must be specified');
    }

    // Select apps to process
    const appPath = path.join(__dirname, '..', '..', '..', 'amplify-migration-apps', argv.app);
    if (!fsExtra.existsSync(appPath)) {
      throw new Error(`App not found: ${appPath}`);
    }
    const selectedApp = argv.app;
    const deploymentName = generateTimeBasedE2EAmplifyAppName(selectedApp);

    logger.setAppName(deploymentName);

    // Get appropriate credentials based on environment
    const profile = argv.profile;

    // Generate envName if not provided via CLI
    const envName = AmplifyInitializer.generateRandomEnvName();
    logger.info(`Using Amplify environment name: ${envName}`);

    // Enable file logging
    const logDir = path.join(os.tmpdir(), 'amplify-gen2-migration-e2e-system', 'logs');
    const logFile = path.join(logDir, `${deploymentName}.log`);

    logger.setLogFilePath(logFile);

    // Initialize app
    await initializeAppFromCLI({
      appName: selectedApp,
      sourceAppPath: appPath,
      deploymentName,
      envName,
      profile,
    });
  } catch (error) {
    logger.error('Migration failed', error as Error);
    process.exit(1);
  }
}

function printBanner(): void {
  console.log(
    chalk.cyan(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║           AWS Amplify Gen1 to Gen2 Migration E2E                     ║
║                                                                      ║
║  Automation for migrating Amplify applications from Gen1 to Gen2     ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`),
  );
}

/**
 * Generates a time-based Amplify app name with optional app name suffix.
 * Format: [last8alphanumeric][YYMMDDHHMMSS] (20 chars for Amplify compatibility)
 * CDK resource names (based off of amplify app name) must start with an alphabetic character.
 * @param appName Optional app name from which to extract last 8 alphanumeric characters
 * @returns A unique, sortable app name starting with a letter (max 20 chars)
 */
export const generateTimeBasedE2EAmplifyAppName = (appName: string): string => {
  const now = new Date();

  // Format: YYMMDDHHMMSSMM (human-readable, sortable) - 14 chars
  const timestamp = [
    String(now.getFullYear()).slice(-2), // YY
    String(now.getMonth() + 1).padStart(2, '0'), // MM
    String(now.getDate()).padStart(2, '0'), // DD
    String(now.getHours()).padStart(2, '0'), // HH
    String(now.getMinutes()).padStart(2, '0'), // MM
  ].join('');

  // Extract last 8 alphanumeric characters from appName if provided
  // Total: 10 (prefix) + 10 (timestamp) = 20 chars (at 20 char limit)
  const alphanumericOnly = appName.replace(/[^a-zA-Z0-9]/g, '');
  const prefix = alphanumericOnly.slice(0, 10).toLowerCase();
  // Ensure prefix starts with a letter to avoid CDK resource naming issues
  const safePrefix = /^[a-z]/.test(prefix) ? prefix : `e${prefix.slice(1)}`;
  return `${safePrefix}${timestamp}`;
};

async function runGen1TestScript(targetAppPath: string): Promise<void> {
  await runAppScript(targetAppPath, 'frontest.ts', [path.join('src', 'amplifyconfiguration.json')]);
}

async function runGen2TestScript(targetAppPath: string): Promise<void> {
  await runAppScript(targetAppPath, 'frontest.ts', ['amplify_outputs.json']);
}

async function runAppScript(targetAppPath: string, scriptPath: string, args: string[]): Promise<void> {
  const testScriptPath = path.join(targetAppPath, scriptPath);

  logger.info(`Running ${scriptPath} in ${targetAppPath} with args: ${args.join(' ')}`);
  const result = await execa('npx', ['tsx', scriptPath, ...args], {
    cwd: targetAppPath,
    stdio: 'inherit',
    reject: false,
    env: { ...process.env, AWS_SDK_LOAD_CONFIG: '1' },
  });

  if (result.exitCode !== 0) {
    throw new Error(`${testScriptPath} failed with exit code ${result.exitCode}`);
  }
}

/**
 * Spawn the amplify CLI directly to run amplify push --yes.
 *
 * Uses AMPLIFY_PATH env var if set, otherwise
 * falls back to the amplify CLI built in the monorepo, then amplify in PATH.
 */
async function amplifyPush(targetAppPath: string): Promise<void> {
  const amplifyPath = getCLIPath(true);
  logger.debug(`Using amplify CLI at: ${amplifyPath}`);
  const originalCwd = process.cwd();

  process.chdir(targetAppPath);
  try {
    const result = await execa(amplifyPath, ['push', '--yes', '--debug'], {
      cwd: targetAppPath,
    });

    if (result.exitCode !== 0) {
      throw new Error(`amplify push failed with exit code ${result.exitCode}`);
    }
  } finally {
    process.chdir(originalCwd);
  }
}

async function amplifyStatus(targetAppPath: string): Promise<void> {
  const amplifyPath = getCLIPath(true);
  logger.debug(`Using amplify CLI at: ${amplifyPath}`);
  const originalCwd = process.cwd();

  process.chdir(targetAppPath);
  try {
    const result = await execa(amplifyPath, ['status'], {
      cwd: targetAppPath,
      stdio: 'inherit',
    });

    if (result.exitCode !== 0) {
      throw new Error(`amplify status failed with exit code ${result.exitCode}`);
    }
  } finally {
    process.chdir(originalCwd);
  }
}

export interface InitializeAppFromCLIParams {
  appName: string;
  sourceAppPath: string;
  deploymentName: string;
  envName: string;
  profile: string;
}

/**
 * Initialize a single app.
 * Copies the source directory to the migration target, runs amplify init,
 * initializes categories, pushes, runs test scripts, and executes the
 * full gen2-migration workflow.
 */
async function initializeAppFromCLI(params: InitializeAppFromCLIParams): Promise<void> {
  const { appName, sourceAppPath, deploymentName, envName, profile } = params;
  logger.info(`Starting initialization for ${appName} with deployment name: ${deploymentName}`);

  logger.debug(`Source app path: ${sourceAppPath}`);

  try {
    // Create target directory and copy source
    const targetAppPath = path.join(MIGRATION_TARGET_DIR, deploymentName);
    logger.info(`Copying source directory to target...`);
    fsExtra.mkdirSync(targetAppPath);
    fsExtra.copySync(sourceAppPath, targetAppPath, {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      filter: (src: string, _dst: string) => !src.includes('_snapshot') && !src.includes('node_modules'),
    });

    // Update package.json name to use deploymentName for predictable Gen2 stack naming
    const packageJsonPath = path.join(targetAppPath, 'package.json');
    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8')) as { name: string };
    packageJson.name = deploymentName;
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
    logger.debug(`Updated package.json name to ${deploymentName}`);

    logger.info(`Running amplify init in ${targetAppPath}`);

    // Amplify init
    logger.debug(`Using AWS profile '${profile}' for Amplify initialization`);
    await amplifyInitializer.initializeApp({
      appPath: targetAppPath,
      deploymentName,
      envName,
      profile,
    });

    logger.info('Configuring categories');
    await configure(sourceAppPath, targetAppPath);
    logger.info('Finished configuring categories');

    await git.init(targetAppPath);
    await git.commit(targetAppPath, 'feat: gen1 initial commit');

    logger.info('Installing dependencies...');
    await execa('npm', ['install'], { cwd: targetAppPath });
    logger.info('Finished installing dependencies');

    await amplifyStatus(targetAppPath);

    logger.info(`Pushing ${deploymentName} to AWS...`);
    await amplifyPush(targetAppPath);
    logger.info(`Successfully pushed ${deploymentName} to AWS`);

    await git.commit(targetAppPath, 'feat: post push');

    await runGen1TestScript(targetAppPath);

    const gen2BranchName = `gen2-${envName}`;

    await gen2MigrationExecutor.assess(targetAppPath);
    await gen2MigrationExecutor.lock(targetAppPath);
    await git.checkout(targetAppPath, gen2BranchName, true);

    await gen2MigrationExecutor.generate(targetAppPath);
    await runAppScript(targetAppPath, path.join('migration', 'post-generate.ts'), [targetAppPath]);
    await git.commit(targetAppPath, 'feat: gen2 migration generate');

    const gen2StackName = await gen2MigrationExecutor.deployGen2Sandbox(targetAppPath, deploymentName, gen2BranchName);
    await runGen1TestScript(targetAppPath);
    await runGen2TestScript(targetAppPath);

    await git.checkout(targetAppPath, 'main', false);
    await gen2MigrationExecutor.refactor(targetAppPath, gen2StackName);
    await runGen1TestScript(targetAppPath);
    await runGen2TestScript(targetAppPath);

    await git.checkout(targetAppPath, gen2BranchName, false);
    await runAppScript(targetAppPath, path.join('migration', 'post-refactor.ts'), [targetAppPath]);
    await git.commit(targetAppPath, 'fix: post-refactor edits');

    await gen2MigrationExecutor.deployGen2Sandbox(targetAppPath, deploymentName, gen2BranchName);
    await runGen1TestScript(targetAppPath);
    await runGen2TestScript(targetAppPath);

    logger.info(`App ${deploymentName} fully initialized and migrated at ${targetAppPath}`);
  } catch (error) {
    logger.error(`Failed to initialize ${appName}`, error as Error);
    throw error;
  }
}

async function configure(sourceAppPath: string, targetAppPath: string): Promise<void> {
  const restore = (p: string): void => {
    fsExtra.removeSync(path.join(targetAppPath, 'amplify', p));
    fsExtra.copySync(path.join(targetAppPath, '.amplify.init', p), path.join(targetAppPath, 'amplify', p));
  };

  const metaPath = path.join(targetAppPath, 'amplify', 'backend', 'amplify-meta.json');
  const oldMeta = JSON.parse(fsExtra.readFileSync(metaPath, { encoding: 'utf-8' }));

  fsExtra.moveSync(path.join(targetAppPath, 'amplify'), path.join(targetAppPath, '.amplify.init'));
  fsExtra.copySync(path.join(sourceAppPath, '_snapshot.pre.generate', 'amplify'), path.join(targetAppPath, 'amplify'));

  restore(path.join('#current-cloud-backend'));
  restore(path.join('.config'));
  restore(path.join('team-provider-info.json'));

  const newMeta = JSON.parse(fsExtra.readFileSync(metaPath, { encoding: 'utf-8' }));

  newMeta.providers['awscloudformation'] = oldMeta.providers['awscloudformation'];

  fsExtra.writeFileSync(metaPath, JSON.stringify(newMeta, null, 2));
  fsExtra.removeSync(path.join(targetAppPath, '.amplify.init'));
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason as Error);
  process.exit(1);
});

// Run the CLI
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.error(chalk.red('Fatal error:'), error.message);
    process.exit(1);
  });
}
