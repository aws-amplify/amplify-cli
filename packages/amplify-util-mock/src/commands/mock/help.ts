import { $TSContext } from 'amplify-cli-core';

export const name = 'help';

export const run = (context: $TSContext) => {
  const header = `amplify ${name} [subcommand]\nDescription:\nMock resources locally`;

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
};
