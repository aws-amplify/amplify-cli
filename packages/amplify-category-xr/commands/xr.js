const featureName = 'xr';

module.exports = {
  name: featureName,
  alias: ['XR'],
  run: async context => {
    const header = `amplify ${featureName} <subcommand>`;

    const commands = [
      {
        name: 'add',
        description: 'Takes you through a CLI flow to add an XR resource to your local backend',
      },
      {
        name: 'update',
        description: 'Takes you through a CLI flow to update an XR resource',
      },
      {
        name: 'push',
        description: 'Provisions only XR cloud resources with the latest local developments',
      },
      {
        name: 'remove',
        description: 'Removes XR resource from your local backend which would be removed from the cloud on the next push command',
      },
      {
        name: 'console',
        description: `Opens the web console for the ${featureName} category`,
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
