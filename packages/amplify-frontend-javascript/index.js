const path = require('path');
const fs = require('fs-extra');

const initializer = require('./lib/initializer');
const projectScanner = require('./lib/project-scanner');
const configManager = require('./lib/configuration-manager');
const server = require('./lib/server');
const publisher = require('./lib/publisher');
const constants = require('./lib/constants');
const {
  createAWSExports, getAWSExports, deleteAmplifyConfig, generateAwsExportsAtPath,
} = require('./lib/frontend-config-creator');

const pluginName = 'javascript';

const emptyAwsExportsPath = path.join(__dirname, 'lib', 'aws-exports.empty.js');

/**
 *
 */
const scanProject = projectPath => projectScanner.run(projectPath);

/**
 *
 */
const init = context => initializer.run(context);

/**
 *
 */
const onInitSuccessful = context => initializer.onInitSuccessful(context);

/**
 * This function enables export to write these files to an external path
 * @param {TSContext} context
 * @param {metaWithOutput} amplifyResources All resources in amplify-meta.json
 * @param {cloudMetaWithOutput} amplifyCloudResources
 * @param {string} exportPath path to where the files need to be written
 */
const createFrontendConfigsAtPath = async (context, amplifyResources, amplifyCloudResources, exportPath) => {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;

  const amplifyConfig = await getAWSExports(context, newOutputsForFrontend, cloudOutputsForFrontend);
  generateAwsExportsAtPath(context, path.join(exportPath, constants.exportsFilename), amplifyConfig);
};

/**
 *
 */
const createFrontendConfigs = async (context, amplifyResources, amplifyCloudResources) => {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;
  // createAmplifyConfig(context, outputsByCategory);
  const awsExports = await createAWSExports(context, newOutputsForFrontend, cloudOutputsForFrontend);
  return awsExports;
};

/**
 *
 */
const setFrontendDefaults = (context, projectPath) => configManager.setFrontendDefaults(context, projectPath);

/**
 *
 */
const displayFrontendDefaults = (context, projectPath) => configManager.displayFrontendDefaults(context, projectPath);

/**
 *
 */
const initializeAwsExports = destDir => {
  const dest = path.resolve(destDir, 'aws-exports.js');
  if (!fs.existsSync(dest)) {
    fs.copySync(emptyAwsExportsPath, dest);
  }
};

/**
 *
 */
const configure = context => configManager.configure(context);

/**
 *
 */
const publish = context => publisher.run(context);

/**
 *
 */
const run = context => server.run(context);

/**
 *
 */
const executeAmplifyCommand = async context => {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, pluginName);
  } else {
    commandPath = path.join(commandPath, pluginName, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
};

/**
 *
 */
const handleAmplifyEvent = async (context, args) => {
  context.print.info(`${pluginName} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
};

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
