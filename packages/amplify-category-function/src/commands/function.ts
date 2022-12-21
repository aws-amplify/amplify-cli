import { categoryName } from '../constants';

module.exports = {
  name: categoryName,
  run: async context => {
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./${categoryName}/${context.parameters.first}`);
        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }
    const header = `amplify ${categoryName} <subcommands>`;

    const commands = [
      {
        name: 'add',
        description: `Takes you through a CLI flow to add a ${categoryName} resource to your local backend`,
      },
      {
        name: 'update',
        description: `Takes you through a CLI flow to update an existing ${categoryName} resource`,
      },
      {
        name: 'push',
        description: `Provisions only ${categoryName} cloud resources with the latest local developments`,
      },
      {
        name: 'remove',
        description: `Removes ${categoryName} resource from your local backend which would be removed from the cloud on the next push command`,
      },
      {
        name: 'build',
        description: 'Builds all the functions in the project (does an npm install on the functions src directory)',
      },
      {
        name: 'console',
        description: `Opens the web console for the ${categoryName} category`,
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
    return undefined;
  },
};
