const testUtil = require('../../lib');
module.exports = {
  name: 'help',
  run: async function(context) {
    const header = `amplify ${this.name} [subcommand]\nDescription:\nMock resources locally`;

    const commands = [
      {
        name: 'storage',
        description: 'Run Storage Mock Endpoint',
      },
      {
        name: 'api',
        description: 'Run GraphQL API Mock Endpoint',
      },
      {
        name: 'function <name>',
        description: 'Invoke Function locally',
      },
    ];
    context.amplify.showHelp(header, commands);
    return;
  },
};
