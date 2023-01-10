import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import { categoryName } from '../utils/constants';

export const name = 'update';
export async function run(context: $TSContext) {
  if (/^win/.test(process.platform)) {
    try {
      const { run } = await import(path.join('.', categoryName, context.parameters.first));

      return run(context);
    } catch (e) {
      printer.error('Command not found');
    }
  }

  const header = `amplify <subcommands> custom`;

  const commands = [
    {
      name: 'add',
      description: `Takes you through steps in the CLI to add a custom resource to your local backend`,
    },
    {
      name: 'update',
      description: `Takes you through steps in the CLI to update a custom resource`,
    },
    {
      name: 'remove',
      description: `Removes a custom resource from your local backend. The resource is removed from the cloud on the next push command.`,
    },
    {
      name: 'build',
      description: `Builds custom CDK resources`,
    },
  ];

  context.amplify.showHelp(header, commands);

  printer.blankLine();
  return undefined;
}
