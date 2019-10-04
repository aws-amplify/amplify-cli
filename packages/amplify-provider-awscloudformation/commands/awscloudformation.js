const featureName = 'awscloudformation';

module.exports = {
  name: 'awscloudformation',
  alias: ['awscfn', 'aws'],
  run: async context => {
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./awscloudformation/${context.parameters.first}`);
        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }

    const header = `amplify ${featureName} <subcommand>`;

    const commands = [
      {
        name: 'configure',
        description: `configure`,
      },
      {
        name: 'resetCache',
        description: `resetCache`,
      },
      {
        name: 'setup-new-user',
        description: `setup-new-user`,
      },
      {
        name: 'console',
        description: `Opens the web console for the  ${featureName}`,
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
