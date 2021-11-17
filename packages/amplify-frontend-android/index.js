const path = require('path');

const initializer = require('./lib/initializer');
const configManager = require('./lib/configuration-manager');
const projectScanner = require('./lib/project-scanner');
const constants = require('./lib/constants');
const {
  createAmplifyConfig,
  getAmplifyConfig,
  createAWSConfig,
  getNewAWSConfigObject,
  deleteAmplifyConfig,
  writeToFile,
} = require('./lib/frontend-config-creator');

const pluginName = 'android';

function scanProject(projectPath) {
  return projectScanner.run(projectPath);
}

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}
/**
 * This function enables export to write these files to an external path
 * @param {TSContext} context
 * @param {metaWithOutput} amplifyResources
 * @param {cloudMetaWithOuput} amplifyCloudResources
 * @param {string} exportPath path to where the files need to be written
 */
function createFrontendConfigsAtPath(context, amplifyResources, amplifyCloudResources, exportPath) {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;

  const amplifyConfig = getAmplifyConfig(context, newOutputsForFrontend, cloudOutputsForFrontend);
  writeToFile(exportPath, constants.amplifyConfigFilename, amplifyConfig);

  const awsConfig = getNewAWSConfigObject(context, newOutputsForFrontend, cloudOutputsForFrontend);
  writeToFile(exportPath, constants.awsConfigFilename, awsConfig);
}

function createFrontendConfigs(context, amplifyResources, amplifyCloudResources) {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;
  createAmplifyConfig(context, newOutputsForFrontend, cloudOutputsForFrontend);
  return createAWSConfig(context, newOutputsForFrontend, cloudOutputsForFrontend);
}

function configure(context) {
  return configManager.configure(context);
}

function publish(context) {
  return context;
}

function run(context) {
  return context;
}

function displayFrontendDefaults(context) {
  configManager.displayFrontendDefaults(context);
}

function setFrontendDefaults(context) {
  configManager.setFrontendDefaults(context);
}

async function executeAmplifyCommand(context) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, pluginName);
  } else {
    commandPath = path.join(commandPath, pluginName, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

async function handleAmplifyEvent(context, args) {
  context.print.info(`${pluginName} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}

module.exports = {
  constants,
  scanProject,
  init,
  onInitSuccessful,
  configure,
  publish,
  run,
  createFrontendConfigs,
  createFrontendConfigsAtPath,
  displayFrontendDefaults,
  setFrontendDefaults,
  executeAmplifyCommand,
  handleAmplifyEvent,
  deleteConfig: deleteAmplifyConfig,
};
