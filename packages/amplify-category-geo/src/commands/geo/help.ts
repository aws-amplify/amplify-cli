import { $TSContext } from 'amplify-cli-core';
import { category } from '../../constants';

export const name = category;

export const run = async (context: $TSContext) => {
  const header = `amplify ${category} <subcommand>`;

  const commands = [
    {
      name: 'add',
      description: `Takes you through a CLI flow to add a ${category} resource to your local backend`,
    },
    {
      name: 'update',
      description: `Takes you through steps in the CLI to update a ${category} resource`,
    },
    {
      name: 'push',
      description: `Provisions only ${category} cloud resources with the latest local developments`,
    },
    {
      name: 'remove',
      description: `Removes ${category} resource from your local backend. The resource is removed from the cloud on the next push command.`,
    },
    {
      name: 'console',
      description: `Opens the web console for the ${category} category`,
    },
  ];

  context.amplify.showHelp(header, commands);

  context.print.info('');
};
