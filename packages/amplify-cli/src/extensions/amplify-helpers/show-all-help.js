const { print } = require('gluegun/print');
const { showHelp } = require('./show-help');
const { listCategories } = require('./list-categories');

function showAllHelp(context) {
  print.info('');

  const header = 'amplify <command> <subcommand>';

  const commands = [
    {
      name: 'init',
      description: 'Initializes a new project, sets up deployment resources in the cloud, and makes your project ready for Amplify.',
    },
    {
      name: 'configure',
      description: 'Configures the attributes of your project for amplify-cli, such as switching front-end framework and adding/removing cloud-provider plugins.',
    },
    {
      name: 'push',
      description: 'Provisions cloud resources with the latest local developments.',
    },
    {
      name: 'publish',
      description: 'Executes amplify push, and then builds and publishes client-side application for hosting.',
    },
    {
      name: 'serve',
      description: "Executes amplify push, and then executes the project's start command to test run the client-side application locally.",
    },
    {
      name: 'status',
      description: 'Shows the state of local resources not yet pushed to the cloud (Create/Update/Delete).',
    },
    {
      name: 'delete',
      description: 'Deletes all of the resources tied to the project from the cloud.',
    },
    {
      name: '<category> add',
      description: 'Adds a resource for an Amplify category in your local backend',
    },
    {
      name: '<category> update',
      description: 'Update resource for an Amplify category in your local backend.',
    },
    {
      name: '<category> push',
      description: 'Provisions all cloud resources in a category with the latest local developments.',
    },
    {
      name: '<category> remove',
      description: 'Removes a resource for an Amplify category in your local backend.',
    },
    {
      name: '<category>',
      description: 'Displays subcommands of the specified Amplify category.',
    },
    {
      name: 'mock',
      description: 'Run mock server for testing categories locally.',
    },
    {
      name: 'codegen',
      description: 'Generates GraphQL statements(queries, mutations and subscriptions) and type annotations.',
    },
    {
      name: 'env',
      description: 'Displays and manages environment related information for your Amplify project.',
    },
  ];

  showHelp(header, commands);
  print.info('');
  listCategories(context);
  print.info('');
}

module.exports = {
  showAllHelp,
};
