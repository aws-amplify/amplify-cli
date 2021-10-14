import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';

export const name = 'auth';

type AuthCommandType = {
  name: string;
  description: string;
};

export const run = async (context: $TSContext) => {
  try {
    const { run } = await import(path.join('.', name, context.parameters.first));
    return run(context);
  } catch (err) {
    const header = `amplify ${name} <subcommands>`;

    const commands: AuthCommandType[] = [
      {
        name: 'add',
        description: `Takes you through a CLI flow to add an ${name} resource to your local backend`,
      },
      {
        name: 'import',
        description: `Takes you through a CLI flow to import an existing ${name} resource to your local backend`,
      },
      {
        name: 'push',
        description: `Provisions only ${name} cloud resources with the latest local developments`,
      },
      {
        name: 'remove',
        description: `Removes the ${name} resource from your local backend which would be removed from the cloud on the next push command`,
      },
      {
        name: 'update',
        description: `Updates the ${name} resource from your local backend.`,
      },
      {
        name: 'console',
        description: `Opens the web console for the ${name} category`,
      },
    ];

    context.amplify.showHelp(header, commands);
    printer.blankLine();
  }
};
