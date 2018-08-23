const featureName = 'notifications';

module.exports = {
  name: featureName,
  alias: ['notification'],
  run: async (context) => {
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./${featureName}/${context.parameters.first}`);
        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }
    const header = `amplify ${featureName} <subcommand>`;

    const commands = [
      {
        name: 'add',
        description: 'Adds a notification channel',
      },
      {
        name: 'remove',
        description: 'Removes a notification channel',
      },
      {
        name: 'configure',
        description: 'Configures a notification channel',
      },
      {
        name: 'status',
        description: 'Lists the enabled/disabled status of the available notification channels',
      },
      {
        name: 'console',
        description: 'Opens the Amazon Pinpoint console displaying the current channel settings',
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
