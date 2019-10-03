const categoryName = 'predictions';

module.exports = {
  name: categoryName,
  alias: ['Predictions'],
  run: async (context) => {
    const header = `amplify ${categoryName} <subcommand>`;

    const commands = [
      {
        name: 'add',
        description: `Takes you through a CLI flow to add a ${categoryName} resource to your local backend`,
      },
      {
        name: 'remove',
        description: `Removes ${categoryName} resource from your local backend which would be removed from the cloud on the next push command`,
      },
      {
        name: 'update',
        description: `Takes you through steps in the CLI to update an ${categoryName} resource`,
      },
      {
        name: 'console',
        description: `Opens a web console to view your ${categoryName} resource`,
      },
    ];

    context.amplify.showHelp(header, commands);
    context.print.info('');
  },
};
