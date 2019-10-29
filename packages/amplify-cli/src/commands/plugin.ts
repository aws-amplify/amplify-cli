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
    .catch(() => {
      context.print.error(`Cannot load command amplify plugin ${subCommand}`);
    });
}

function mapSubcommandAlias(subcommand: string): string {
  if (subcommand === 'init') {
    return 'new';
  }
  return subcommand;
}
