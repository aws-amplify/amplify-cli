import * as path from 'path';
import { JSONUtilities, exitOnNextTick } from 'amplify-cli-core';
import { Context } from '../domain/context';

export const run = async (context: Context) => {
  let subCommand = 'help';

  if (context.input.subCommands && context.input.subCommands.length > 0) {
    subCommand = context.input.subCommands[0];
  }
  subCommand = mapSubcommandAlias(subCommand);

  const subCommandPath = path.normalize(path.join(__dirname, 'plugin', subCommand));
  import(subCommandPath)
    .then(async subCommandModule => {
      await subCommandModule.run(context);
    })
    .catch(err => {
      context.print.error(`Error executing command amplify plugin ${subCommand}`);
      context.print.error(err.message || err.stack || JSONUtilities.stringify(err));
      context.usageData.emitError(err);
      exitOnNextTick(1);
    });
};

function mapSubcommandAlias(subcommand: string): string {
  if (subcommand === 'init') {
    return 'new';
  }
  return subcommand;
}
