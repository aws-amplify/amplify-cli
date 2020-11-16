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
      throw new Error('The command line parameter for Flutter frontend configuration is incomplete.');
    }
  }
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

    context.print.warning('⚠️  Flutter project support in the Amplify CLI is in DEVELOPER PREVIEW.');
    context.print.warning('Only the following categories are supported:');
    context.print.warning(' * Auth');
    context.print.warning(' * Analytics (Pinpoint only)');
    context.print.warning(' * Storage');

    const configurationSettings = [
      {
        type: 'input',
        name: 'ResDir',
        message: 'Where do you want to store your configuration file?',
        default: config.ResDir || './lib/',
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
};
