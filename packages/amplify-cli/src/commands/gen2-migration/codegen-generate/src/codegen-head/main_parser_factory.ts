import { createGen2Command } from '../../gen2_command_factory';
import yargs, { Argv } from 'yargs';

// Set CLI_ENV to production to always stream usage data metrics to production
// This tool is not part of CLI binary and doesn't have preprod stages,
// so will always default to production.
process.env.CLI_ENV = 'production';

export const createMainParser = (libraryVersion: string): Argv => {
  const parser = yargs()
    .version(libraryVersion)
    .options('debug', {
      type: 'boolean',
      default: false,
      description: 'Print debug logs to the console',
    })
    .strict()
    .command(createGen2Command())
    .help()
    .demandCommand()
    .strictCommands()
    .recommendCommands()
    .fail(false);

  return parser;
};
