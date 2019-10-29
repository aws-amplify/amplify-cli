import { Context } from '../../domain/context';

export function run(context: Context) {
  context.print.info('');

  const commands = [
    {
      name: 'init',
      description: 'Scaffolds a skeleton Amplify CLI plugin.',
    },
    {
      name: 'configure',
      description: 'Walkthrough to configure Amplify CLI plugin options, e.g. directories where the CLI scans for plugins.',
    },
    {
      name: 'list',
      description: 'Lists general plugin information for, e.g. list of active plugins.',
    },
    {
      name: 'scan',
      description: 'Explicitly starts a scan/search for new and existing plugins.',
    },
    {
      name: 'add',
      description: 'Explicitly adds a plugin for the Amplify CLI to use.',
    },
    {
      name: 'remove',
      description: ' Explicitly removes a plugin from the Amplify CLI.',
    },
    {
      name: 'verify',
      description: 'Verifies if a plugin package/directory is a valid Amplify CLI plugin.',
    },
    {
      name: 'help',
      description: 'Prints out the a help message for the plugin command.',
    },
  ];
  const tableOptions = [];
  for (let i = 0; i < commands.length; i += 1) {
    tableOptions.push([commands[i].name, commands[i].description]);
  }
  context.print.info('Subcommands for amplify plugin:');
  context.print.info('');
  context.print.table(tableOptions, { format: 'default' });
  context.print.info('');
}
