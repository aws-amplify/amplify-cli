const CFonts = require('cfonts');
const cliConstants = require('../extensions/awsmobile-helpers/constants');

module.exports = {
  name: cliConstants.CliName,
  run: async (context) => {
    const { print } = context;
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
    print.info("Welcome to awsmobile CLI. Here's the list of all the CLI commands");
    // List of all commands with brief descriptions
  },
};
