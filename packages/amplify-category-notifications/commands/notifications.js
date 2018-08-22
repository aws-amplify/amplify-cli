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
        name: 'add | enable',
        description: 'Add a notification channel',
      },
      {
        name: 'remove | disable',
        description: 'Remove a notification channel',
      },
      {
        name: 'configure',
        description: 'Configure a notification channel',
      },
      {
        name: 'status | list',
        description: 'List the enabled/disabled status of the available notification channels',
      },
      {
        name: 'console',
        description: 'Open the Pinpoint web console displaying the current channel settings',
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
