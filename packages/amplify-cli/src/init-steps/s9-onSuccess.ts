import * as fs from 'fs-extra';
import sequential from 'promise-sequential';
import { CLIContextEnvironmentProvider, FeatureFlags, pathManager, stateManager, $TSContext } from 'amplify-cli-core';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { insertAmplifyIgnore } from '../extensions/amplify-helpers/git-manager';
import { writeReadMeFile } from '../extensions/amplify-helpers/docs-manager';
import { initializeEnv } from '../initialize-env';
import _ from 'lodash';

export async function onHeadlessSuccess(context: $TSContext) {
  const frontendPlugins = getFrontendPlugins(context);
  const frontendModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
  await frontendModule.onInitSuccessful(context);
}

export async function onSuccess(context: $TSContext) {
  const { projectPath } = context.exeInfo.localEnvInfo;

  const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = pathManager.getDotConfigDirPath(projectPath);
  const backendDirPath = pathManager.getBackendDirPath(projectPath);
  const currentBackendDirPath = pathManager.getCurrentCloudBackendDirPath(projectPath);

  fs.ensureDirSync(amplifyDirPath);
  fs.ensureDirSync(dotConfigDirPath);
  fs.ensureDirSync(backendDirPath);
  fs.ensureDirSync(currentBackendDirPath);

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
      await FeatureFlags.initialize(contextEnvironmentProvider, true);
    }

    await FeatureFlags.ensureDefaultFeatureFlags(true);
  }

  context.exeInfo.projectConfig.providers.forEach(provider => {
    const providerModule = require(providerPlugins[provider]);
    providerOnSuccessTasks.push(() => providerModule.onInitSuccessful(context));
  });

  await sequential(providerOnSuccessTasks);

  // Get current-cloud-backend's amplify-meta
  const currentAmplifyMeta = stateManager.getCurrentMeta(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  await initializeEnv(context, currentAmplifyMeta);

  if (!context.parameters.options.app) {
    printWelcomeMessage(context);
  }
}

function generateLocalRuntimeFiles(context: $TSContext) {
  generateLocalEnvInfoFile(context);
  generateAmplifyMetaFile(context);
  generateLocalTagsFile(context);
}

export function generateLocalEnvInfoFile(context: $TSContext) {
  const { projectPath } = context.exeInfo.localEnvInfo;

  stateManager.setLocalEnvInfo(projectPath, context.exeInfo.localEnvInfo);
}

function generateLocalTagsFile(context: $TSContext) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    // Preserve existing tags if present
    const tags = stateManager.getProjectTags(projectPath);

    if (!tags.find(t => t.Key === 'user:Stack')) {
      tags.push({
        Key: 'user:Stack',
        Value: '{project-env}',
      });
    }

    if (!tags.find(t => t.Key === 'user:Application')) {
      tags.push({
        Key: 'user:Application',
        Value: '{project-name}',
      });
    }

    stateManager.setProjectFileTags(projectPath, tags);
  }
}

export function generateAmplifyMetaFile(context: $TSContext) {
  if (context.exeInfo.isNewEnv) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    stateManager.setCurrentMeta(projectPath, context.exeInfo.amplifyMeta);
    stateManager.setMeta(projectPath, context.exeInfo.amplifyMeta);
  }
}

function generateNonRuntimeFiles(context: $TSContext) {
  generateProjectConfigFile(context);
  generateBackendConfigFile(context);
  generateTeamProviderInfoFile(context);
  generateGitIgnoreFile(context);
  generateReadMeFile(context);
}

function generateProjectConfigFile(context: $TSContext) {
  // won't modify on new env
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    stateManager.setProjectConfig(projectPath, context.exeInfo.projectConfig);
  }
}

function generateTeamProviderInfoFile(context: $TSContext) {
  const { projectPath } = context.exeInfo.localEnvInfo;

  let teamProviderInfo = {};

  if (stateManager.teamProviderInfoExists(projectPath)) {
    teamProviderInfo = stateManager.getTeamProviderInfo(projectPath, {
      throwIfNotExist: false,
      default: {},
    });

    _.merge(teamProviderInfo, context.exeInfo.teamProviderInfo);
  } else {
    ({ teamProviderInfo } = context.exeInfo);
  }

  stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);
}

function generateBackendConfigFile(context: $TSContext) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    stateManager.setBackendConfig(projectPath, {});
  }
}

function generateGitIgnoreFile(context: $TSContext) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    const gitIgnoreFilePath = pathManager.getGitIgnoreFilePath(projectPath);

    insertAmplifyIgnore(gitIgnoreFilePath);
  }
}

function generateReadMeFile(context: $TSContext) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const readMeFilePath = pathManager.getReadMeFilePath(projectPath);
  writeReadMeFile(readMeFilePath);
}

function printWelcomeMessage(context: $TSContext) {
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
