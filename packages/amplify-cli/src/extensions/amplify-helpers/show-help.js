const print = require('./print');

function showHelp(header, commands) {
  print.info(header);
  print.info('');
  const tableOptions = [];

  for (let i = 0; i < commands.length; i += 1) {
    tableOptions.push([commands[i].name, commands[i].description]);
  }

  const { table } = print;

  table(tableOptions, { format: 'default' });
}

module.exports = {
  showHelp,
};
