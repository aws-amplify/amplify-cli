#!/usr/bin/env node

// eslint-disable-next-line spellcheck/spell-checker
import * as yargs from 'yargs';
import chalk from 'chalk';
import { App } from './core/app';
import { resolveProfile } from './core/credentials';

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
    .option('step', {
      type: 'string',
      description: 'Stop migration workflow at this step',
      choices: ['deploy', 'migrate'],
      string: true,
    })
    .option('teardown', {
      type: 'boolean',
      description: 'Delete all deployed resources after execution',
      default: false,
    })
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'V')
    .example('$0 -a project-boards --profile default', 'Migrate specific app using a local AWS profile').argv;

  printBanner();

  if (!argv.app) {
    console.error('Error: --app is required');
    process.exit(1);
  }

  const step = argv.step ?? 'e2e';

  const profile = resolveProfile(argv.profile);
  const app = new App(argv.app, profile, argv.verbose);
  switch (step) {
    case 'deploy':
      await app.deploy();
      break;
    case 'migrate':
      await app.migrate();
      break;
    case 'e2e':
      await app.e2e({ teardown: argv.teardown ?? false });
      break;
    default:
      throw new Error(`Unrecognized step: ${step}`);
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
