const inquirer = require('inquirer');
const constants = require('./constants');

async function init(context) {
  normalizeInputParams(context);
  await confirmConfiguration(context);
  return context;
}

function onInitSuccessful(context) {
  return context;
}

async function configure(context) {
  normalizeInputParams(context);
  await confirmConfiguration(context);
  return context;
}

function normalizeInputParams(context) {
  let inputParams;
  if (context.exeInfo.inputParams && context.exeInfo.inputParams[constants.Label]) {
    inputParams = context.exeInfo.inputParams[constants.Label];
  }
  if (inputParams && inputParams.config) {
    if (!inputParams.config.ResDir) {
      throw new Error('The command line parameter for android frontend configuration is incomplete.');
    }
  }
  context.exeInfo.inputParams[constants.Label] = inputParams;
}

function displayFrontendDefaults(context) {
  context.print.info(`| App type: android`);
  context.print.info(`| Res directory: ${constants.defaultResDir}`);
}

function setFrontendDefaults(context) {
  context.exeInfo.inputParams.amplify.frontend = constants.Label;

  let inputParams = {};
  context.exeInfo.inputParams[constants.Label] = inputParams;
  inputParams.config = {};
  inputParams.config.ResDir = constants.defaultResDir;
  context.exeInfo.inputParams[constants.Label] = inputParams;
}

async function confirmConfiguration(context) {
  if (!context.exeInfo.projectConfig[constants.Label]) {
    context.exeInfo.projectConfig[constants.Label] = {};
  }
  if (!context.exeInfo.projectConfig[constants.Label].config) {
    context.exeInfo.projectConfig[constants.Label].config = {};
  }

  const inputParams = context.exeInfo.inputParams[constants.Label];
  if (inputParams) {
    Object.assign(context.exeInfo.projectConfig[constants.Label], inputParams);
  } else if (!context.exeInfo.inputParams.yes) {
    context.print.info('Please tell us about your project');
    const { config } = context.exeInfo.projectConfig[constants.Label];

    const configurationSettings = [
      {
        type: 'input',
        name: 'ResDir',
        message: 'Where is your Res directory: ',
        default: config.ResDir || constants.defaultResDir,
      },
    ];
    const answers = await inquirer.prompt(configurationSettings);
    config.ResDir = answers.ResDir;
  }
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
  displayFrontendDefaults,
  setFrontendDefaults,
};
