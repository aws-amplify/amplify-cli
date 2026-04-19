#!/usr/bin/env node

// eslint-disable-next-line spellcheck/spell-checker
import * as yargs from 'yargs';
import chalk from 'chalk';
import { App } from './core/app';

async function main(): Promise<void> {
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
    .option('flow', {
      type: 'string',
      description: 'E2E flow to execute on the app',
      choices: ['deploy:gen1', 'deploy:gen2', 'migrate'],
      string: true,
    })
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'V')
    .example('$0 -a project-boards --profile default', 'Migrate specific app').argv;

  printBanner();

  if (!argv.app) {
    console.error('Error: --app is required');
    process.exit(1);
  }
  if (!argv.profile) {
    throw new Error('--profile must be specified');
  }

  const flow = argv.flow ?? 'migrate';

  const app = new App(argv.app, argv.profile, argv.verbose);
  try {
    switch (flow) {
      case 'deploy:gen1':
        await app.deployGen1();
        break;
      case 'deploy:gen2':
        await app.deployGen2();
        break;
      case 'migrate':
        await app.migrate();
        break;
      default:
        throw new Error(`Unrecognized flow: ${flow}`);
    }
    if (process.env.UPDATE_SNAPSHOTS === '1') {
      app.updateSnapshots();
    }
    app.logger.info(`Execution completed successfully (${app.targetAppPath})`);
  } catch (error) {
    (error as Error).message = `Execution failed: ${chalk.red((error as Error).message)} (${app.targetAppPath})`;
    throw error;
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
