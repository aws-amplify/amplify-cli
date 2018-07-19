const fs = require('fs');
const path = require('path'); 
const initializer = require('./lib/initializer');
const configManager = require('./lib/configuration-manager');
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

function onCategoryOutputsChange(data){
  const { projectConfig,  categoryOutputs } = data; 
  const filePath = path.join(projectConfig.projectPath, constants.outputFileName); 
  const jsonString = JSON.stringify(categoryOutputs, null, 4);
  fs.writeFileSync(filePath, jsonString, 'utf8');
}

function configure(context){
  return configManager.configure(context);
}

function publish(context){
  return context; 
}

function run(context){
  return context; 
}

module.exports = {
  constants,
  scanProject,
  init,
  onInitSuccessful, 
  configure,
  publish,
  run,
  onCategoryOutputsChange
};
