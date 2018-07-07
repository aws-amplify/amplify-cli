const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');

function run(context) {
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

  const selectFrontendHandler = {
    type: 'list',
    name: 'selectedFrontendHandler',
    message: 'Please select the proper frontend handler',
    choices: frontendPlugins,
    default: suitableHandler,
  };

  return inquirer.prompt(selectFrontendHandler)
    .then((answers) => {
      context.exeInfo.projectConfig.frontendHandler = {};
      context.exeInfo.projectConfig.frontendHandler[answers.selectedFrontendHandler] =
        frontendPlugins[answers.selectedFrontendHandler];
      return context;
    })
    .then((ctxt) => {
      const handler = Object.values(context.exeInfo.projectConfig.frontendHandler)[0];
      return handler.init(ctxt);
    });
}

module.exports = {
  run,
};
