import { category } from '../constants';

module.exports = {
  name: category,
  run: async (context: any) => {
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./${category}/${context.parameters.first}`);
        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }
    const header = `amplify ${category} <subcommand>`;

    const commands = [
      {
        name: 'add',
        description: `Takes you through a CLI flow to add an ${category} resource to your local backend`,
      },
      {
        name: 'update',
        description: `Takes you through steps in the CLI to update an ${category} resource`,
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
  },
};
