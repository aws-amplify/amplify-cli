const featureName = 'analytics';

module.exports = {
  name: featureName,
  run: async (context) => {
    const header = `amplify ${featureName} <subcommand>`;

    const commands = [
      {
        name: 'add',
        description: `Takes you through a CLI flow to add an ${featureName} resource to your local backend`,
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
