import { $TSContext } from 'amplify-cli-core';

export const name = 'auth';

type AuthCommandType = {
  name: string;
  description: string;
};

export const run = async (context: $TSContext) => {
  if (process.platform === 'win32') {
    try {
      const { run } = await import(`./${name}/${context.parameters.first}`);
      return run(context);
    } catch (e) {
      context.print.error('Command not found');
    }
  }

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

  context.print.info('');
};
