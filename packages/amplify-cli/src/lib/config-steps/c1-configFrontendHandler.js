const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');

function run(context) {
  const frontendPlugins = getFrontendPlugins(context);
  const currentSelected = context.exeInfo.projectConfig['frontendHandler'];
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
    message: 'Please select the proper frontend handler',
    choices: frontendPluginMaps,
    default: currentHandlerName,
  };

  return inquirer.prompt(selectFrontendHandler)
    .then((answers) => {
        if(answers.selectedFrontendHandler !== currentHandlerName){
            context.exeInfo.projectConfig['frontendHandler'][answers.selectedFrontendHandler] =
                frontendPlugins[answers.selectedFrontendHandler];
            delete context.exeInfo.projectConfig['frontendHandler'][currentHandlerName];
            delete context.exeInfo.projectConfig[currentHandlerName];
            const handlerModule = require(frontendPlugins[answers.selectedFrontendHandler]);
            return handlerModule.init(context); 
        }else{
            const handlerModule = require(frontendPlugins[answers.selectedFrontendHandler]);
            return handlerModule.configure(context); 
        }
    });
}

module.exports = {
  run,
};
