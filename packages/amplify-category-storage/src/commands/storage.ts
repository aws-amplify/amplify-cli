import {AmplifyCategories , CLISubCommands} from 'amplify-cli-core';

module.exports = {
  name: AmplifyCategories.STORAGE,
  run: async (context: any) => {
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./${AmplifyCategories.STORAGE}/${context.parameters.first}`);

        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }

    const header = `amplify ${AmplifyCategories.STORAGE} <subcommands>`;

    const commands = [
      {
        name: CLISubCommands.ADD,
        description: `Takes you through steps in the CLI to add a ${AmplifyCategories.STORAGE} resource to your local backend`,
      },
      {
        name: CLISubCommands.IMPORT,
        description: `Takes you through a CLI flow to import an existing ${AmplifyCategories.STORAGE} resource to your local backend`,
      },
      {
        name: CLISubCommands.UPDATE,
        description: `Takes you through steps in the CLI to update an ${AmplifyCategories.STORAGE} resource`,
      },
      {
        name: CLISubCommands.PUSH,
        description: `Provisions only ${AmplifyCategories.STORAGE} cloud resources with the latest local developments`,
      },
      {
        name: CLISubCommands.REMOVE,
        description: `Removes ${AmplifyCategories.STORAGE} resource from your local backend. The resource is removed from the cloud on the next push command.`,
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
