const featureName = 'api';

module.exports = {
  name: featureName,
  run: async (context) => {
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./${featureName}/${context.parameters.first}`);
        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }
    const header = `amplify ${featureName} <subcommands>`;
    const commands = [
      {
        name: 'add',
        description: `Takes you through a CLI flow to add a ${featureName} resource to your local backend`,
      },
      {
        name: 'push',
        description: `Provisions ${featureName} cloud resources and it's dependencies with the latest local developments`,
      },
      {
        name: 'remove',
        description: `Removes ${featureName} resource from your local backend which would be removed from the cloud on the next push command`,
      },
      {
        name: 'update',
        description: `Takes you through steps in the CLI to update an ${featureName} resource`,
      },
      {
        name: 'gql-compile',
        description: 'Compiles your GraphQL schema and generates a corresponding cloudformation template',
      },
      {
        name: 'add-graphql-datasource',
        description: 'Provisions the AppSync resources and its dependencies for the provided Aurora Serverless data source',
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
