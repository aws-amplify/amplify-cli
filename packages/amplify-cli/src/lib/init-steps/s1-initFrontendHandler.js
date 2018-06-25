const inquirer = require('inquirer');

function run(context) {
  const selectFrontendHandler = {
    type: 'list',
    name: 'selectedFrontendHandler',
    message: 'Please select the proper frontend handler',
    choices: Object.keys(context.initInfo.frontendPlugins),
    default: context.initInfo.suitableHandler,
  };
  return inquirer.prompt(selectFrontendHandler)
    .then((answers) => {
      context.initInfo.projectConfig.frontendHandler = {};
      context.initInfo.projectConfig.frontendHandler[answers.selectedFrontendHandler] =
        context.initInfo.frontendPlugins[answers.selectedFrontendHandler];
      delete context.initInfo.frontendPlugins;
      delete context.initInfo.suitableHandler;
      return context;
    });
}

module.exports = {
  run,
};
