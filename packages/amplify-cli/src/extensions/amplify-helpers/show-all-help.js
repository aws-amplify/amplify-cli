const { print } = require('gluegun/print');
const { showHelp } = require('./show-help');
const { listCategories } = require('./list-categories');

function showAllHelp(context) {
  print.info('');

  const header = 'amplify <command> <subcommand>';

  const commands = [
    {
      name: 'init',
      description: 'Initializes a new project, sets up deployment resources in the cloud and makes your project Amplify ready',
    },
    {
      name: 'configure',
      description: 'Configures the attributes of your project for amplify-cli like switching frontend framework and adding/removing cloud-provider plugins',
    },
    {
      name: 'push',
      description: 'Provisions cloud resources with the latest local developments',
    },
    {
      name: 'publish',
      description: 'Executes amplify push, then builds and publishes client-side application to S3 and Cloud Front',
    },
    {
      name: 'serve',
      description: "Executes amplify push, then executes the project's start command to test run the client-side application",
    },
    {
      name: 'status',
      description: 'Shows state of local resources not yet pushed to the cloud (Create/Update/Delete)',
    },
    {
      name: 'delete',
      description: 'Deletes all the resources tied to the project from the cloud',
    },
    {
      name: 'add <category>',
      description: 'Adds resource for an amplify category in your local backend',
    },
    {
      name: 'update <category>',
      description: 'Update resource for an amplify category in your local backend',
    },
    {
      name: 'push <category>',
      description: 'Provisions all cloud resources in a category with the latest local developments',
    },
    {
      name: 'remove <category>',
      description: 'Removes resource for an amplify category in your local backend',
    },
    {
      name: '<category>',
      description: 'Contains subcommands of the specified amplify category',
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
