const fs = require('fs-extra');
const sequential = require('promise-sequential');
const { CLIContextEnvironmentProvider, FeatureFlags } = require('amplify-cli-core');
const { getFrontendPlugins } = require('../extensions/amplify-helpers/get-frontend-plugins');
const { getProviderPlugins } = require('../extensions/amplify-helpers/get-provider-plugins');
const gitManager = require('../extensions/amplify-helpers/git-manager');
const { initializeEnv } = require('../initialize-env');
const { readJsonFile } = require('../extensions/amplify-helpers/read-json-file');

async function run(context) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const { amplify } = context;

  const amplifyDirPath = amplify.pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = amplify.pathManager.getDotConfigDirPath(projectPath);
  const backendDirPath = amplify.pathManager.getBackendDirPath(projectPath);
  const currentBackendDirPath = amplify.pathManager.getCurrentCloudBackendDirPath(projectPath);

  fs.ensureDirSync(amplifyDirPath);
  fs.ensureDirSync(dotConfigDirPath);
  fs.ensureDirSync(backendDirPath);
  fs.ensureDirSync(currentBackendDirPath);

  // Get current-cloud-backend's amplify-meta
  const currentAmplifyMetafilePath = amplify.pathManager.getCurrentAmplifyMetaFilePath();

  let currentAmplifyMeta = {};

  if (fs.existsSync(currentAmplifyMetafilePath)) {
    currentAmplifyMeta = readJsonFile(currentAmplifyMetafilePath);
  }

  const providerPlugins = getProviderPlugins(context);
  const providerOnSuccessTasks = [];

  const frontendPlugins = getFrontendPlugins(context);
  const frontendModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);

  await frontendModule.onInitSuccessful(context);

  generateLocalRuntimeFiles(context);
  generateNonRuntimeFiles(context);

  if (context.exeInfo.isNewProject) {
    // Initialize feature flags
    const contextEnvironmentProvider = new CLIContextEnvironmentProvider({
      getEnvInfo: context.amplify.getEnvInfo,
    });

    if (!FeatureFlags.isInitialized()) {
      await FeatureFlags.initialize(contextEnvironmentProvider, projectPath);
    }

    await FeatureFlags.ensureDefaultFeatureFlags(true);
  }

  context.exeInfo.projectConfig.providers.forEach(provider => {
    const providerModule = require(providerPlugins[provider]);
    providerOnSuccessTasks.push(() => providerModule.onInitSuccessful(context));
  });

  await sequential(providerOnSuccessTasks);

  await initializeEnv(context, currentAmplifyMeta);

  if (!context.parameters.options.app) {
    printWelcomeMessage(context);
  }
}

function generateLocalRuntimeFiles(context) {
  generateLocalEnvInfoFile(context);
  generateAmplifyMetaFile(context);
}

function generateLocalEnvInfoFile(context) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath(projectPath);
  context.amplify.writeObjectAsJson(localEnvFilePath, context.exeInfo.localEnvInfo, true);
}

function generateAmplifyMetaFile(context) {
  if (context.exeInfo.isNewEnv) {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const { pathManager, writeObjectAsJson } = context.amplify;
    const currentBackendMetaFilePath = pathManager.getCurrentAmplifyMetaFilePath(projectPath);
    const backendMetaFilePath = pathManager.getAmplifyMetaFilePath(projectPath);
    writeObjectAsJson(currentBackendMetaFilePath, context.exeInfo.amplifyMeta, true);
    writeObjectAsJson(backendMetaFilePath, context.exeInfo.amplifyMeta, true);
  }
}

function generateNonRuntimeFiles(context) {
  generateProjectConfigFile(context);
  generateBackendConfigFile(context);
  generateProviderInfoFile(context);
  generateGitIgnoreFile(context);
}

function generateProjectConfigFile(context) {
  // won't modify on new env
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath(projectPath);
    context.amplify.writeObjectAsJson(projectConfigFilePath, context.exeInfo.projectConfig, true);
  }
}

function generateProviderInfoFile(context) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  let teamProviderInfo = {};
  const providerInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath(projectPath);
  if (fs.existsSync(providerInfoFilePath)) {
    teamProviderInfo = readJsonFile(providerInfoFilePath);
    Object.assign(teamProviderInfo, context.exeInfo.teamProviderInfo);
  } else {
    ({ teamProviderInfo } = context.exeInfo);
  }
  context.amplify.writeObjectAsJson(providerInfoFilePath, teamProviderInfo, true);
}

function generateBackendConfigFile(context) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath(projectPath);
    context.amplify.writeObjectAsJson(backendConfigFilePath, {}, true);

  }
}

function generateGitIgnoreFile(context) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    const gitIgnoreFilePath = context.amplify.pathManager.getGitIgnoreFilePath(projectPath);

    gitManager.insertAmplifyIgnore(gitIgnoreFilePath);
  }
}

function printWelcomeMessage(context) {
  context.print.info('');
  context.print.success('Your project has been successfully initialized and connected to the cloud!');
  context.print.info('');
  context.print.success('Some next steps:');
  context.print.info('"amplify status" will show you what you\'ve added already and if it\'s locally configured or deployed');
  context.print.info('"amplify add <category>" will allow you to add features like user login or a backend API');
  context.print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
  context.print.info('"amplify console" to open the Amplify Console and view your project status');
  context.print.info(
    '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
  );
  context.print.info('');
  context.print.success('Pro tip:');
  context.print.info('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything');
  context.print.info('');
}

module.exports = {
  run,
  generateLocalEnvInfoFile,
};
