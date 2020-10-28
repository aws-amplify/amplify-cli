const categoryName = 'storage';

module.exports = {
  name: categoryName,
  run: async context => {
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./${categoryName}/${context.parameters.first}`);

        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }

    const header = `amplify ${categoryName} <subcommands>`;

    const commands = [
      {
        name: 'add',
        description: `Takes you through steps in the CLI to add a ${categoryName} resource to your local backend`,
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
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
