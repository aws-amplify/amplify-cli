const inquirer = require('inquirer');

function run(context) {
  const frontEndPluginMap = Object.keys(context.initInfo.frontendPlugins).map((plugin) => {
    const pluginSplit = plugin.split('-');
    const frameWork = pluginSplit[2];
    return {
      name: frameWork,
      value: plugin,
    };
  });

  const selectFrontendHandler = {
    type: 'list',
    name: 'selectedFrontendHandler',
    message: "Please choose the type of app that you're building",
    choices: frontEndPluginMap,
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
    })
    .then((ctxt) => {
      const handlerName = Object.keys(context.initInfo.projectConfig.frontendHandler)[0];
      const frontendHandler = require(context.initInfo.projectConfig.frontendHandler[handlerName]);
      return frontendHandler.init(ctxt);
    });
}

module.exports = {
  run,
};
