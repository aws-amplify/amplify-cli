const inquirer = require('inquirer');
const constants = require('./constants');

function init(context) {
  context.print.info('Describe your project:');
  return promptForConfiguration(context);
}

function onInitSuccessful(context) {
  return new Promise((resolve) => {
    resolve(context);
  });
}

function configure(context) {
  return promptForConfiguration(context);
}

function promptForConfiguration(context) {
  if (!context.exeInfo.projectConfig[constants.Label]) {
    context.exeInfo.projectConfig[constants.Label] = {};
  }
  if (!context.exeInfo.projectConfig[constants.Label].config) {
    context.exeInfo.projectConfig[constants.Label].config = {};
  }
  const { config } = context.exeInfo.projectConfig[constants.Label];
  const configurationSettings = [
    {
      type: 'input',
      name: 'ResDir',
      message: 'Where is your Res directory: ',
      default: config.ResDir || 'app/src/main/res',
    },
  ];

  return inquirer.prompt(configurationSettings)
    .then((answers) => {
      config.ResDir = answers.ResDir;
      return context;
    });
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
};
