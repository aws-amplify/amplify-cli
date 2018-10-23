const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');
const { getResourceOutputs } = require('../../extensions/amplify-helpers/get-resource-outputs');

async function run(context) {
  const frontendPlugins = getFrontendPlugins(context);
  let { frontendHandler } = context.exeInfo.projectConfig;

  const selectedFrontendHandler = await configreFrontendHandler(context, frontendPlugins, frontendHandler);

  if (selectedFrontendHandler !== frontendHandler) {
    delete context.exeInfo.projectConfig[frontendHandler];
    const handlerModule = require(frontendPlugins[selectedFrontendHandler]);
    await handlerModule.init(context)
      .then(() => handlerModule.createFrontendConfigs(context, getResourceOutputs()));
    context.exeInfo.projectConfig.frontendHandler = selectedFrontendHandler;
  }else{
    const handlerModule = require(frontendPlugins[selectedFrontendHandler]);
    await handlerModule.configure(context);
  }

  return context;
}

async function configreFrontendHandler(context, frontendPlugins, currentHandler) {
  let frontendHandler;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.frontend) {
    frontendHandler = normalizeFrontendHandlerName(context.exeInfo.inputParams.amplify.frontend);
  }

  if (!frontendHandler && context.exeInfo.inputParams.yes) {
    frontendHandler = 'javascript';
  }

  if (!frontendHandler) {
    const selectFrontendHandler = {
      type: 'list',
      name: 'selectedFrontendHandler',
      message: "Choose the type of app that you're building",
      choices: Object.keys(frontendPlugins),
      default: currentHandler,
    };
    const answer = await inquirer.prompt(selectFrontendHandler);
    frontendHandler = answer.selectedFrontendHandler;
  }

  return frontendHandler;
}

function normalizeFrontendHandlerName(name, frontendPlugins) {
  const nameSplit = name.split('-');
  name = nameSplit[nameSplit.length - 1];
  name = Object.keys(frontendPlugins).includes(name) ? name : undefined;
  return name;
}

module.exports = {
  run,
};
