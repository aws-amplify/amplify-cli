#!/usr/bin/env node

/**
 * CLI entry point for the Amplify Migration System
 */

// eslint-disable-next-line spellcheck/spell-checker
import * as yargs from 'yargs';
import chalk from 'chalk';
import { Logger } from './utils/logger';
import { FileManager } from './utils/file-manager';
import { ConfigurationLoader } from './core/configuration-loader';
import { EnvironmentDetector } from './core/environment-detector';
import { AppSelector } from './core/app-selector';
import { AmplifyInitializer } from './core/amplify-initializer';
import { CategoryInitializer } from './core/category-initializer';
import { DirectoryManager } from './utils/directory-manager';
import { CDKAtmosphereIntegration } from './core/cdk-atmosphere-integration';
import { Gen2MigrationExecutor } from './core/gen2-migration-executor';
import execa from 'execa';
import { LogLevel, CLIOptions, AppConfiguration, EnvironmentType, InitializeAppFromCLIParams } from './types';
import { generateTimeBasedE2EAmplifyAppName } from './utils/math';
import path from 'path';
import os from 'os';
import fs from 'fs';
import * as fsExtra from 'fs-extra';
import { getCLIPath } from '@aws-amplify/amplify-e2e-core';
import * as fsExtra from 'fs-extra';

/** Options passed to app-specific post-generate scripts */
interface PostGenerateOptions {
  appPath: string;
  envName?: string;
}

/** Options passed to app-specific post-refactor scripts */
interface PostRefactorOptions {
  appPath: string;
  envName?: string;
}

/** Shape of an app's post-generate module */
interface PostGenerateModule {
  postGenerate: (options: PostGenerateOptions) => Promise<void>;
}

/** Shape of an app's post-refactor module */
interface PostRefactorModule {
  postRefactor: (options: PostRefactorOptions) => Promise<void>;
}

// Initialize core components
const logger = new Logger(LogLevel.INFO);
const fileManager = new FileManager(logger);
const configurationLoader = new ConfigurationLoader(logger, fileManager);
const environmentDetector = new EnvironmentDetector(logger);
const appSelector = new AppSelector(logger, fileManager);
const amplifyInitializer = new AmplifyInitializer(logger);
const categoryInitializer = new CategoryInitializer(logger);
const directoryManager = new DirectoryManager(logger);
const cdkAtmosphereIntegration = new CDKAtmosphereIntegration(logger, environmentDetector);
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
      .option('dry-run', {
        alias: 'd',
        type: 'boolean',
        description: 'Show what would be done without executing',
        default: false,
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
      .option('atmosphere', {
        type: 'boolean',
        description: 'Use atmosphere credentials in execution environment',
      })
      .option('envName', {
        type: 'string',
        description: 'Amplify env name to create',
        string: true,
      })
      .option('list-apps', {
        alias: 'l',
        type: 'boolean',
        description: 'List available apps and exit',
        default: false,
      })
      .help()
      .alias('help', 'h')
      .version()
      .alias('version', 'V')
      .example('$0 -a project-boards', 'Migrate specific app')
      .example('$0 --dry-run', 'Show what would be done')
      .example('$0 --list-apps', 'List all available apps').argv;

    // Set log level based on verbose flag
    if (argv.verbose) {
      logger.setLogLevel(LogLevel.DEBUG);
    }

    // Print banner
    printBanner();

    // Handle special commands
    if (argv['list-apps']) {
      await handleListApps();
      return;
    }

    // Validate required options for migration
    if (!argv.app) {
      logger.error('Error: --app is required for migration');
      process.exit(1);
    }

    if (!argv.profile && !argv.atmosphere) {
      throw new Error('Either --profile or --atmosphere must be specified');
    }

    // Build CLI options
    const options: CLIOptions = {
      app: argv.app,
      dryRun: argv['dry-run'],
      verbose: argv.verbose,
      profile: argv.profile,
      isAtmosphere: argv.atmosphere,
      envName: argv.envName,
    };

    // Detect environment and get credentials if needed
    logger.debug('Detecting execution environment...');
    let environment;

    if (argv.profile) {
      environment = EnvironmentType.LOCAL;
    } else if (argv.atmosphere) {
      environment = EnvironmentType.ATMOSPHERE;
      const didValidateAtmosphereEnvVars = await environmentDetector.isAtmosphereEnvironment();
      if (!didValidateAtmosphereEnvVars) {
        throw Error('Atmosphere environment requested but required environment variables are not set');
      } else {
        logger.info('Atmosphere environment validated successfully');
      }
    }
    const environmentSummary = environmentDetector.getEnvironmentSummary();

    logger.debug(`Environment: ${environment}`);
    logger.debug('Environment details:', environmentSummary);

    // Get appropriate credentials based on environment
    let profile: string;
    const isAtmosphereEnv = environment === EnvironmentType.ATMOSPHERE;

    if (isAtmosphereEnv) {
      logger.info('Atmosphere environment detected - obtaining atmosphere credentials...');

      try {
        profile = await cdkAtmosphereIntegration.getProfileFromAllocation();
        logger.info(`Successfully created Atmosphere AWS profile: ${profile}`);
      } catch (atmosphereError) {
        logger.error(`Failed to get atmosphere credentials: ${(atmosphereError as Error).message}`);
        logger.error('Cannot proceed without atmosphere credentials in atmosphere environment');
        throw new Error(`Atmosphere environment detected but credentials unavailable: ${(atmosphereError as Error).message}`);
      }
    } else {
      logger.info(`Local environment detected - will use local AWS profile: ${options.profile} for credentials`);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      profile = options.profile!;
    }

    // Select apps to process
    logger.debug('Selecting apps for migration...');
    const selectedApp = await appSelector.selectApp(options);
    const deploymentName = generateTimeBasedE2EAmplifyAppName(selectedApp);

    // Generate envName if not provided via CLI
    const envName = options.envName ?? AmplifyInitializer.generateRandomEnvName();
    logger.info(`Using Amplify environment name: ${envName}`);

    // Enable file logging
    const logDir = path.join(os.tmpdir(), 'amplify-gen2-migration-e2e-system', 'logs');
    const logFile = path.join(logDir, `${deploymentName}.log`);

    logger.setLogFilePath(logFile);

    // Load configuration for selected app
    logger.debug('Loading app configuration...');

    let config: AppConfiguration | undefined;

    try {
      config = await configurationLoader.loadAppConfiguration(selectedApp);
    } catch (error) {
      logger.error(`Failed to load configuration for ${selectedApp}`, error as Error);
      throw error;
    }

    // Handle dry-run mode
    if (options.dryRun) {
      logger.info('Dry run mode - showing what would be done:');
      await showDryRunSummary(selectedApp, config);
      return;
    }

    // Initialize app
    const migrationTargetPath = MIGRATION_TARGET_DIR;

    try {
      await initializeAppFromCLI({ appName: selectedApp, deploymentName, config, migrationTargetPath, envName, profile });
    } finally {
      // Cleanup atmosphere profile if we created one
      if (isAtmosphereEnv) {
        logger.info('Cleaning up atmosphere resources...');
        try {
          await cdkAtmosphereIntegration.cleanup();
          logger.info('Successfully cleaned up atmosphere resources');
        } catch (cleanupError) {
          logger.warn(`Failed to cleanup atmosphere resources: ${(cleanupError as Error).message}`);
        }
      }
    }
  } catch (error) {
    logger.error('Migration failed', error as Error);
    process.exit(1);
  }
}

function printBanner(): void {
  console.log(
    chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           AWS Amplify Gen1 to Gen2 Migration System          ║
║                                                              ║
║  Automation for migrating Amplify applications from          ║
║           Gen1 to Gen2                                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`),
  );
}

async function handleListApps(): Promise<void> {
  logger.info('Listing available apps...');

  try {
    const availableApps = await appSelector.discoverAvailableApps();

    if (availableApps.length === 0) {
      console.log(chalk.yellow('No apps found in the apps directory'));
      return;
    }

    console.log(chalk.green(`\nFound ${availableApps.length} available apps:\n`));

    for (const appName of availableApps) {
      const appPath = appSelector.getAppPath(appName);
      console.log(`  ${chalk.cyan(appName.padEnd(10))} ${appPath}`);
    }
  } catch (error) {
    logger.error('Failed to list apps', error as Error);
    process.exit(1);
  }
}

async function showDryRunSummary(selectedApp: string, config?: AppConfiguration): Promise<void> {
  console.log(chalk.yellow('\n=== DRY RUN SUMMARY ===\n'));
  console.log('');

  console.log(chalk.cyan('Initialization Actions:'));
  console.log(`  Migration target directory: ${MIGRATION_TARGET_DIR}`);
  console.log('');
  console.log(chalk.cyan(`${selectedApp}:`));

  if (config) {
    const appConfig = config as AppConfiguration;
    const categories = Object.keys(appConfig.categories || {});
    const sourceDir = appSelector.getAppPath(selectedApp);

    console.log(`  Config app name: ${appConfig.app.name}`);
    console.log(`  Source directory: ${sourceDir}`);
    console.log(`  Would copy to: ${MIGRATION_TARGET_DIR}/<generated-deployment-name>`);
    console.log(`  Would run: amplify init with generated deployment name`);
    console.log(`  Categories: ${categories.join(', ') || 'None'}`);
  } else {
    console.log(chalk.red('  Configuration not loaded'));
  }
  console.log('');

  console.log(chalk.yellow('=== END DRY RUN SUMMARY ===\n'));
}

/**
 * Run the app-specific post-generate script if it exists.
 * Each app in amplify-migration-apps can have a post-generate.ts that applies
 * manual edits required after `amplify gen2-migration generate`.
 */
async function runPostGenerateScript(appName: string, targetAppPath: string, envName?: string): Promise<void> {
  const sourceAppPath = appSelector.getAppPath(appName);
  const postGeneratePath = path.join(sourceAppPath, 'post-generate.ts');

  if (!fs.existsSync(postGeneratePath)) {
    logger.debug(`No post-generate script found for ${appName} at ${postGeneratePath}`);
    return;
  }

  logger.info(`Running post-generate script for ${appName}...`);

  const postGenerateModule = (await import(postGeneratePath)) as PostGenerateModule;

  if (typeof postGenerateModule.postGenerate !== 'function') {
    throw new Error(`post-generate.ts for ${appName} does not export a postGenerate function`);
  }

  await postGenerateModule.postGenerate({ appPath: targetAppPath, envName });
  logger.info(`Post-generate script completed for ${appName}`);
}

/**
 * Run the app-specific post-refactor script if it exists.
 * Each app in amplify-migration-apps can have a post-refactor.ts that applies
 * manual edits required after `amplify gen2-migration refactor`.
 */
async function runPostRefactorScript(appName: string, targetAppPath: string, envName?: string): Promise<void> {
  const sourceAppPath = appSelector.getAppPath(appName);
  const postRefactorPath = path.join(sourceAppPath, 'post-refactor.ts');

  if (!fs.existsSync(postRefactorPath)) {
    logger.debug(`No post-refactor script found for ${appName} at ${postRefactorPath}`);
    return;
  }

  logger.info(`Running post-refactor script for ${appName}...`);

  const postRefactorModule = (await import(postRefactorPath)) as PostRefactorModule;

  if (typeof postRefactorModule.postRefactor !== 'function') {
    throw new Error(`post-refactor.ts for ${appName} does not export a postRefactor function`);
  }

  await postRefactorModule.postRefactor({ appPath: targetAppPath, envName });
  logger.info(`Post-refactor script completed for ${appName}`);
}

/**
 * Run the app's gen1-test-script.ts to validate the Gen1 deployment.
 *
 * Copies _test-common to the migration target directory so relative
 * imports like ../_test-common resolve, then executes the test script
 * via npx tsx from the target app directory.
 */
async function runGen1TestScript(targetAppPath: string, migrationTargetPath: string, sourceAppsBasePath: string): Promise<void> {
  const testScriptName = 'gen1-test-script.ts';

  // Copy _test-common so ../_test-common imports resolve from the target app dir
  const testCommonSource = path.join(sourceAppsBasePath, '_test-common');
  const testCommonDest = path.join(migrationTargetPath, '_test-common');
  logger.info(`Copying _test-common to ${testCommonDest}`);
  await fsExtra.copy(testCommonSource, testCommonDest, { overwrite: true });

  // Install dependencies for the test script (aws-amplify, etc.)
  logger.info(`Installing dependencies in ${targetAppPath}`);
  await execa('npm', ['install'], { cwd: targetAppPath });

  // Install dependencies for _test-common
  logger.info(`Installing _test-common dependencies in ${testCommonDest}`);
  await execa('npm', ['install'], { cwd: testCommonDest });

  logger.info(`Running ${testScriptName} in ${targetAppPath}`);
  const result = await execa('npx', ['tsx', testScriptName], {
    cwd: targetAppPath,
    reject: false,
    env: { ...process.env, AWS_SDK_LOAD_CONFIG: '1' },
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';

  // Partition stdout into test-result summary lines (INFO) and everything else (DEBUG)
  const isTestResultLine = (line: string): boolean => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('✅') ||
      trimmed.startsWith('❌') ||
      trimmed.includes('TEST SUMMARY') ||
      trimmed.includes('All tests passed') ||
      trimmed.includes('test(s) failed')
    );
  };

  for (const line of testResultLines) {
    logger.info(`[test-script] ${line.trim()}`);
  }

  if (result.exitCode !== 0) {
    // Include output in the error so it's visible even without --verbose
    const combinedOutput = [stdout, stderr].filter(Boolean).join('\n');
    throw new Error(`${testScriptName} failed with exit code ${result.exitCode}\n${combinedOutput}`);
  }

  logger.info(`${testScriptName} completed successfully`);
}

/**
 * Run the app's gen2-test-script.ts to validate the Gen2 deployment.
 *
 * Same pattern as runGen1TestScript but runs gen2-test-script.ts instead.
 * Copies _test-common and installs deps before executing.
 */
async function runGen2TestScript(targetAppPath: string, migrationTargetPath: string, sourceAppsBasePath: string): Promise<void> {
  const testScriptName = 'gen2-test-script.ts';

  // Check if the gen2 test script exists
  if (!fs.existsSync(path.join(targetAppPath, testScriptName))) {
    logger.debug(`No ${testScriptName} found in ${targetAppPath}, skipping`);
    return;
  }

  // Copy _test-common so ../_test-common imports resolve from the target app dir
  const testCommonSource = path.join(sourceAppsBasePath, '_test-common');
  const testCommonDest = path.join(migrationTargetPath, '_test-common');
  logger.info(`Copying _test-common to ${testCommonDest}`);
  await fsExtra.copy(testCommonSource, testCommonDest, { overwrite: true });

  // Install dependencies for the test script
  logger.info(`Installing dependencies in ${targetAppPath}`);
  await execa('npm', ['install'], { cwd: targetAppPath });

  // Install dependencies for _test-common
  logger.info(`Installing _test-common dependencies in ${testCommonDest}`);
  await execa('npm', ['install'], { cwd: testCommonDest });

  logger.info(`Running ${testScriptName} in ${targetAppPath}`);
  const result = await execa('npx', ['tsx', testScriptName], {
    cwd: targetAppPath,
    reject: false,
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';

  if (stdout) {
    logger.debug(`[gen2-test-script] stdout:\n${stdout}`);
  }
  if (stderr) {
    logger.debug(`[gen2-test-script] stderr:\n${stderr}`);
  }

  const testResultLines = stdout.split('\n').filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('✅') ||
      trimmed.startsWith('❌') ||
      trimmed.includes('TEST SUMMARY') ||
      trimmed.includes('All tests passed') ||
      trimmed.includes('test(s) failed')
    );
  });

  for (const line of testResultLines) {
    logger.info(`[gen2-test-script] ${line.trim()}`);
  }

  if (result.exitCode !== 0) {
    const combinedOutput = [stdout, stderr].filter(Boolean).join('\n');
    throw new Error(`${testScriptName} failed with exit code ${result.exitCode}\n${combinedOutput}`);
  }

  logger.info(`${testScriptName} completed successfully`);
}

/**
 * Spawn the amplify CLI directly to run amplify push --yes.
 *
 * Uses AMPLIFY_PATH env var if set, otherwise
 * falls back to the amplify CLI built in the monorepo, then amplify in PATH.
 */
async function amplifyPush(targetAppPath: string): Promise<void> {
  const amplifyPath = getCLIPath(true);
  logger.info(`Using amplify CLI at: ${amplifyPath}`);
  const originalCwd = process.cwd();

  process.chdir(targetAppPath);
  try {
    const result = await execa(amplifyPath, ['push', '--yes', '--debug'], {
      cwd: targetAppPath,
      // stdio: 'inherit',
    });

    if (result.exitCode !== 0) {
      throw new Error(`amplify push failed with exit code ${result.exitCode}`);
    }
  } finally {
    process.chdir(originalCwd);
  }
}

/**
 * Initialize a single app.
 * Copies the source directory to the migration target, runs amplify init,
 * initializes categories, pushes, runs test scripts, and executes the
 * full gen2-migration workflow.
 */
async function initializeAppFromCLI(params: InitializeAppFromCLIParams): Promise<void> {
  const { appName, deploymentName, config, migrationTargetPath, envName, profile } = params;
  const context = { appName, operation: 'initializeApp' };

  logger.info(`Starting initialization for ${appName} with deployment name: ${deploymentName}`, context);

  const sourceAppPath = appSelector.getAppPath(appName);
  logger.debug(`Source app path: ${sourceAppPath}`, context);
  logger.debug(`Config app name: ${config.app.name}`, context);

  // Derive sourceAppsBasePath once for all test script calls
  const sourceAppsBasePath = path.dirname(sourceAppPath);

  try {
    // Create target directory and copy source
    const targetAppPath = await directoryManager.createAppDirectory({
      basePath: migrationTargetPath,
      appName: deploymentName,
    });

    logger.debug(`Copying source directory to target...`, context);
    await directoryManager.copyDirectory(sourceAppPath, targetAppPath);

    // Update package.json name to use deploymentName for predictable Gen2 stack naming
    const packageJsonPath = path.join(targetAppPath, 'package.json');
    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8')) as { name: string };
    packageJson.name = deploymentName;
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
    logger.debug(`Updated package.json name to ${deploymentName}`, context);

    logger.debug(`Running amplify init in ${targetAppPath}`, context);

    // Amplify init
    logger.debug(`Using AWS profile '${profile}' for Amplify initialization`, context);
    await amplifyInitializer.initializeApp({
      appPath: targetAppPath,
      config,
      deploymentName,
      envName,
      profile,
    });

    // Initialize categories (auth, api, storage, function, etc.)
    logger.info(`Initializing categories for ${deploymentName}...`, context);
    const categoryResult = await categoryInitializer.initializeCategories({
      appPath: targetAppPath,
      config,
      deploymentName,
    });

    if (categoryResult.initializedCategories.length > 0) {
      logger.info(`Successfully initialized categories: ${categoryResult.initializedCategories.join(', ')}`, context);
    }
    if (categoryResult.skippedCategories.length > 0) {
      logger.warn(`Skipped categories: ${categoryResult.skippedCategories.join(', ')}`, context);
    }
    if (categoryResult.errors.length > 0) {
      for (const error of categoryResult.errors) {
        logger.error(`Category '${error.category}' failed: ${error.error}`, undefined, context);
      }
      throw new Error(`Failed to initialize ${categoryResult.errors.length} category(ies)`);
    }

    // Run configure.sh if present (copies custom source files into amplify/backend/)
    const configureScriptPath = path.join(targetAppPath, 'configure.sh');
    if (fs.existsSync(configureScriptPath)) {
      logger.info(`Running configure.sh for ${deploymentName}...`, context);
      await execa('bash', ['configure.sh'], { cwd: targetAppPath });
      logger.info(`Successfully ran configure.sh for ${deploymentName}`, context);
    } else {
      logger.debug(`No configure.sh found for ${deploymentName}, skipping`, context);
    }

    // Push the initialized app to AWS
    logger.info(`Pushing ${deploymentName} to AWS...`, context);
    await amplifyPush(targetAppPath);
    logger.info(`Successfully pushed ${deploymentName} to AWS`, context);

    // Run gen1 test script to validate the Gen1 deployment
    logger.info(`Running gen1 test script (post-push) for ${deploymentName}...`, context);
    await runGen1TestScript(targetAppPath, migrationTargetPath, sourceAppsBasePath);
    logger.info(`Gen1 test script passed (post-push) for ${deploymentName}`, context);

    // Initialize git repo and commit the Gen1 state
    logger.info(`Initializing git repository for ${deploymentName}...`, context);
    await execa('git', ['init'], { cwd: targetAppPath });
    await execa('git', ['add', '.'], { cwd: targetAppPath });
    await execa('git', ['commit', '-m', 'feat: gen1 initial commit'], { cwd: targetAppPath });
    logger.info(`Git repository initialized and Gen1 state committed`, context);

    // Run gen2-migration pre-deployment workflow (lock -> checkout -> generate)
    logger.info(`Running gen2-migration pre-deployment workflow for ${deploymentName}...`, context);
    await gen2MigrationExecutor.runPreDeploymentWorkflow(targetAppPath, envName);
    logger.info(`Successfully completed gen2-migration pre-deployment workflow for ${deploymentName}`, context);

    // Run app-specific post-generate script
    await runPostGenerateScript(appName, targetAppPath, envName);

    // Commit Gen2 generated code
    logger.info(`Committing Gen2 generated code for ${deploymentName}...`, context);
    await execa('git', ['add', '.'], { cwd: targetAppPath });
    await execa('git', ['commit', '-m', 'feat: gen2 migration generate'], { cwd: targetAppPath });
    logger.info(`Gen2 generated code committed`, context);

    // Deploy Gen2 using ampx sandbox
    logger.info(`Deploying Gen2 app using ampx sandbox for ${deploymentName}...`, context);
    const gen2BranchName = `gen2-${envName}`;
    const gen2StackName = await gen2MigrationExecutor.deployGen2Sandbox(targetAppPath, deploymentName, gen2BranchName);
    logger.info(`Gen2 app deployed with stack name: ${gen2StackName}`, context);

    // Run gen2 test script to validate the Gen2 code before deploying
    logger.info(`Running gen2 test script (post-generate) for ${deploymentName}...`, context);
    await runGen2TestScript(targetAppPath, migrationTargetPath, sourceAppsBasePath);
    logger.info(`Gen2 test script passed (post-generate) for ${deploymentName}`, context);

    // Checkout back to main branch for refactor (refactor must run from Gen1 branch)
    logger.info(`Checking out main branch for refactor (refactor requires Gen1 files)...`, context);
    await execa('git', ['checkout', 'main'], { cwd: targetAppPath });

    // Run refactor to move stateful resources from Gen1 to Gen2
    logger.info(`Running gen2-migration refactor for ${deploymentName}...`, context);
    await gen2MigrationExecutor.refactor(targetAppPath, gen2StackName);
    logger.info(`Successfully completed gen2-migration refactor for ${deploymentName}`, context);

    // Run gen1 test script to validate post-refactor state
    logger.info(`Running gen1 test script (post-refactor) for ${deploymentName}...`, context);
    await runGen1TestScript(targetAppPath, migrationTargetPath, sourceAppsBasePath);
    logger.info(`Gen1 test script passed (post-refactor) for ${deploymentName}`, context);

    // Checkout back to Gen2 branch for post-refactor edits
    logger.info(`Checking out ${gen2BranchName} branch for post-refactor edits...`, context);
    await execa('git', ['checkout', gen2BranchName], { cwd: targetAppPath });

    // Run app-specific post-refactor script
    await runPostRefactorScript(appName, targetAppPath, envName);

    // Commit post-refactor changes
    logger.info(`Committing post-refactor changes for ${deploymentName}...`, context);
    await execa('git', ['add', '.'], { cwd: targetAppPath });
    await execa('git', ['commit', '-m', 'fix: post-refactor edits'], { cwd: targetAppPath });
    logger.info(`Post-refactor changes committed`, context);

    // Redeploy Gen2 to pick up post-refactor changes
    logger.info(`Redeploying Gen2 app after refactor for ${deploymentName}...`, context);
    await gen2MigrationExecutor.deployGen2Sandbox(targetAppPath, deploymentName, gen2BranchName);
    logger.info(`Gen2 app redeployed successfully`, context);

    // Run gen1 test script to validate final deployment
    logger.info(`Running gen1 test script (post-redeployment) for ${deploymentName}...`, context);
    await runGen1TestScript(targetAppPath, migrationTargetPath, sourceAppsBasePath);
    logger.info(`Gen1 test script passed (post-redeployment) for ${deploymentName}`, context);

    logger.info(`App ${deploymentName} fully initialized and migrated at ${targetAppPath}`, context);
  } catch (error) {
    logger.error(`Failed to initialize ${appName}`, error as Error, context);
    throw error;
  }
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
