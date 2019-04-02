const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');
const { normalizeFrontendHandlerName } = require('../input-params-manager');

async function run(context) {
  const frontendPlugins = getFrontendPlugins(context);
  const { frontend } = context.exeInfo.projectConfig;

  const selectedFrontend = await selectFrontendHandler(context, frontendPlugins, frontend);

  if (selectedFrontend !== frontend) {
    delete context.exeInfo.projectConfig[frontend];
    const frontendModule = require(frontendPlugins[selectedFrontend]);
    await frontendModule.init(context);
    context.exeInfo.projectConfig.frontend = selectedFrontend;
  } else {
    const frontendModule = require(frontendPlugins[selectedFrontend]);
    await frontendModule.configure(context);
  }

  return context;
}

async function selectFrontendHandler(context, frontendPlugins, currentFrontend) {
  let frontend;
  const frontendPluginList = Object.keys(frontendPlugins);
  const { inputParams } = context.exeInfo;
  if (inputParams.amplify.frontend) {
    frontend = normalizeFrontendHandlerName(inputParams.amplify.frontend, frontendPluginList);
  }

  if (!frontend && inputParams.yes) {
    frontend = 'javascript';
  }

  if (!frontend) {
    const selectFrontend = {
      type: 'list',
      name: 'selectedFrontend',
      message: "Choose the type of app that you're building",
      choices: Object.keys(frontendPlugins),
      default: currentFrontend,
    };
    const answer = await inquirer.prompt(selectFrontend);
    frontend = answer.selectedFrontend;
  }

  return frontend;
}

module.exports = {
  run,
};
