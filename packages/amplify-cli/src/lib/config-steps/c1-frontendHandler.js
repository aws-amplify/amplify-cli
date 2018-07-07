const inquirer = require('inquirer');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');

function run(context) {
  const frontendPlugins = getFrontendPlugins(context);
  const currentSelected = context.exeInfo.projectConfig['frontendHandler'];
  const currentHandlerName = Object.keys(currentSelected)[0]; 

  const selectFrontendHandler = {
    type: 'list',
    name: 'selectedFrontendHandler',
    message: 'Please select the proper frontend handler',
    choices: frontendPlugins,
    default: currentHandlerName,
  };

  return inquirer.prompt(selectFrontendHandler)
    .then((answers) => {
        if(answers.selectedFrontendHandler !== currentHandlerName){
            context.exeInfo.projectConfig['frontendHandler'] = {
                selectFrontendHandler: frontendPlugins[selectFrontendHandler]
            };
            const handlerModule = require(frontendPlugins[selectFrontendHandler]);
            return handlerModule.init(context); 
        }else{
            const handlerModule = require(frontendPlugins[selectFrontendHandler]);
            return handlerModule.configure(context); 
        }
    });
}

module.exports = {
  run,
};
