const featureName = 'env';

module.exports = {
  name: featureName,
  run: async (context) => {
    const header = `amplify ${featureName} <subcommands>`;

    const commands = [
      {
        name: 'list [--details] [--json]',
        description: `Displays a list of all the environments in your Amplify project`,
      },
      {
        name: 'get --name <env-name>',
        description: `Displays the details of the environment specified in the command `,
      },
      {
        name: 'add --name <env-name> --config <provider-configs> [--awsInfo <aws-configs>]',
        description: `Adds an already existing Amplify project stack to your local backend`,
      },
      {
        name: 'remove --name <env-name>',
        description: 'Removes an environment from the Amplify project',
      }
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
