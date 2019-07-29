const testUtil = require('../../lib');
module.exports = {
  name: 'mock',
  run: async function(context) {
    if (context.parameters.options.help) {
      const header = `amplify ${this.name} [subcommand]\nDescriptions:
      Mock resources locally`

      const commands = [
        {
          name: 'api',
          description: 'Run GraphQL API test server',
        },
      ];
      context.amplify.showHelp(header, commands);
      return;
    }
    testUtil.mockAllCategories(context);
  }
}