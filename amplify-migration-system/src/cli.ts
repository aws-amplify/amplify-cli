#!/usr/bin/env node

/**
 * CLI entry point for the Amplify Migration System
 */

import * as yargs from 'yargs';
import chalk from 'chalk';
import { Logger } from './utils/Logger';
import { FileManager } from './utils/FileManager';
import { ConfigurationLoader } from './core/ConfigurationLoader';
import { EnvironmentDetector } from './core/EnvironmentDetector';
import { AppSelector } from './core/AppSelector';
import { LogLevel, CLIOptions } from './types';

// Initialize core components
const logger = new Logger(LogLevel.INFO);
const fileManager = new FileManager(logger);
const configurationLoader = new ConfigurationLoader(logger, fileManager);
const environmentDetector = new EnvironmentDetector(logger);
const appSelector = new AppSelector(logger, fileManager);

async function main(): Promise<void> {
  try {
    const argv = await yargs
      .scriptName('amplify-migrate')
      .usage('$0 [options]')
      .option('apps', {
        alias: 'a',
        type: 'array',
        description: 'Specific apps to migrate (e.g., app-0 app-1)',
        string: true,
      })
      .option('parallel', {
        alias: 'p',
        type: 'boolean',
        description: 'Process apps in parallel',
        default: false,
      })
      .option('dry-run', {
        alias: 'd',
        type: 'boolean',
        description: 'Show what would be done without executing',
        default: false,
      })
      .option('cleanup', {
        alias: 'c',
        type: 'boolean',
        description: 'Clean up resources after migration',
        default: false,
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Enable verbose logging',
        default: false,
      })
      .option('config', {
        type: 'string',
        description: 'Path to custom configuration file',
      })
      .option('profile', {
        type: 'string',
        description: 'AWS profile to use',
      })
      .option('region', {
        type: 'string',
        description: 'AWS region to use',
      })
      .option('list-apps', {
        alias: 'l',
        type: 'boolean',
        description: 'List available apps and exit',
        default: false,
      })
      .option('validate-apps', {
        type: 'boolean',
        description: 'Validate all apps and exit',
        default: false,
      })
      .help()
      .alias('help', 'h')
      .version()
      .alias('version', 'V')
      .example('$0', 'Migrate all available apps')
      .example('$0 -a app-0 app-1', 'Migrate specific apps')
      .example('$0 --parallel', 'Migrate all apps in parallel')
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

    if (argv['validate-apps']) {
      await handleValidateApps();
      return;
    }

    // Build CLI options
    const options: CLIOptions = {
      apps: argv.apps as string[],
      parallel: argv.parallel,
      dryRun: argv['dry-run'],
      cleanup: argv.cleanup,
      verbose: argv.verbose,
      config: argv.config,
      profile: argv.profile,
      region: argv.region,
    };

    // Detect environment
    logger.info('Detecting execution environment...');
    const environment = await environmentDetector.detectEnvironment();
    const environmentSummary = environmentDetector.getEnvironmentSummary();

    logger.info(`Environment: ${environment}`);
    logger.debug('Environment details:', environmentSummary);

    // Select apps to process
    logger.info('Selecting apps for migration...');
    const selectedApps = await appSelector.selectApps(options);

    if (selectedApps.length === 0) {
      logger.warn('No apps selected for migration');
      return;
    }

    logger.info(`Selected ${selectedApps.length} apps: ${selectedApps.join(', ')}`);

    // Load configurations for selected apps
    logger.info('Loading app configurations...');
    const configurations = new Map();

    for (const appName of selectedApps) {
      try {
        const config = await configurationLoader.loadAppConfiguration(appName);
        configurations.set(appName, config);
        logger.info(`Loaded configuration for ${appName}`);
      } catch (error) {
        logger.error(`Failed to load configuration for ${appName}`, error as Error);
        if (!options.dryRun) {
          throw error;
        }
      }
    }

    if (options.dryRun) {
      logger.info('Dry run mode - showing what would be done:');
      await showDryRunSummary(selectedApps, configurations, options);
      return;
    }

    // TODO: Implement actual migration logic
    logger.info('Migration logic not yet implemented');
    logger.info('This is the end of the current implementation');
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
║           AWS Amplify Gen1 to Gen2 Migration System         ║
║                                                              ║
║  Comprehensive automation for migrating multiple Amplify    ║
║  applications from Gen1 to Gen2 with full category support  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`),
  );
}

async function handleListApps(): Promise<void> {
  logger.info('Listing available apps...');

  try {
    const availableApps = await appSelector.discoverAvailableApps();
    const metadata = await appSelector.getAllAppMetadata();

    if (availableApps.length === 0) {
      console.log(chalk.yellow('No apps found in the apps directory'));
      return;
    }

    console.log(chalk.green(`\nFound ${availableApps.length} available apps:\n`));

    for (const appName of availableApps) {
      const appMetadata = metadata.get(appName);
      const description = (appMetadata?.description as string) || 'No description';
      const hasConfig = appMetadata?.hasConfig as boolean;
      const configStatus = hasConfig ? chalk.green('✓') : chalk.red('✗');

      console.log(`  ${chalk.cyan(appName.padEnd(10))} ${configStatus} ${description}`);
    }

    console.log(chalk.gray('\n  ✓ = Has migration config    ✗ = Missing migration config\n'));
  } catch (error) {
    logger.error('Failed to list apps', error as Error);
    process.exit(1);
  }
}

async function handleValidateApps(): Promise<void> {
  logger.info('Validating all apps...');

  try {
    const validationResults = await appSelector.validateAllApps();
    const metadata = await appSelector.getAllAppMetadata();

    console.log(chalk.green('\nApp Validation Results:\n'));

    for (const [appName, isValid] of validationResults) {
      const status = isValid ? chalk.green('✓ VALID') : chalk.red('✗ INVALID');
      const appMetadata = metadata.get(appName);
      const hasReadme = appMetadata?.hasReadme as boolean;
      const hasConfig = appMetadata?.hasConfig as boolean;

      console.log(`  ${appName.padEnd(10)} ${status}`);
      console.log(`    README: ${hasReadme ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`    Config: ${hasConfig ? chalk.green('✓') : chalk.red('✗')}`);
      console.log('');
    }
  } catch (error) {
    logger.error('Failed to validate apps', error as Error);
    process.exit(1);
  }
}

async function showDryRunSummary(selectedApps: string[], configurations: Map<string, unknown>, options: CLIOptions): Promise<void> {
  console.log(chalk.yellow('\n=== DRY RUN SUMMARY ===\n'));

  console.log(`Apps to process: ${selectedApps.length}`);
  console.log(`Processing mode: ${options.parallel ? 'Parallel' : 'Sequential'}`);
  console.log(`Cleanup after migration: ${options.cleanup ? 'Yes' : 'No'}`);
  console.log('');

  for (const appName of selectedApps) {
    const config = configurations.get(appName);
    console.log(chalk.cyan(`${appName}:`));

    if (config) {
      const appConfig = config as any;
      const categories = Object.keys(appConfig.categories || {});
      console.log(`  Categories: ${categories.join(', ') || 'None'}`);
      console.log(`  Complexity: ${appConfig.app?.complexity || 'Unknown'}`);
    } else {
      console.log(chalk.red('  Configuration not loaded'));
    }
    console.log('');
  }

  console.log(chalk.yellow('=== END DRY RUN SUMMARY ===\n'));
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
    console.error(chalk.red('Fatal error:'), error.message);
    process.exit(1);
  });
}
