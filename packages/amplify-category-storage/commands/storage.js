const featureName = 'storage';

module.exports = {
  name: featureName,
  run: async context => {
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./${featureName}/${context.parameters.first}`);
        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }
    const header = `amplify ${featureName} <subcommands>`;

    const commands = [
      {
        name: 'add',
        description: `Takes you through steps in the CLI to add a ${featureName} resource to your local backend`,
      },
      {
        name: 'update',
        description: `Takes you through steps in the CLI to update an ${featureName} resource`,
      },
      {
        name: 'push',
        description: `Provisions only ${featureName} cloud resources with the latest local developments`,
      },
      {
        name: 'remove',
        description: `Removes ${featureName} resource from your local backend. The resource is removed from the cloud on the next push command.`,
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
