const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');

function run(context) {
  if (!context.exeInfo.isNewProject) {
    const currentProjectConfig = context.amplify.getProjectConfig();
    Object.assign(currentProjectConfig, context.exeInfo.projectConfig);
    context.exeInfo.projectConfig = currentProjectConfig;
    return context;
  }


  const frontendPlugins = getFrontendPlugins(context);
  let suitableHandler;
  let fitToHandleScore = -1;

  Object.keys(frontendPlugins).forEach((key) => {
    const { scanProject } = require(frontendPlugins[key]);
    const newScore = scanProject(context.exeInfo.localEnvInfo.projectPath);
    if (newScore > fitToHandleScore) {
      fitToHandleScore = newScore;
      suitableHandler = key;
    }
  });

  const frontEndPluginMap = Object.keys(frontendPlugins).map((plugin) => {
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
    message: "Choose the type of app that you're building",
    choices: frontEndPluginMap,
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
      const handler = require(Object.values(context.exeInfo.projectConfig.frontendHandler)[0]);
      return handler.init(ctxt);
    });
}

module.exports = {
  run,
};
