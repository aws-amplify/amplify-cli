const featureName = 'function';

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
        name: 'update',
        description: `Takes you through a CLI flow to update an existing ${featureName} resource`,
      },
      {
        name: 'push',
        description: `Provisions only ${featureName} cloud resources with the latest local developments`,
      },
      {
        name: 'remove',
        description: `Removes ${featureName} resource from your local backend which would be removed from the cloud on the next push command`,
      },
      {
        name: 'build',
        description: 'Builds all the functions in the project (does an npm install on the functions src directory)',
      },
      {
        name: 'invoke <resourcename>',
        description: 'Invokes a function locally for testing',
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
