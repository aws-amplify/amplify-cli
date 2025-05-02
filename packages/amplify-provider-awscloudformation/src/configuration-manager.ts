import {
  exitOnNextTick,
  JSONUtilities,
  pathManager,
  stateManager,
  $TSAny,
  $TSContext,
  AmplifyError,
  LocalEnvInfo,
} from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';
import chalk from 'chalk';
import { prompt } from 'inquirer';
import _ from 'lodash';
import path from 'path';
import { ProxyAgent } from 'proxy-agent';
import { STS } from 'aws-sdk';
import awsRegions from './aws-regions';
import constants from './constants';
import * as setupNewUser from './setup-new-user';
import obfuscateUtil from './utility-obfuscate';
import * as systemConfigManager from './system-config-manager';
import { doAdminTokensExist, getTempCredsWithAdminTokens, isAmplifyAdminApp } from './utils/admin-helpers';
import { resolveAppId } from './utils/resolve-appId';
import { AuthFlow, AuthFlowConfig, AwsSdkConfig } from './utils/auth-types';
import {
  accessKeysQuestion,
  authTypeQuestion,
  createConfirmQuestion,
  profileNameQuestion,
  removeProjectConfirmQuestion,
  updateOrRemoveQuestion,
  retryAuthConfig,
} from './question-flows/configuration-questions';

interface AwsConfig extends AwsSecrets {
  useProfile?: boolean;
  profileName?: string;
  awsConfigFilePath?: string;
}

type ProjectType = 'amplifyAdmin' | 'general' | 'project';
interface ProjectConfig {
  configLevel: ProjectType;
  config?: AwsConfig;
}

export interface AwsSecrets {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

const defaultAWSConfig: AwsConfig = {
  useProfile: true,
  profileName: 'default',
};

export async function init(context: $TSContext) {
  if (context.exeInfo.existingLocalEnvInfo?.noUpdateBackend || (!context.exeInfo.isNewProject && doesAwsConfigExists(context))) {
    return context;
  }
  normalizeInputParams(context);

  const authTypeConfig = await determineAuthFlow(context);
  if (authTypeConfig.type === 'admin') {
    context.exeInfo.awsConfigInfo = {
      configLevel: 'amplifyAdmin',
      config: {},
    };
  } else if (authTypeConfig.type === 'accessKeys') {
    context.exeInfo.awsConfigInfo = {
      configLevel: 'project',
      config: { useProfile: false },
    };
  } else if (authTypeConfig.type === 'general') {
    context.exeInfo.awsConfigInfo = {
      configLevel: 'general',
      config: {},
    };
  } else {
    context.exeInfo.awsConfigInfo = {
      configLevel: 'project',
      config: defaultAWSConfig,
    };
    await newUserCheck(context);
  }

  return await initialize(context, authTypeConfig);
}

export async function configure(context: $TSContext) {
  context.exeInfo = context.exeInfo || context.amplify.getProjectDetails();
  normalizeInputParams(context);
  context.exeInfo.awsConfigInfo = getCurrentConfig(context);
  if (context.exeInfo.inputParams.containerSetting) {
    await enableServerlessContainers(context);
  }

  if (context.exeInfo.inputParams.profileSetting) {
    await newUserCheck(context);
    printProfileInfo(context);
    await setProjectConfigAction(context);
    return await carryOutConfigAction(context);
  }
  return undefined;
}

async function enableServerlessContainers(context: $TSContext) {
  const { frontend } = context.exeInfo.projectConfig;
  const { config = {} } = context.exeInfo.projectConfig[frontend] || {};
  // TODO: check for headless mode parameter to avoid the question
  const { ServerlessContainers } = await prompt({
    type: 'confirm',
    name: 'ServerlessContainers',
    message: 'Do you want to enable container-based deployments?',
    default: config.ServerlessContainers === true,
  });

  if (!context.exeInfo.projectConfig[frontend]) {
    context.exeInfo.projectConfig[frontend] = { config };
  }

  context.exeInfo.projectConfig[frontend].config = { ...config, ServerlessContainers };
}

function doesAwsConfigExists(context: $TSContext) {
  let configExists = false;
  const { envName } = context?.exeInfo?.localEnvInfo || context.amplify.getEnvInfo();

  if (stateManager.localAWSInfoExists()) {
    const envAwsInfo = stateManager.getLocalAWSInfo();
    if (envAwsInfo[envName]) {
      context.exeInfo ??= { inputParams: {}, localEnvInfo: {} as unknown as LocalEnvInfo };
      context.exeInfo.awsConfigInfo = envAwsInfo[envName];
      context.exeInfo.awsConfigInfo.config = envAwsInfo[envName];
      configExists = true;
    }
  }

  return configExists;
}

function normalizeInputParams(context: $TSContext) {
  let inputParams: $TSAny;
  if (context.exeInfo.inputParams) {
    if (context.exeInfo.inputParams[constants.ProviderName]) {
      inputParams = context.exeInfo.inputParams[constants.ProviderName];
    } else {
      for (const alias of constants.Aliases) {
        if (context.exeInfo.inputParams[alias]) {
          inputParams = context.exeInfo.inputParams[alias];
          break;
        }
      }
    }
  }

  if (inputParams) {
    const normalizedInputParams: ProjectConfig = { configLevel: undefined };

    if (inputParams?.configLevel === 'general') {
      normalizedInputParams.configLevel = 'general';
    } else {
      delete inputParams.configLevel;
      normalizedInputParams.configLevel = 'project';
      normalizedInputParams.config = inputParams;
    }

    if (normalizedInputParams.configLevel === 'project') {
      let errorMessage: string;
      if (!normalizedInputParams.config || Object.keys(normalizedInputParams.config).length < 1) {
        errorMessage = 'configLevel set to "project" but project level config is missing.';
      } else {
        if (!normalizedInputParams.config.useProfile) {
          normalizedInputParams.config.useProfile = false;
        }
        if (normalizedInputParams.config.useProfile) {
          if (!normalizedInputParams.config.profileName) {
            errorMessage = 'project level config set useProfile to true, but profile name is missing.';
          }
        } else if (
          !normalizedInputParams.config.accessKeyId ||
          !normalizedInputParams.config.secretAccessKey ||
          !normalizedInputParams.config.region
        ) {
          errorMessage = 'project level config set useProfile to false, but access key or region is missing.';
        }
      }
      if (errorMessage) {
        throw new AmplifyError('ConfigurationError', {
          message: 'Error in the command line parameter for awscloudformation configuration.',
          details: errorMessage,
        });
      }
    }
    context.exeInfo.inputParams[constants.ProviderName] = normalizedInputParams;
  }
}

async function carryOutConfigAction(context: $TSContext) {
  let result: $TSAny;
  switch (context.exeInfo.awsConfigInfo.action) {
    case 'init':
      result = await initialize(context);
      break;
    case 'create':
      result = await create(context);
      break;
    case 'update':
      result = await update(context);
      break;
    case 'remove':
      result = await remove(context);
      break;
    default:
      result = context;
  }

  return result;
}

async function initialize(context: $TSContext, authConfig?: AuthFlowConfig) {
  const { awsConfigInfo } = context.exeInfo;
  if (authConfig?.type === 'accessKeys') {
    if (
      (awsConfigInfo.config?.accessKeyId && awsConfigInfo.config?.secretAccessKey) ||
      (authConfig?.accessKeyId && authConfig?.secretAccessKey)
    ) {
      awsConfigInfo.config.accessKeyId = awsConfigInfo.config.accessKeyId || authConfig.accessKeyId;
      awsConfigInfo.config.secretAccessKey = awsConfigInfo.config.secretAccessKey || authConfig.secretAccessKey;
      awsConfigInfo.config.sessionToken = awsConfigInfo.config.sessionToken || authConfig.sessionToken;
      awsConfigInfo.config.region = awsConfigInfo.config.region || authConfig.region;
    } else {
      await promptForAuthConfig(context, authConfig);
    }
  } else if (awsConfigInfo.configLevel !== 'amplifyAdmin') {
    if (context.exeInfo.inputParams && context.exeInfo.inputParams[constants.ProviderName]) {
      const inputParams = context.exeInfo.inputParams[constants.ProviderName];
      Object.assign(awsConfigInfo, inputParams);
    } else if (awsConfigInfo.configLevel === 'project' && (!context.exeInfo.inputParams || !context.exeInfo.inputParams.yes)) {
      await promptForAuthConfig(context, authConfig);
    }
  }

  await validateConfig(context);
  if (!awsConfigInfo.configValidated) {
    context.print.error('Invalid configuration settings!');
    const { retryConfirmation } = await prompt(retryAuthConfig);
    if (retryConfirmation) {
      // Cleaning up broken configurations
      if (authConfig.type === 'admin') {
        context.exeInfo.awsConfigInfo = {
          configLevel: 'amplifyAdmin',
          config: {},
        };
      } else if (authConfig.type === 'accessKeys') {
        context.exeInfo.awsConfigInfo = {
          configLevel: 'project',
          config: { useProfile: false },
        };
      } else {
        context.exeInfo.awsConfigInfo = {
          configLevel: 'project',
          config: defaultAWSConfig,
        };
      }

      return initialize(context, authConfig);
    }
    context.print.error('Exiting...');
    exitOnNextTick(1);
  }

  return context;
}

export function onInitSuccessful(context: $TSContext) {
  if (context.exeInfo.isNewEnv || !doesAwsConfigExists(context)) {
    persistLocalEnvConfig(context);
  }
  return context;
}

async function create(context: $TSContext) {
  const { awsConfigInfo } = context.exeInfo;
  if (context.exeInfo.inputParams[constants.ProviderName]) {
    const inputParams = context.exeInfo.inputParams[constants.ProviderName];
    Object.assign(awsConfigInfo, inputParams);
  } else {
    await promptForAuthConfig(context);
  }

  await validateConfig(context);
  if (awsConfigInfo.configValidated) {
    persistLocalEnvConfig(context);
  } else {
    throw new AmplifyError('ConfigurationError', {
      message: 'Invalid configuration settings.',
    });
  }
  return context;
}

async function update(context: $TSContext) {
  const { awsConfigInfo } = context.exeInfo;
  if (context.exeInfo.inputParams[constants.ProviderName]) {
    const inputParams = context.exeInfo.inputParams[constants.ProviderName];
    Object.assign(awsConfigInfo, inputParams);
  } else {
    await promptForAuthConfig(context);
  }
  await validateConfig(context);
  if (awsConfigInfo.configValidated) {
    updateProjectConfig(context);
  } else {
    throw new AmplifyError('ConfigurationError', {
      message: 'Invalid configuration settings.',
    });
  }
  return context;
}

async function remove(context: $TSContext) {
  const { awsConfigInfo } = context.exeInfo;
  await confirmProjectConfigRemoval(context);
  if (awsConfigInfo.action !== 'cancel') {
    removeProjectConfig(context.amplify.getEnvInfo().envName);
  }
  return context;
}

function printProfileInfo(context: $TSContext) {
  const url = 'https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html';
  context.print.info('');
  context.print.info('For more information on AWS Profiles, see:');
  context.print.info(chalk.green(url));
  context.print.info('');
}

async function setProjectConfigAction(context: $TSContext) {
  if (context.exeInfo.inputParams[constants.ProviderName]) {
    const inputParams = context.exeInfo.inputParams[constants.ProviderName];

    if (context.exeInfo.awsConfigInfo.configLevel === 'project') {
      if (inputParams.configLevel === 'project') {
        context.exeInfo.awsConfigInfo.action = 'update';
      } else {
        context.exeInfo.awsConfigInfo.action = 'remove';
      }
    } else if (inputParams.configLevel === 'project') {
      context.exeInfo.awsConfigInfo.action = 'create';
      context.exeInfo.awsConfigInfo.configLevel = 'project';
    } else {
      context.exeInfo.awsConfigInfo.action = 'none';
      context.exeInfo.awsConfigInfo.configLevel = 'general';
    }
  } else {
    context.exeInfo.awsConfigInfo.action = 'none';
    context.print.info('For the awscloudformation provider.');
    if (context.exeInfo.awsConfigInfo.configLevel === 'project') {
      const answer = await prompt(updateOrRemoveQuestion);
      context.exeInfo.awsConfigInfo.action = answer.action;
    } else {
      const answer = await prompt(createConfirmQuestion);
      if (answer.setProjectLevelConfig) {
        context.exeInfo.awsConfigInfo.action = 'create';
        context.exeInfo.awsConfigInfo.configLevel = 'project';
      } else {
        context.exeInfo.awsConfigInfo.action = 'none';
        context.exeInfo.awsConfigInfo.configLevel = 'general';
      }
    }
  }
  return context;
}

async function confirmProjectConfigRemoval(context: $TSContext) {
  if (!context.exeInfo.inputParams.yes) {
    const answer = await prompt(removeProjectConfirmQuestion);
    context.exeInfo.awsConfigInfo.action = answer.removeProjectConfig ? 'remove' : 'cancel';
  }
  return context;
}

async function promptForAuthConfig(context: $TSContext, authConfig?: AuthFlowConfig): Promise<void> {
  const { awsConfigInfo } = context.exeInfo;

  let availableProfiles = [];
  const namedProfiles = systemConfigManager.getNamedProfiles();
  if (namedProfiles) {
    availableProfiles = Object.keys(namedProfiles);
  }

  let answers: $TSAny;

  if (availableProfiles && availableProfiles.length > 0) {
    let authType: AuthFlow;
    let isAdminApp = false;

    if (authConfig?.type) {
      authType = authConfig.type;
    } else {
      try {
        const appId = resolveAppId(context);
        isAdminApp = (await isAmplifyAdminApp(appId))?.isAdminApp || false;
      } catch {
        isAdminApp = false;
      }
      authType = await askAuthType(isAdminApp);
    }

    if (authType === 'profile') {
      printProfileInfo(context);
      awsConfigInfo.config.useProfile = true;
      answers = await prompt(profileNameQuestion(availableProfiles, awsConfigInfo.config.profileName));
      awsConfigInfo.config.profileName = answers.profileName;
      return;
    }

    if (authType === 'admin') {
      awsConfigInfo.configLevel = 'amplifyAdmin';
      awsConfigInfo.config.useProfile = false;
      return;
    }
    awsConfigInfo.config.useProfile = false;
    delete awsConfigInfo.config.profileName;
  } else {
    awsConfigInfo.config.useProfile = false;
  }

  answers = await prompt(
    accessKeysQuestion(
      awsConfigInfo.config.accessKeyId ? obfuscateUtil.obfuscate(awsConfigInfo.config.accessKeyId) : constants.DefaultAWSAccessKeyId,
      awsConfigInfo.config.secretAccessKey
        ? obfuscateUtil.obfuscate(awsConfigInfo.config.secretAccessKey)
        : constants.DefaultAWSSecretAccessKey,
      awsConfigInfo.config.region || constants.DefaultAWSRegion,
      validateAccessKeyId,
      validateSecretAccessKey,
      obfuscateUtil.transform,
    ),
  );
  if (!obfuscateUtil.isObfuscated(answers.accessKeyId)) {
    awsConfigInfo.config.accessKeyId = answers.accessKeyId;
  }
  if (!obfuscateUtil.isObfuscated(answers.secretAccessKey)) {
    awsConfigInfo.config.secretAccessKey = answers.secretAccessKey;
  }
  awsConfigInfo.config.sessionToken = awsConfigInfo.config.sessionToken || process.env.AWS_SESSION_TOKEN;
  awsConfigInfo.config.region = answers.region;
}

async function validateConfig(context: $TSContext) {
  const { awsConfigInfo } = context.exeInfo;
  awsConfigInfo.configValidated = false;
  if (awsConfigInfo.configLevel === 'general' || awsConfigInfo.configLevel === 'amplifyAdmin') {
    awsConfigInfo.configValidated = true;
  } else if (awsConfigInfo.config) {
    if (awsConfigInfo.config.useProfile) {
      if (awsConfigInfo.config.profileName && awsConfigInfo.config.profileName.length > 0) {
        awsConfigInfo.configValidated = true;
      }
    } else {
      awsConfigInfo.configValidated =
        awsConfigInfo.config.accessKeyId &&
        awsConfigInfo.config.accessKeyId !== constants.DefaultAWSAccessKeyId &&
        awsConfigInfo.config.secretAccessKey &&
        awsConfigInfo.config.secretAccessKey !== constants.DefaultAWSSecretAccessKey &&
        awsConfigInfo.config.region &&
        awsRegions.regions.includes(awsConfigInfo.config.region);
      const sts = new STS({
        credentials: {
          accessKeyId: awsConfigInfo.config.accessKeyId,
          secretAccessKey: awsConfigInfo.config.secretAccessKey,
          sessionToken: awsConfigInfo.config.sessionToken,
        },
      });
      try {
        await sts.getCallerIdentity({}).promise();
      } catch (err) {
        awsConfigInfo.configValidated = false;
      }
    }
  }
  return context;
}

function persistLocalEnvConfig(context: $TSContext) {
  let { awsConfigInfo } = context.exeInfo;
  const { appId } = _.get(context, ['exeInfo', 'inputParams', 'amplify'], {});
  if (appId && doAdminTokensExist(appId)) {
    awsConfigInfo = {
      configLevel: 'amplifyAdmin',
      config: {},
    };
  }

  const awsInfo: AwsConfig & Pick<ProjectConfig, 'configLevel'> = {
    configLevel: awsConfigInfo.configLevel,
  };

  if (awsConfigInfo.configLevel === 'general') {
    awsInfo.configLevel = 'general';
  } else if (awsConfigInfo.configLevel === 'amplifyAdmin') {
    awsInfo.configLevel = 'amplifyAdmin';
  } else {
    awsInfo.configLevel = 'project';
    if (awsConfigInfo.config.useProfile) {
      awsInfo.useProfile = true;
      awsInfo.profileName = awsConfigInfo.config.profileName;
    } else {
      awsInfo.useProfile = false;
      const awsSecrets = {
        accessKeyId: awsConfigInfo.config.accessKeyId,
        secretAccessKey: awsConfigInfo.config.secretAccessKey,
        sessionToken: awsConfigInfo.config.sessionToken,
        region: awsConfigInfo.config.region,
      };
      const sharedConfigDirPath = path.join(pathManager.getHomeDotAmplifyDirPath(), constants.ProviderName);
      fs.ensureDirSync(sharedConfigDirPath);
      const awsSecretsFileName = context.amplify.makeId(10);
      const awsSecretsFilePath = path.join(sharedConfigDirPath, awsSecretsFileName);
      JSONUtilities.writeJson(awsSecretsFilePath, awsSecrets);

      awsInfo.awsConfigFilePath = awsSecretsFilePath;
    }
  }

  const dotConfigDirPath = pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);
  const { envName } = context.exeInfo.localEnvInfo;

  let envAwsInfo = {};
  if (fs.existsSync(configInfoFilePath)) {
    envAwsInfo = JSONUtilities.readJson(configInfoFilePath);
  }

  envAwsInfo[envName] = awsInfo;
  JSONUtilities.writeJson(configInfoFilePath, envAwsInfo);
  return context;
}

function getCurrentConfig(context: $TSContext) {
  const { envName }: { envName: string } = context.amplify.getEnvInfo();
  return getConfigForEnv(context, envName);
}

function getConfigForEnv(context: $TSContext, envName: string) {
  const projectConfigInfo: ProjectConfig = _.cloneDeep(context?.exeInfo?.awsConfigInfo) || {
    configLevel: 'general',
    config: {},
  };
  if (typeof context?.exeInfo?.inputParams?.awscloudformation === 'object') {
    const config = context?.exeInfo?.inputParams?.awscloudformation;
    projectConfigInfo.configLevel = config.configLevel || 'general';
    projectConfigInfo.config = config;
  }
  const dotConfigDirPath = pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);

  if (fs.existsSync(configInfoFilePath)) {
    const configInfo = JSONUtilities.readJson(configInfoFilePath)[envName];
    if (configInfo && configInfo.configLevel !== 'general' && configInfo.configLevel !== 'amplifyAdmin') {
      if (configInfo.useProfile && configInfo.profileName) {
        projectConfigInfo.config.useProfile = configInfo.useProfile;
        projectConfigInfo.config.profileName = configInfo.profileName;
      } else if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
        const awsSecrets = JSONUtilities.readJson<AwsSecrets>(configInfo.awsConfigFilePath);
        projectConfigInfo.config.useProfile = false;
        projectConfigInfo.config.awsConfigFilePath = configInfo.awsConfigFilePath;
        projectConfigInfo.config.accessKeyId = awsSecrets.accessKeyId;
        projectConfigInfo.config.secretAccessKey = awsSecrets.secretAccessKey;
        projectConfigInfo.config.region = awsSecrets.region;
      } else {
        throw new AmplifyError('ConfigurationError', {
          message: `Corrupt file contents in ${configInfoFilePath}`,
        });
      }
      projectConfigInfo.configLevel = 'project';
    } else if (configInfo) {
      projectConfigInfo.configLevel = configInfo.configLevel;
    }
  }
  return projectConfigInfo;
}

function updateProjectConfig(context: $TSContext) {
  removeProjectConfig(context.amplify.getEnvInfo().envName);
  persistLocalEnvConfig(context);
  return context;
}

function removeProjectConfig(envName: string) {
  const dotConfigDirPath = pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);
  if (fs.existsSync(configInfoFilePath)) {
    const configInfo = JSONUtilities.readJson(configInfoFilePath);
    if (configInfo[envName]) {
      if (configInfo[envName].awsConfigFilePath && fs.existsSync(configInfo[envName].awsConfigFilePath)) {
        fs.removeSync(configInfo[envName].awsConfigFilePath);
      }
      configInfo[envName] = {
        configLevel: 'general',
      };
    }
    JSONUtilities.writeJson(configInfoFilePath, configInfo);
  }
}

export async function loadConfiguration(context: $TSContext): Promise<AwsSecrets> {
  const envName = stateManager.getCurrentEnvName() || context?.exeInfo?.inputParams?.amplify?.envName;
  const config = await loadConfigurationForEnv(context, envName);
  return config;
}

function loadConfigFromPath(profilePath: string): AwsSdkConfig {
  if (fs.existsSync(profilePath)) {
    const config = JSONUtilities.readJson<AwsSdkConfig>(profilePath);
    if (config.accessKeyId && config.secretAccessKey && config.region) {
      return config;
    }
  }
  throw new AmplifyError('ConfigurationError', {
    message: `Invalid config ${profilePath}`,
  });
}

export async function loadConfigurationForEnv(context: $TSContext, env: string, appId?: string): Promise<AwsSdkConfig> {
  const { awsConfigInfo } = context.exeInfo || {};

  if (awsConfigInfo?.config?.accessKeyId && awsConfigInfo?.config?.secretAccessKey) {
    // Already loaded config
    if (!awsConfigInfo.region && !awsConfigInfo?.config?.region) {
      awsConfigInfo.region = resolveRegion();
      if (typeof awsConfigInfo.config === 'object') {
        awsConfigInfo.config.region = awsConfigInfo.region;
      }
    }

    return awsConfigInfo.config;
  }

  const projectConfigInfo = getConfigForEnv(context, env);
  const authType = await determineAuthFlow(context, projectConfigInfo);
  let awsConfig: AwsSdkConfig;

  if (authType.type === 'admin') {
    projectConfigInfo.configLevel = 'amplifyAdmin';
    appId = appId || authType.appId;

    try {
      awsConfig = await getTempCredsWithAdminTokens(context, appId);
    } catch (err) {
      throw new AmplifyError(
        'ProfileConfigurationError',
        {
          message: 'Failed to get AWS credentials',
          details: err.message,
        },
        err,
      );
    }
  } else if (authType.type === 'profile') {
    try {
      awsConfig = await systemConfigManager.getProfiledAwsConfig(context, authType.profileName);
    } catch (err) {
      throw new AmplifyError(
        'ProfileConfigurationError',
        {
          message: 'Failed to get profile credentials',
          details: err.message,
        },
        err,
      );
    }
  } else if (authType.type === 'accessKeys') {
    awsConfig = loadConfigFromPath(projectConfigInfo.config.awsConfigFilePath);
  }

  return awsConfig;
}

export async function resetCache(context: $TSContext) {
  const projectConfigInfo = getCurrentConfig(context);
  if (projectConfigInfo.configLevel === 'project') {
    const { config } = projectConfigInfo;
    if (config.useProfile) {
      await systemConfigManager.resetCache(context, config.profileName);
    }
  }
}

export function resolveRegion(): string {
  // For details of how aws region is set, check the following link
  // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html
  let region: string;

  if (process.env.AWS_REGION) {
    region = process.env.AWS_REGION;
  }
  if (process.env.AMAZON_REGION) {
    region = process.env.AMAZON_REGION;
  }
  if (process.env.AWS_SDK_LOAD_CONFIG) {
    const profileName = process.env.AWS_PROFILE || 'default';
    region = systemConfigManager.getProfileRegion(profileName);
  }

  return region;
}

async function newUserCheck(context: $TSContext) {
  const configSource = scanConfig(context);
  if (!configSource) {
    if (context.exeInfo.inputParams[constants.ProviderName]) {
      const inputParams = context.exeInfo.inputParams[constants.ProviderName];
      const inputConfigSufficient =
        inputParams.configLevel === 'general' || (inputParams.configLevel === 'project' && !inputParams.config.useProfile);
      if (inputConfigSufficient) {
        return;
      }
    }
    if (context.exeInfo.inputParams.yes) {
      throw new AmplifyError('ConfigurationError', {
        message: 'AWS access credentials can not be found.',
      });
    } else {
      context.print.info('AWS access credentials can not be found.');
      const answer = await prompt([
        {
          type: 'confirm',
          name: 'setupNewUser',
          message: 'Setup new user',
          default: true,
        },
      ]);
      if (answer.setupNewUser) {
        context.newUserInfo = await setupNewUser.run(context);
      }
    }
  }
}

function scanConfig(context: $TSContext) {
  let configSource: string = getConfigLevel(context);

  if (!configSource) {
    const namedProfiles: $TSAny = systemConfigManager.getNamedProfiles();
    if (namedProfiles && Object.keys(namedProfiles).length > 0) {
      configSource = 'profile-available';
    }
    if (namedProfiles && namedProfiles.default) {
      configSource = 'system';
    }
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && (process.env.AWS_REGION || process.env.AMAZON_REGION)) {
      configSource = 'envVar';
    }
    if (process.env.AWS_PROFILE && namedProfiles && namedProfiles[process.env.AWS_PROFILE.trim()]) {
      configSource = 'envVar-profile';
    }
  }

  return configSource;
}

function getConfigLevel(context: $TSContext): ProjectType {
  let configLevel: ProjectType;

  try {
    const namedProfiles = systemConfigManager.getNamedProfiles();
    const configInfoFilePath = pathManager.getLocalAWSInfoFilePath();

    if (fs.existsSync(configInfoFilePath)) {
      const { envName } = context.amplify.getEnvInfo();
      const envConfigInfo = JSONUtilities.readJson(configInfoFilePath)[envName];
      if (envConfigInfo) {
        // configLevel is 'general' only when it's explicitly set so
        if (envConfigInfo.configLevel === 'general') {
          configLevel = 'general';
        } else if (envConfigInfo.configLevel === 'amplifyAdmin') {
          configLevel = 'amplifyAdmin';
        } else if (envConfigInfo.useProfile && envConfigInfo.profileName && namedProfiles && namedProfiles[envConfigInfo.profileName]) {
          configLevel = 'project';
        } else if (envConfigInfo.awsConfigFilePath && fs.existsSync(envConfigInfo.awsConfigFilePath)) {
          configLevel = 'project';
        }
      }
    }
  } catch (e) {
    // no need to do anything
  }

  return configLevel;
}

export async function getAwsConfig(context: $TSContext): Promise<AwsSdkConfig> {
  const { awsConfigInfo } = context.exeInfo;
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  let resultAWSConfigInfo: AwsSdkConfig;

  if (awsConfigInfo.configLevel === 'project') {
    if (awsConfigInfo.config.useProfile) {
      try {
        resultAWSConfigInfo = await systemConfigManager.getProfiledAwsConfig(context, awsConfigInfo.config.profileName);
      } catch (err) {
        throw new AmplifyError(
          'ProfileConfigurationError',
          {
            message: 'Failed to get profile credentials',
            details: err.message,
          },
          err,
        );
      }
    } else {
      resultAWSConfigInfo = {
        accessKeyId: awsConfigInfo.config.accessKeyId,
        secretAccessKey: awsConfigInfo.config.secretAccessKey,
        sessionToken: awsConfigInfo.config.sessionToken,
        region: awsConfigInfo.config.region,
      };
    }
  } else if (awsConfigInfo.configLevel === 'amplifyAdmin') {
    const appId = resolveAppId(context);
    try {
      resultAWSConfigInfo = await getTempCredsWithAdminTokens(context, appId);
    } catch (err) {
      throw new AmplifyError(
        'AmplifyStudioLoginError',
        {
          message: 'Failed to fetch Amplify Studio credentials',
          details: err.message,
        },
        err,
      );
    }
  }

  // HTTP_PROXY & HTTPS_PROXY env vars are read automatically by ProxyAgent, but we check to see if they are set before using the proxy
  // if (httpProxy) {
  //   resultAWSConfigInfo = {
  //     ...resultAWSConfigInfo,
  //     httpOptions: { agent: new ProxyAgent() },
  //   };
  // }

  return resultAWSConfigInfo;
}

async function determineAuthFlow(context: $TSContext, projectConfig?: ProjectConfig): Promise<AuthFlowConfig> {
  // Check for headless parameters
  // TODO fix how input parameters are handled
  let cfnParams = _.get(context, ['exeInfo', 'inputParams', 'awscloudformation'], undefined);
  if (cfnParams?.config) {
    cfnParams = cfnParams.config;
  }
  let {
    accessKeyId,
    profileName,
    region,
    secretAccessKey,
    useProfile,
  }: {
    accessKeyId: string;
    profileName: string;
    region: string;
    secretAccessKey: string;
    useProfile: boolean;
  } = cfnParams || {};

  // Check for local project config
  useProfile = useProfile ?? projectConfig?.config?.useProfile;
  profileName = profileName ?? projectConfig?.config?.profileName;

  const generalCreds = projectConfig?.configLevel === 'general' || cfnParams?.configLevel === 'general';

  if (generalCreds) {
    return { type: 'general' };
  }

  if (useProfile && profileName) {
    return { type: 'profile', profileName };
  }

  if (accessKeyId && secretAccessKey && region) {
    return {
      type: 'accessKeys',
      accessKeyId,
      region,
      secretAccessKey,
    };
  }

  if (projectConfig?.config?.awsConfigFilePath) {
    const awsConfigInfo = loadConfigFromPath(projectConfig.config.awsConfigFilePath);
    return { ...awsConfigInfo, type: 'accessKeys' };
  }

  let appId: string;
  let adminAppConfig: { isAdminApp?: boolean; region?: string };
  try {
    appId = resolveAppId(context);
    if (appId) {
      adminAppConfig = await isAmplifyAdminApp(appId);
      if (adminAppConfig.isAdminApp && adminAppConfig.region) {
        region = adminAppConfig.region;
        if (doAdminTokensExist(appId) && projectConfig?.configLevel === 'amplifyAdmin') {
          return { type: 'admin', appId, region };
        }
      }
    }
  } catch (e) {
    // do nothing, appId might not be defined for a new project
  }

  if (context?.exeInfo?.inputParams?.yes) {
    if (process.env.AWS_SDK_LOAD_CONFIG) {
      profileName = profileName || process.env.AWS_PROFILE || 'default';
      return { type: 'profile', profileName };
    }
    accessKeyId = accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    secretAccessKey = secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    region = region || resolveRegion();
    if (accessKeyId && secretAccessKey && region) {
      return {
        type: 'accessKeys',
        accessKeyId,
        region,
        secretAccessKey,
      };
    }
  }

  if (context?.exeInfo?.inputParams?.yes) {
    const errorMessage = 'Failed to resolve AWS credentials with --yes flag.';
    const docsUrl = 'https://docs.amplify.aws/cli/usage/headless';
    context.print.error(errorMessage);
    context.print.info(`Access keys for continuous integration can be configured with headless parameters: ${chalk.green(docsUrl)}`);
    await context.usageData.emitError(new Error(errorMessage));
    exitOnNextTick(1);
  }

  const authType = await askAuthType(adminAppConfig?.isAdminApp);
  if (authType === 'admin') {
    return { type: authType, appId, region };
  }
  return { type: authType };
}

async function askAuthType(isAdminAvailable = false): Promise<AuthFlow> {
  let choices: { name: string; value: AuthFlow }[] = [
    { name: 'AWS profile', value: 'profile' },
    { name: 'AWS access keys', value: 'accessKeys' },
  ];

  if (isAdminAvailable) {
    choices = [{ name: 'Amplify Studio', value: 'admin' }, ...choices];
  }

  const { authChoice }: { authChoice?: AuthFlow } = await prompt(authTypeQuestion(choices));

  return authChoice;
}

// Regex adapted from: https://aws.amazon.com/blogs/security/a-safer-way-to-distribute-aws-credentials-to-ec2/

function validateAccessKeyId(input: $TSAny): string | boolean {
  const INVALID_ACCESS_KEY_ID = 'Access Key ID must be 20 characters, and uppercase alphanumeric only.';
  const accessKeyIdRegex = /^[A-Z0-9]{20}$/;
  return accessKeyIdRegex.test(input) ? true : INVALID_ACCESS_KEY_ID;
}
function validateSecretAccessKey(input: $TSAny): string | boolean {
  const INVALID_SECRET_ACCESS_KEY = 'Secret Access Key must be 40 characters, and base-64 string only.';
  const secretAccessKeyRegex = /^[A-Za-z0-9/+=]{40}$/;
  return secretAccessKeyRegex.test(input) ? true : INVALID_SECRET_ACCESS_KEY;
}
