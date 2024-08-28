import { createGen2Command } from './commands/gen2/gen2_command_factory.js';
import yargs, { Argv } from 'yargs';

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
