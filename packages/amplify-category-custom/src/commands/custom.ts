module.exports = {
  name: 'custom',
  run: async (context: any) => {
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./custom/${context.parameters.first}`);

        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }

    const header = `amplify <subcommands> custom`;

    const commands = [
      {
        name: 'add',
        description: `Takes you through steps in the CLI to add a custom resource to your local backend`,
      },
      {
        name: 'update',
        description: `Takes you through steps in the CLI to update a custom resource`,
      },
      {
        name: 'remove',
        description: `Removes a custom resource from your local backend. The resource is removed from the cloud on the next push command.`,
      },
      {
        name: 'build',
        description: `Builds custom CDK resources`,
      },
    ];

    context.amplify.showHelp(header, commands);

    context.print.info('');
  },
};
