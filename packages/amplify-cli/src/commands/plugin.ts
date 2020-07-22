import path from 'path';
import { Context } from '../domain/context';

export async function run(context: Context) {
  let subCommand = 'help';

  if (context.input.subCommands && context.input.subCommands.length > 0) {
    subCommand = context.input.subCommands![0];
  }
  subCommand = mapSubcommandAlias(subCommand);

  const subCommandPath = path.normalize(path.join(__dirname, 'plugin', subCommand));
  import(subCommandPath)
    .then(async subCommandModule => {
      await subCommandModule.run(context);
    })
    .catch(err => {
      context.print.error(`Error executing command amplify plugin ${subCommand}`);
      context.print.error(err.message || err.stack || JSON.stringify(err));
      context.usageData.emitError(err);
      process.exit(1);
    });
}

function mapSubcommandAlias(subcommand: string): string {
  if (subcommand === 'init') {
    return 'new';
  }
  return subcommand;
}
