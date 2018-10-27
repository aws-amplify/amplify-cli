const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');
const { getResourceOutputs } = require('../../extensions/amplify-helpers/get-resource-outputs');

async function run(context) {
  const frontendPlugins = getFrontendPlugins(context);
  const { frontend } = context.exeInfo.projectConfig;

  const selectedFrontend = await configreFrontendHandler(context, frontendPlugins, frontend);

  if (selectedFrontend !== frontend) {
    delete context.exeInfo.projectConfig[frontend];
    const frontendModule = require(frontendPlugins[selectedFrontend]);
    await frontendModule.init(context)
      .then(() => frontendModule.createFrontendConfigs(context, getResourceOutputs()));
    context.exeInfo.projectConfig.frontend = selectedFrontend;
  } else {
    const frontendModule = require(frontendPlugins[selectedFrontend]);
    await frontendModule.configure(context);
  }

  return context;
}

async function configreFrontendHandler(context, frontendPlugins, currentFrontend) {
  let frontend;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.frontend) {
    frontend = normalizeFrontendName(context.exeInfo.inputParams.amplify.frontend, frontendPlugins);
  }

  if (!frontend && context.exeInfo.inputParams.yes) {
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

function normalizeFrontendName(name, frontendPlugins) {
  const nameSplit = name.split('-');
  name = nameSplit[nameSplit.length - 1];
  name = Object.keys(frontendPlugins).includes(name) ? name : undefined;
  return name;
}

module.exports = {
  run,
};
