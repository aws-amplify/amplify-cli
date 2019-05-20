const { print } = require('gluegun/print');
const figlet = require('figlet');
const cliConstants = require('./constants');

function showHelp(header, commands) {
  figlet.text(
    cliConstants.BrandName,
    {
      font: 'ANSI Shadow',
    },
    (err, data) => {
      if (!err) {
        print.info(data);
      }
      print.info(header);
      print.info('');
      const tableOptions = [];

      for (let i = 0; i < commands.length; i += 1) {
        tableOptions.push([commands[i].name, commands[i].description]);
      }

      const { table } = print;

      table(tableOptions, { format: 'default' });
    },
  );
}

module.exports = {
  showHelp,
};
