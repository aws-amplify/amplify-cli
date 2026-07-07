import { print } from './print';

export function showHelp(header, commands) {
  print.info(header);
  print.info('');
  const tableOptions: [string, string][] = [];

  for (let i = 0; i < commands.length; i += 1) {
    tableOptions.push([commands[i].name, commands[i].description]);
  }

  const { table } = print;

  table(tableOptions, { format: 'default' });
}
