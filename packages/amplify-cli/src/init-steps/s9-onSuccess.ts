import * as fs from 'fs-extra';
import { join } from 'path';
import sequential from 'promise-sequential';
import { CLIContextEnvironmentProvider, FeatureFlags, pathManager, stateManager, $TSContext, $TSAny } from '@aws-amplify/amplify-cli-core';
import _ from 'lodash';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { insertAmplifyIgnore } from '../extensions/amplify-helpers/git-manager';
import { writeReadMeFile } from '../extensions/amplify-helpers/docs-manager';
import { initializeEnv } from '../initialize-env';
import { DebugConfig } from '../app-config/debug-config';

/**
 * Executes after headless init
 */
export const onHeadlessSuccess = async (context: $TSContext): Promise<void> => {
  const frontendPlugins = getFrontendPlugins(context);
  const frontendModule = await import(frontendPlugins[context.exeInfo.projectConfig.frontend]);
  await frontendModule.onInitSuccessful(context);
};

/**
 * Executes at the end of headless init
 */
export const onSuccess = async (context: $TSContext): Promise<void> => {
  const { projectPath } = context.exeInfo.localEnvInfo;

  const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = pathManager.getDotConfigDirPath(projectPath);
  const backendDirPath = pathManager.getBackendDirPath(projectPath);
  const currentBackendDirPath = pathManager.getCurrentCloudBackendDirPath(projectPath);

  if (context.exeInfo.isNewProject) {
    fs.ensureDirSync(amplifyDirPath);
    fs.ensureDirSync(dotConfigDirPath);
    fs.ensureDirSync(backendDirPath);
    fs.ensureDirSync(currentBackendDirPath);
  } else {
    // new env init. cleanup currentCloudBackend dir
    fs.emptyDirSync(currentBackendDirPath);
  }

  const providerPlugins = getProviderPlugins(context);
  const providerOnSuccessTasks: (() => Promise<$TSAny>)[] = [];

  const frontendPlugins = getFrontendPlugins(context);
  // eslint-disable-next-line
  const frontendModule = await import(frontendPlugins[context.exeInfo.projectConfig.frontend]);

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
    const result = await prompter.yesOrNo('Help improve Amplify CLI by sharing non sensitive configurations on failures', false);
    const actualResult = context.exeInfo.inputParams.yes ? undefined : result;
    DebugConfig.Instance.setAndWriteShareProject(actualResult);
  }

  for (const provider of context.exeInfo.projectConfig.providers) {
    // eslint-disable-next-line
    const providerModule = await import(providerPlugins[provider]);
    providerOnSuccessTasks.push(() => providerModule.onInitSuccessful(context));
  }

  await sequential(providerOnSuccessTasks);

  // Get current-cloud-backend's amplify-meta
  const currentAmplifyMeta = stateManager.getCurrentMeta(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  await initializeEnv(context, currentAmplifyMeta);

  if (!context.parameters.options?.app) {
    printWelcomeMessage(context);
  }

  const appId = currentAmplifyMeta?.providers?.awscloudformation?.AmplifyAppId;

  if (!appId) {
    printer.warn('The maximum number of apps that you can create with Amplify in this region has likely been reached:');
    printer.info('For more information on Amplify Service Quotas, see:');
    printer.info('https://docs.aws.amazon.com/general/latest/gr/amplify.html#service-quotas-amplify');
    printer.blankLine();
  }
};

const generateLocalRuntimeFiles = (context: $TSContext): void => {
  generateLocalEnvInfoFile(context);
  generateAmplifyMetaFile(context);
  generateLocalTagsFile(context);
};

/**
 * Create local env file on env init
 */
export const generateLocalEnvInfoFile = (context: $TSContext): void => {
  const { projectPath } = context.exeInfo.localEnvInfo;

  stateManager.setLocalEnvInfo(projectPath, context.exeInfo.localEnvInfo);
};

const generateLocalTagsFile = (context: $TSContext): void => {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    // Preserve existing tags if present
    const tags = stateManager.getProjectTags(projectPath);

    if (!tags.find((t) => t.Key === 'user:Stack')) {
      tags.push({
        Key: 'user:Stack',
        Value: '{project-env}',
      });
    }

    if (!tags.find((t) => t.Key === 'user:Application')) {
      tags.push({
        Key: 'user:Application',
        Value: '{project-name}',
      });
    }

    stateManager.setProjectFileTags(projectPath, tags);
  }
};

/**
 * Create amplify-meta.json on env init
 */
export const generateAmplifyMetaFile = (context: $TSContext): void => {
  if (context.exeInfo.isNewEnv) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    stateManager.setCurrentMeta(projectPath, context.exeInfo.amplifyMeta);
    stateManager.setMeta(projectPath, context.exeInfo.amplifyMeta);
  }
};

const generateNonRuntimeFiles = (context: $TSContext): void => {
  generateProjectConfigFile(context);
  generateBackendConfigFile(context);
  generateTeamProviderInfoFile(context);
  generateGitIgnoreFile(context);
  generateReadMeFile(context);
  generateHooksSampleDirectory(context);
};

const generateProjectConfigFile = (context: $TSContext): void => {
  // won't modify on new env
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    stateManager.setProjectConfig(projectPath, context.exeInfo.projectConfig);
  }
};

const generateTeamProviderInfoFile = (context: $TSContext): void => {
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
};

const generateBackendConfigFile = (context: $TSContext): void => {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    stateManager.setBackendConfig(projectPath, {});
  }
};

const generateGitIgnoreFile = (context: $TSContext): void => {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    const gitIgnoreFilePath = pathManager.getGitIgnoreFilePath(projectPath);

    insertAmplifyIgnore(gitIgnoreFilePath);
  }
};

const generateReadMeFile = (context: $TSContext): void => {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const readMeFilePath = pathManager.getReadMeFilePath(projectPath);
  writeReadMeFile(readMeFilePath);
};

const generateHooksSampleDirectory = (context: $TSContext): void => {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const sampleHookScriptsDirPath = join(__dirname, '..', '..', 'resources', 'sample-hooks');

  stateManager.setSampleHooksDir(projectPath, sampleHookScriptsDirPath);
};

const printWelcomeMessage = (context: $TSContext): void => {
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
  context.print.info('Try "amplify add api" to create a backend API and then "amplify push" to deploy everything');
  context.print.info('');
};
