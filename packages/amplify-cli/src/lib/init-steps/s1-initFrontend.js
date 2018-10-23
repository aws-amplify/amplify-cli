const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');

async function run(context) {
  const frontendPlugins = getFrontendPlugins(context);
  let suitableFrontend;
  let fitToHandleScore = -1;

  Object.keys(frontendPlugins).forEach((key) => {
    const { scanProject } = require(frontendPlugins[key]);
    const newScore = scanProject(context.exeInfo.projectConfig.projectPath);
    if (newScore > fitToHandleScore) {
      fitToHandleScore = newScore;
      suitableFrontend = key;
    }
  });

  const frontend = await getFrontendHandler(context, frontendPlugins, suitableFrontend);

  context.exeInfo.projectConfig.frontend = frontend;
  const handler = require(frontendPlugins[frontend]);
  await handler.init(context);

  return context;
}

async function getFrontendHandler(context, frontendPlugins, suitableFrontend) {
  let frontend;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.frontend) {
    frontend = normalizeFrontendHandlerName(context.exeInfo.inputParams.amplify.frontend, frontendPlugins);
  }

  if (!frontend && context.exeInfo.inputParams.yes) {
    frontend = 'javascript';
  }

  if (!frontend) {
    const selectFrontendHandler = {
      type: 'list',
      name: 'selectedFrontendHandler',
      message: "Choose the type of app that you're building",
      choices: Object.keys(frontendPlugins),
      default: suitableFrontend,
    };
    const answer = await inquirer.prompt(selectFrontendHandler);
    frontend = answer.selectedFrontendHandler;
  }

  return frontend;
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
