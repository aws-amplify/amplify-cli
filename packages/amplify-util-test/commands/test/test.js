module.exports = {
  name: 'test',
  run: async function(context) {
    if (context.parameters.options.help) {
      const header = `amplify ${this.name} [subcommand]\nDescriptions:
      Test resources locally`

      const commands = [
        {
          name: 'api',
          description: 'Run GraphQL API test server',
        },
      ];
      context.amplify.showHelp(header, commands);
      return;
    }
  }
}