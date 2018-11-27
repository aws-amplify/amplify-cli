function showHelp(header, commands) {
  const { print } = require('gluegun/print');
  const CFonts = require('cfonts');
  const cliConstants = require('./constants');

  CFonts.say(cliConstants.BrandName, {
    font: 'block', // define the font face
    align: 'left', // define text alignment
    colors: ['cyan'], // define all colors
    background: 'transparent', // define the background color, you can also use `backgroundColor` here as key
    letterSpacing: 1, // define letter spacing
    lineHeight: 1, // define the line height
    space: true, // define if the output text should have empty lines on top and on the bottom
    maxLength: '0', // define how many character can be on one line
  });

  print.info(header);
  print.info('');
  const tableOptions = [];

  for (let i = 0; i < commands.length; i += 1) {
    tableOptions.push([commands[i].name, commands[i].description]);
  }

  const { table } = print;

  table(
    tableOptions,
    { format: 'default' },
  );
}

module.exports = {
  showHelp,
};
