const initializer = require('./lib/initializer');
const projectScanner = require('./lib/project-scanner'); 
const constants = require('./lib/constants'); 


function scanProject(projectPath){
  return projectScanner.run(projectPath); 
}

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function onCategoryOutputsChange(context){

}

module.exports = {
  constants,
  scanProject,
  init,
  onInitSuccessful, 
  onCategoryOutputsChange
};
