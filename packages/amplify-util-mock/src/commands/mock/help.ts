import { $TSContext } from 'amplify-cli-core';

export const name = 'help';

/**
 * Show the help mock info
 */
export const run = (context: $TSContext):void => {
  const header = `amplify ${name} [subcommand]\nDescription:\nMock resources locally`;

  const commands = [
    {
      name: 'storage',
      description: 'Run Storage Mock Endpoint',
    },
    {
      name: 'auth',
      description: 'Run Auth Mock Endpoint',
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
};
