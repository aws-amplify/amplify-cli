import * as figlet from 'figlet';
import { print } from './print';
import { amplifyCLIConstants } from './constants';

export function showHelp(header, commands) {
  figlet.text(
    amplifyCLIConstants.BrandName,
    {
      font: 'ANSI Shadow',
    },
    (err, data) => {
      if (!err) {
        print.info(data);
      }
      print.info(header);
      print.info('');
      const tableOptions: [string, string][] = [];

      for (let i = 0; i < commands.length; i += 1) {
        tableOptions.push([commands[i].name, commands[i].description]);
      }

      const { table } = print;

      table(tableOptions, { format: 'default' });
    },
  );
}
