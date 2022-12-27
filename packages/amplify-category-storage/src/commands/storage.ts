import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import { categoryName } from '../constants';
export { categoryName as name } from '../constants';

export async function run(context: $TSContext) {
  if (/^win/.test(process.platform)) {
    try {
      const { run } = await import(path.join('.', categoryName, context.parameters.first));

      return run(context);
    } catch (e) {
      printer.error('Command not found');
    }
  }

  const header = `amplify ${categoryName} <subcommands>`;

  const commands = [
    {
      name: 'add',
      description: `Takes you through steps in the CLI to add a ${categoryName} resource to your local backend`,
    },
    {
      name: 'import',
      description: `Takes you through a CLI flow to import an existing ${categoryName} resource to your local backend`,
    },
    {
      name: 'update',
      description: `Takes you through steps in the CLI to update an ${categoryName} resource`,
    },
    {
      name: 'push',
      description: `Provisions only ${categoryName} cloud resources with the latest local developments`,
    },
    {
      name: 'remove',
      description: `Removes ${categoryName} resource from your local backend. The resource is removed from the cloud on the next push command.`,
    },
    {
      name: 'override',
      description: `Generates 'overrides.ts' for ${categoryName} resource in your local backend. The resource properties can be overridden by editing this file. The resource is overridden in the cloud on the next push command. `,
    },
  ];

  context.amplify.showHelp(header, commands);

  printer.info('');
  return undefined;
}
