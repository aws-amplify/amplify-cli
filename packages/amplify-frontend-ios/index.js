const path = require('path');
const fs = require('fs');
const { FeatureFlags, pathManager, JSONUtilities } = require('amplify-cli-core');
const { importConfig, importModels } = require('./lib/amplify-xcode');
const initializer = require('./lib/initializer');
const projectScanner = require('./lib/project-scanner');
const configManager = require('./lib/configuration-manager');
const constants = require('./lib/constants');
const { createAmplifyConfig, createAWSConfig, deleteAmplifyConfig } = require('./lib/frontend-config-creator');

const pluginName = 'ios';

function scanProject(projectPath) {
  return projectScanner.run(projectPath);
}

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function displayFrontendDefaults(context, projectPath) {
  return configManager.displayFrontendDefaults(context);
}

function setFrontendDefaults(context, projectPath) {
  return configManager.setFrontendDefaults(context);
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

const postInitQuickStart = projectPath => {
  const awsConfigFilePath = path.join(projectPath, 'awsconfiguration.json');
  const amplifyConfigFilePath = path.join(projectPath, 'amplifyconfiguration.json');
  if (!fs.existsSync(awsConfigFilePath)) {
    JSONUtilities.writeJson(awsConfigFilePath, {});
  }

  if (!fs.existsSync(amplifyConfigFilePath)) {
    JSONUtilities.writeJson(amplifyConfigFilePath, {});
  }
};

async function handleAmplifyEvent(context, args) {
  const { frontend } = context.amplify.getProjectConfig();
  const isXcodeIntegrationEnabled = FeatureFlags.getBoolean('frontend-ios.enableXcodeIntegration');
  const isFrontendiOS = frontend === 'ios';
  const isMacOs = process.platform === 'darwin';
  const successMessage = 'Amplify setup completed successfully.';
  if (!isFrontendiOS || !isXcodeIntegrationEnabled) {
    return;
  }
  // Xcode integration is a MacOS-only binary, skip on other platforms
  if (!isMacOs) {
    context.print.info('Skipping Xcode project setup.');
    context.print.info(successMessage);
    return;
  }
  context.print.info('Updating Xcode project:');
  const projectPath = pathManager.findProjectRoot();
  switch (args.event) {
    case 'PostInit':
      if (context.input && context.input.options && context.input.options.quickstart) {
        postInitQuickStart(projectPath);
      }
      await importConfig({ path: projectPath });
      break;
    case 'PostCodegenModels':
      await importModels({ path: projectPath });
      break;
    case 'PostPull':
      await importConfig({ path: projectPath });
      await importModels({ path: projectPath });
      break;
    default:
      break;
  }
  context.print.info(successMessage);
}

const getPackageAssetPaths = async () => ['resources'];

module.exports = {
  constants,
  scanProject,
  init,
  onInitSuccessful,
  displayFrontendDefaults,
  setFrontendDefaults,
  configure,
  publish,
  run,
  createFrontendConfigs,
  executeAmplifyCommand,
  handleAmplifyEvent,
  deleteConfig: deleteAmplifyConfig,
  getPackageAssetPaths,
};
