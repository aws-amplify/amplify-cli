const featureName = 'api';

module.exports = {
  name: featureName,
  run: async (context) => {
    const header = `amplify ${featureName} <subcommands>`;
    const commands = [
      {
        name: 'add',
        description: `Takes you through a CLI flow to add a ${featureName} resource to your local backend`,
      },
      {
        name: 'push',
        description: `Provisions ${featureName} cloud resources and it's dependencies with the latest local developments`,
      },
      {
        name: 'remove',
        description: `Removes ${featureName} resource from your local backend which would be removed from the cloud on the next push command`,
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
