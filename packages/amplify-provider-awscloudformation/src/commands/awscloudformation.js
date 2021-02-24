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
        description: `Configures the aws access credentials for the project.`,
      },
      {
        name: 'reset-cache',
        description: `Resets the cached temporary aws access credentials for the project.`,
      },
      {
        name: 'setup-new-user',
        description: `Starts a step by step guidance to set up a new IAM user.`,
      },
      {
        name: 'console',
        description: `Opens the web console for the ${featureName}`,
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
