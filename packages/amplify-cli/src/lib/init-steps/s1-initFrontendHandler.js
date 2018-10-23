const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');

async function run(context) {
  const frontendPlugins = getFrontendPlugins(context);
  let suitableHandler;
  let fitToHandleScore = -1;

  Object.keys(frontendPlugins).forEach((key) => {
    const { scanProject } = require(frontendPlugins[key]);
    const newScore = scanProject(context.exeInfo.projectConfig.projectPath);
    if (newScore > fitToHandleScore) {
      fitToHandleScore = newScore;
      suitableHandler = key;
    }
  });

  const frontendHandler = await getFrontendHandler(context, frontendPlugins, suitableHandler);

  context.exeInfo.projectConfig.frontendHandler = frontendHandler;
  const handler = require(frontendPlugins[frontendHandler]);
  return handler.init(context);
}

async function getFrontendHandler(context, frontendPlugins, suitableHandler) {
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
      default: suitableHandler,
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
