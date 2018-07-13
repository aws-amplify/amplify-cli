const featureName = 'storage';

module.exports = {
  name: featureName,
  run: async (context) => {
    const header = 'amplify storage <subcommands>';

    const commands = [
      {
        name: 'add',
        description: 'Takes you through a CLI flow to add a storage resource to your local backend',
      },
      {
        name: 'push',
        description: 'Provisions only storage cloud resources with the latest local developments',
      },
      {
        name: 'remove',
        description: 'Removes storage resource from your local backend which would be removed from the cloud on the next push command',
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
