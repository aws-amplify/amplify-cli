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

  const app = new App(argv.app, argv.profile, argv.verbose);
  app.logger.info(`Staring migration`);

  await app.gitInit();
  await app.init();
  await app.configure();
  await app.installDeps();
  await app.status();
  await app.push();
  await app.postPush();
  await app.gitCommit('chore: post push');

  await app.frontestGen1();

  await app.assess();
  await app.lock();
  await app.gitCheckoutGen2(true);
  await app.generate();
  await app.installDeps();
  await app.postGenerate();
  const gen2StackName = await app.deployGen2Sandbox();
  await app.gitCommit('chore: post generate');

  await app.frontestGen1();
  await app.frontestGen2();

  await app.gitCheckoutGen1();
  await app.refactor(gen2StackName);
  await app.gitCheckoutGen2();
  await app.postRefactor();
  await app.gitCommit('chore: post refactor');

  await app.frontestGen1();
  await app.frontestGen2();

  await app.deployGen2Sandbox();

  await app.frontestGen1();
  await app.frontestGen2();

  app.logger.info(`Migration completed successfully`);
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

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Fatal error:'), (error as Error).message);
    process.exit(1);
  });
}
