const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');
const { getResourceOutputs } = require('../../extensions/amplify-helpers/get-resource-outputs');

function run(context) {
  const frontendPlugins = getFrontendPlugins(context);
  const currentSelected = context.exeInfo.projectConfig.frontendHandler;
  const currentHandlerName = Object.keys(currentSelected)[0];

  const frontendPluginMaps = Object.keys(frontendPlugins).map((pluginName) => {
    const pluginSplit = pluginName.split('-');
    const frameworkName = pluginSplit[2];
    return {
      name: frameworkName,
      value: pluginName,
    };
  });

  const selectFrontendHandler = {
    type: 'list',
    name: 'selectedFrontendHandler',
    message: "Choose the type of app that you're building",
    choices: frontendPluginMaps,
    default: currentHandlerName,
  };

  return inquirer.prompt(selectFrontendHandler)
    .then((answers) => {
      context.exeInfo.projectConfig.frontendHandler[answers.selectedFrontendHandler] =
              frontendPlugins[answers.selectedFrontendHandler];
      if (answers.selectedFrontendHandler !== currentHandlerName) {
        delete context.exeInfo.projectConfig.frontendHandler[currentHandlerName];
        delete context.exeInfo.projectConfig[currentHandlerName];
        const handlerModule = require(frontendPlugins[answers.selectedFrontendHandler]);
        return handlerModule.init(context)
          .then(() => handlerModule.createFrontendConfigs(context, getResourceOutputs()));
      }
      const handlerModule = require(frontendPlugins[answers.selectedFrontendHandler]);
      return handlerModule.configure(context);
    });
}

module.exports = {
  run,
};
