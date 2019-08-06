const testUtil = require('../../lib');
module.exports = {
  name: 'mock',
  run: async function(context) {
    if (context.parameters.options.help) {
      const header = `amplify ${this.name} [subcommand]\nDescription:
      Mock resources locally`

      const commands = [
        {
          name: 'storage',
          description: 'Run Storage test server',         
        },
        {
          name: 'api',
          description: 'Run GraphQL API mock server',
        },
      ];
      context.amplify.showHelp(header, commands);
      return;
    }
    testUtil.mockAllCategories(context);
  }
}