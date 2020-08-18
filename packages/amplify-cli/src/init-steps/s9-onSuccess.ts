import * as fs from 'fs-extra';
import sequential from 'promise-sequential';
import { CLIContextEnvironmentProvider, FeatureFlags } from 'amplify-cli-core';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { insertAmplifyIgnore } from '../extensions/amplify-helpers/git-manager';
import { initializeEnv } from '../initialize-env';
import { readJsonFile } from '../extensions/amplify-helpers/read-json-file';

export async function onSuccess(context) {
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
  const providerOnSuccessTasks: (() => Promise<any>)[] = [];

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

export function generateLocalEnvInfoFile(context) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const jsonString = JSON.stringify(context.exeInfo.localEnvInfo, null, 4);
  const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath(projectPath);
  fs.writeFileSync(localEnvFilePath, jsonString, 'utf8');
}

function generateAmplifyMetaFile(context) {
  if (context.exeInfo.isNewEnv) {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const jsonString = JSON.stringify(context.exeInfo.amplifyMeta, null, 4);
    const currentBackendMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath(projectPath);
    fs.writeFileSync(currentBackendMetaFilePath, jsonString, 'utf8');
    const backendMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(projectPath);
    fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');
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
    const jsonString = JSON.stringify(context.exeInfo.projectConfig, null, 4);
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath(projectPath);
    fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');
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

  const jsonString = JSON.stringify(teamProviderInfo, null, 4);
  fs.writeFileSync(providerInfoFilePath, jsonString, 'utf8');
}

function generateBackendConfigFile(context) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath(projectPath);
    fs.writeFileSync(backendConfigFilePath, '{}', 'utf8');
  }
}

function generateGitIgnoreFile(context) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    const gitIgnoreFilePath = context.amplify.pathManager.getGitIgnoreFilePath(projectPath);

    insertAmplifyIgnore(gitIgnoreFilePath);
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
