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
import { DirectoryManager } from './utils/directory-manager';
import { CDKAtmosphereIntegration } from './core/cdk-atmosphere-integration';
import { LogLevel, CLIOptions, AppConfiguration, EnvironmentType, InitializeAppFromCLIParams } from './types';
import { generateTimeBasedE2EAmplifyAppName } from './utils/math';
import path from 'path';

// Initialize core components
const logger = new Logger(LogLevel.INFO);
const fileManager = new FileManager(logger);
const configurationLoader = new ConfigurationLoader(logger, fileManager);
const environmentDetector = new EnvironmentDetector(logger);
const appSelector = new AppSelector(logger, fileManager);
const amplifyInitializer = new AmplifyInitializer(logger);
const directoryManager = new DirectoryManager(logger);
const cdkAtmosphereIntegration = new CDKAtmosphereIntegration(logger, environmentDetector);

// Default migration target directory
const MIGRATION_TARGET_DIR = './migration-output';

async function main(): Promise<void> {
  try {
    // eslint-disable-next-line spellcheck/spell-checker
    const argv = await yargs
      .scriptName('amplify-migrate')
      .usage('$0 [options]')
      .option('app', {
        alias: 'a',
        type: 'string',
        description: 'App to migrate (e.g., app-2)',
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
      .example('$0 -a app-2', 'Migrate specific app')
      .example('$0 --dry-run', 'Show what would be done')
      .example('$0 --list-apps', 'List all available apps').argv;

    // Set log level based on verbose flag
    if (argv.verbose) {
      logger.setLogLevel(LogLevel.DEBUG);
    }

    // Enable file logging
    const logDir = './logs';
    const logFile = `${logDir}/amplify-migration-${new Date().toISOString().split('T')[0]}.log`;
    logger.enableFileLogging(logFile);

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
    logger.info('Detecting execution environment...');
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

    logger.info(`Environment: ${environment}`);
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
      profile = options.profile!;
    }

    // Select apps to process
    logger.info('Selecting apps for migration...');
    const selectedApp = await appSelector.selectApp(options);
    logger.info(`Selected app: ${selectedApp}`);

    // Load configuration for selected app
    logger.info('Loading app configuration...');

    let config: AppConfiguration | undefined;

    try {
      config = await configurationLoader.loadAppConfiguration(selectedApp);
      logger.info(`Loaded configuration for ${selectedApp}`);
    } catch (error) {
      logger.error(`Failed to load configuration for ${selectedApp}`, error as Error);
      if (!options.dryRun) {
        throw error;
      } else {
        logger.info('Dry run mode - showing what would be done:');
        await showDryRunSummary(selectedApp, config);
        return;
      }
    }

    // Initialize apps sequentially
    logger.info('Starting app initialization...');
    const migrationTargetPath = path.resolve(process.cwd(), MIGRATION_TARGET_DIR);

    try {
      await initializeAppFromCLI({ appName: selectedApp, config, migrationTargetPath, envName: options.envName, profile });
      logger.info('App initialization completed successfully');
      logger.info('Stopping before category processing as per current implementation scope');
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
 * Initialize a single app
 * Copies the source directory to the migration target and runs amplify init
 */
async function initializeAppFromCLI(params: InitializeAppFromCLIParams): Promise<void> {
  const { appName, config, migrationTargetPath, envName, profile } = params;
  const context = { appName, operation: 'initializeApp' };

  // Generate a unique deployment name for this initialization
  const deploymentName = generateTimeBasedE2EAmplifyAppName(appName);
  logger.info(`Starting initialization for ${appName} with deployment name: ${deploymentName}`, context);

  // Get source app path
  const sourceAppPath = appSelector.getAppPath(appName);
  logger.debug(`Source app path: ${sourceAppPath}`, context);

  // Use the generated deployment name for the target directory
  const targetAppPath = `${migrationTargetPath}/${deploymentName}`;

  logger.debug(`Target app path: ${targetAppPath}`, context);
  logger.debug(`Config app name: ${config.app.name}`, context);

  try {
    // Create the target directory with conflict resolution
    const targetAppPath = await directoryManager.createAppDirectory({
      basePath: migrationTargetPath,
      appName: deploymentName,
    });

    // Copy source directory to target
    logger.info(`Copying source directory to target...`, context);
    await directoryManager.copyDirectory(sourceAppPath, targetAppPath);

    // Run amplify init in the copied directory
    logger.info(`Running amplify init in ${targetAppPath}`, context);

    // Use profile-based initialization (works for both atmosphere and local environments)
    logger.info(`Using AWS profile '${profile}' for Amplify initialization`, context);
    await amplifyInitializer.initializeApp({
      appPath: targetAppPath,
      config,
      deploymentName,
      envName,
      profile,
    });
  } catch (error) {
    logger.error(`Failed to initialize ${appName}`, error as Error, context);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason as Error);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.error(chalk.red('Fatal error:'), error.message);
    process.exit(1);
  });
}
