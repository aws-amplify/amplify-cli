const path = require('path');
const fs = require('fs-extra');

const initializer = require('./lib/initializer');
const projectScanner = require('./lib/project-scanner');
const configManager = require('./lib/configuration-manager');
const server = require('./lib/server');
const publisher = require('./lib/publisher');
const constants = require('./lib/constants');
const { createAWSExports, getAWSExports, deleteAmplifyConfig, generateAwsExportsAtPath } = require('./lib/frontend-config-creator');

const pluginName = 'javascript';

const emptyAwsExportsPath = path.join(__dirname, 'lib', 'aws-exports.empty.js');

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
 * @param {cloudMetaWithOutput} amplifyCloudResources
 * @param {string} exportPath path to where the files need to be written
 */
async function createFrontendConfigsAtPath(context, amplifyResources, amplifyCloudResources, exportPath) {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;

  const amplifyConfig = await getAWSExports(context, newOutputsForFrontend, cloudOutputsForFrontend);

  context.amplify.writeObjectAsJson(path.join(exportPath, constants.exportsJSONFilename), amplifyConfig, true);
  await generateAwsExportsAtPath(context, path.join(exportPath, constants.exportsJSFilename), amplifyConfig);
}

async function createFrontendConfigs(context, amplifyResources, amplifyCloudResources) {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;
  // createAmplifyConfig(context, outputsByCategory);
  return await createAWSExports(context, newOutputsForFrontend, cloudOutputsForFrontend);
}

function setFrontendDefaults(context, projectPath) {
  return configManager.setFrontendDefaults(context, projectPath);
}

function displayFrontendDefaults(context, projectPath) {
  return configManager.displayFrontendDefaults(context, projectPath);
}

const initializeAwsExports = (destDir) => {
  const dest = path.resolve(destDir, 'aws-exports.js');
  if (!fs.existsSync(dest)) {
    fs.copySync(emptyAwsExportsPath, dest);
  }
};

function configure(context) {
  return configManager.configure(context);
}

function publish(context) {
  return publisher.run(context);
}

function run(context) {
  return server.run(context);
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
  displayFrontendDefaults,
  setFrontendDefaults,
  publish,
  run,
  createFrontendConfigs,
  createFrontendConfigsAtPath,
  initializeAwsExports,
  executeAmplifyCommand,
  handleAmplifyEvent,
  deleteConfig: deleteAmplifyConfig,
};
