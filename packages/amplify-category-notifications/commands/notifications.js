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
        name: 'channel',
        description: 'Allows you to configure notification channels',
      },
      {
        name: 'console',
        description: 'Opens the Pinpoint web console displaying the current channel settings',
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
