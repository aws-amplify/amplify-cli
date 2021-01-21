import { pathManager, stateManager, $TSAny, $TSContext, JSONUtilities } from 'amplify-cli-core';
const aws = require('aws-sdk'); // TODO switch to ./aws-utils/aws when supported
import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { prompt } from 'inquirer';
import proxyAgent from 'proxy-agent';
import awsRegions from './aws-regions';
import constants from './constants';
import setupNewUser from './setup-new-user';
import obfuscateUtil from './utility-obfuscate';
import systemConfigManager from './system-config-manager';
import { doAdminCredentialsExist, isAmplifyAdminApp, getRefreshedTokens } from './utils/admin-helpers';
import { resolveAppId } from './utils/resolve-appId';
import { CognitoIdToken } from './utils/auth-types';
import {
  accessKeysQuestion,
  createConfirmQuestion,
  profileConfirmQuestion,
  profileNameQuestion,
  removeProjectComfirmQuestion,
  updateOrRemoveQuestion,
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

interface AwsSecrets {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

const defaultAWSConfig: AwsConfig = {
  useProfile: true,
  profileName: 'default',
};

export async function init(context: $TSContext) {
  if (!context.exeInfo.isNewProject && doesAwsConfigExists(context)) {
    return context;
  }
  normalizeInputParams(context);

  let appId: string;
  try {
    appId = resolveAppId(context);
  } catch (e) {
    // do nothing
  }
  const { useProfile, configLevel } = _.get(context, ['exeInfo', 'inputParams', 'awscloudformation'], {});
  if (!useProfile && (!configLevel || configLevel === 'amplifyAdmin') && appId && (await isAmplifyAdminApp(appId)).isAdminApp) {
    context.exeInfo.awsConfigInfo = {
      configLevel: 'amplifyAdmin',
      config: {},
    };
  } else {
    context.exeInfo.awsConfigInfo = {
      configLevel: 'project',
      config: defaultAWSConfig,
    };
    await newUserCheck(context);
  }

  printInfo(context);
  context.exeInfo.awsConfigInfo.action = 'init';

  return await carryOutConfigAction(context);
}

export async function configure(context: $TSContext) {
  context.exeInfo = context.exeInfo || context.amplify.getProjectDetails();
  normalizeInputParams(context);
  context.exeInfo.awsConfigInfo = getCurrentConfig(context);
  await enableServerlessContainers(context);

  await newUserCheck(context);
  printInfo(context);
  await setProjectConfigAction(context);
  return await carryOutConfigAction(context);
}

async function enableServerlessContainers(context: $TSContext) {
  const frontend = context.exeInfo.projectConfig.frontend;
  const { config = {} } = context.exeInfo.projectConfig[frontend] || {};

  const { ServerlessContainers } = await prompt({
    type: 'confirm',
    name: 'ServerlessContainers',
    message: 'Do you want to enable container-based deployments?',
    default: config.ServerlessContainers === true
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
      context.exeInfo = context.exeInfo || {};
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
      for (let alias of constants.Aliases) {
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
        context.print.error('Error in the command line parameter for awscloudformation configuration.');
        throw new Error(errorMessage);
      }
    }
    context.exeInfo.inputParams[constants.ProviderName] = normalizedInputParams;
  }
}

async function carryOutConfigAction(context: $TSContext) {
  let result;
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

async function initialize(context: $TSContext) {
  const { awsConfigInfo } = context.exeInfo;
  if (awsConfigInfo.configLevel !== 'amplifyAdmin') {
    if (context.exeInfo.inputParams && context.exeInfo.inputParams[constants.ProviderName]) {
      const inputParams = context.exeInfo.inputParams[constants.ProviderName];
      Object.assign(awsConfigInfo, inputParams);
    } else if (awsConfigInfo.configLevel === 'project' && (!context.exeInfo.inputParams || !context.exeInfo.inputParams.yes)) {
      await promptForProjectConfigConfirmation(context);
    }
  }

  validateConfig(context);
  if (!awsConfigInfo.configValidated) {
    throw new Error('Invalid configuration settings');
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
    await promptForProjectConfigConfirmation(context);
  }

  validateConfig(context);
  if (awsConfigInfo.configValidated) {
    persistLocalEnvConfig(context);
  } else {
    throw new Error('Invalid configuration settings');
  }
  return context;
}

async function update(context: $TSContext) {
  const { awsConfigInfo } = context.exeInfo;
  if (context.exeInfo.inputParams[constants.ProviderName]) {
    const inputParams = context.exeInfo.inputParams[constants.ProviderName];
    Object.assign(awsConfigInfo, inputParams);
  } else {
    await promptForProjectConfigConfirmation(context);
  }
  validateConfig(context);
  if (awsConfigInfo.configValidated) {
    updateProjectConfig(context);
  } else {
    throw new Error('Invalid configuration settings');
  }
  return context;
}

async function remove(context: $TSContext) {
  const { awsConfigInfo } = context.exeInfo;
  await confirmProjectConfigRemoval(context);
  if (awsConfigInfo.action !== 'cancel') {
    removeProjectConfig(context);
  }
  return context;
}

function printInfo(context: $TSContext) {
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
      context.exeInfo.awsConfigInfo.config = defaultAWSConfig;
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
        context.exeInfo.awsConfigInfo.config = defaultAWSConfig;
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
    const asnwer = await prompt(removeProjectComfirmQuestion);
    context.exeInfo.awsConfigInfo.action = asnwer.removeProjectConfig ? 'remove' : 'cancel';
  }
  return context;
}

async function promptForProjectConfigConfirmation(context: $TSContext) {
  const { awsConfigInfo } = context.exeInfo;

  let availableProfiles = [];
  const namedProfiles = systemConfigManager.getNamedProfiles();
  if (namedProfiles) {
    availableProfiles = Object.keys(namedProfiles);
  }

  let answers: $TSAny;

  if (availableProfiles && availableProfiles.length > 0) {
    answers = await prompt(profileConfirmQuestion(awsConfigInfo.config.useProfile));
    awsConfigInfo.config.useProfile = answers.useProfile;
    if (answers.useProfile) {
      answers = await prompt(profileNameQuestion(availableProfiles, awsConfigInfo.config.profileName));
      awsConfigInfo.config.profileName = answers.profileName;
      return context;
    }
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
      obfuscateUtil.transform,
    ),
  );
  if (!obfuscateUtil.isObfuscated(answers.accessKeyId)) {
    awsConfigInfo.config.accessKeyId = answers.accessKeyId;
  }
  if (!obfuscateUtil.isObfuscated(answers.secretAccessKey)) {
    awsConfigInfo.config.secretAccessKey = answers.secretAccessKey;
  }
  awsConfigInfo.config.region = answers.region;
}

function validateConfig(context: $TSContext) {
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
    }
  }
  return context;
}

function persistLocalEnvConfig(context: $TSContext) {
  let { awsConfigInfo } = context.exeInfo;
  const { appId } = _.get(context, ['exeInfo', 'inputParams', 'amplify'], {});
  if (appId && doAdminCredentialsExist(appId)) {
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

function getCurrentConfig(context) {
  const { envName } = context.amplify.getEnvInfo();
  return getConfigForEnv(context, envName);
}

export function getConfigForEnv(context: $TSContext, envName: string) {
  const projectConfigInfo: ProjectConfig = {
    configLevel: 'general',
    config: {},
  };
  const dotConfigDirPath = pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);

  if (fs.existsSync(configInfoFilePath)) {
    try {
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
          throw new Error(`Corrupt file contents in ${configInfoFilePath}`);
        }
        projectConfigInfo.configLevel = 'project';
      } else if (configInfo) {
        projectConfigInfo.configLevel = configInfo.configLevel;
      }
    } catch (e) {
      throw e;
    }
  }
  return projectConfigInfo;
}

function updateProjectConfig(context: $TSContext) {
  removeProjectConfig(context);
  persistLocalEnvConfig(context);
  return context;
}

function removeProjectConfig(context: $TSContext) {
  const dotConfigDirPath = pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);
  if (fs.existsSync(configInfoFilePath)) {
    const { envName } = context.amplify.getEnvInfo();
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

export async function loadConfiguration(context: $TSContext) {
  const { envName } = context.amplify.getEnvInfo();
  const config = await loadConfigurationForEnv(context, envName);
  return config;
}

function loadConfigFromPath(profilePath: string) {
  if (fs.existsSync(profilePath)) {
    const config = JSONUtilities.readJson<$TSAny>(profilePath);
    if (config.accessKeyId && config.secretAccessKey && config.region) {
      return config;
    }
  }
  throw new Error(`Invalid config ${profilePath}`);
}

async function getAdminCredentials(idToken: CognitoIdToken, identityId: string, region: string) {
  const cognitoIdentity = new aws.CognitoIdentity({ region });
  const login = idToken.payload.iss.replace('https://', '');
  return cognitoIdentity
    .getCredentialsForIdentity({
      IdentityId: identityId,
      Logins: {
        [login]: idToken.jwtToken,
      },
    })
    .promise();
}

export async function loadConfigurationForEnv(context: $TSContext, env: string, appId?: string) {
  const projectConfigInfo = getConfigForEnv(context, env);
  const { print, usageData } = context;
  let awsConfig;
  if (projectConfigInfo.configLevel === 'amplifyAdmin' || appId) {
    projectConfigInfo.configLevel = 'amplifyAdmin';
    appId = appId || resolveAppId(context);

    if (!doAdminCredentialsExist(appId)) {
      const errorMsg = `No credentials found for appId: ${appId}`;
      print.info('');
      print.error(errorMsg);
      print.info(`If the appId is correct, try running amplify configure --appId ${appId} --envName ${env}`);
      usageData.emitError(new Error(errorMsg));
      process.exit(1);
    }

    try {
      const authConfig = await getRefreshedTokens(appId, print);
      const { idToken, IdentityId, region } = authConfig;
      // use tokens to get creds and assign to config
      let credentials = (await getAdminCredentials(idToken, IdentityId, region)).Credentials;

      awsConfig = {
        accessKeyId: credentials.AccessKeyId,
        expiration: credentials.Expiration,
        region,
        secretAccessKey: credentials.SecretKey,
        sessionToken: credentials.SessionToken,
      };

      aws.config.update(awsConfig);

      const sts = new aws.STS();
      credentials = (
        await sts
          .assumeRole({
            RoleArn: idToken.payload['cognito:preferred_role'],
            RoleSessionName: 'amplifyadmin',
          })
          .promise()
      ).Credentials;

      awsConfig = {
        accessKeyId: credentials.AccessKeyId,
        expiration: credentials.Expiration,
        region,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken,
      };
    } catch (err) {
      print.error('Failed to get credentials.');
      print.info(err);
      usageData.emitError(err);
      process.exit(1);
    }
  } else if (projectConfigInfo.configLevel === 'project') {
    const { config } = projectConfigInfo;
    if (config.useProfile) {
      awsConfig = await systemConfigManager.getProfiledAwsConfig(context, config.profileName);
    } else {
      awsConfig = loadConfigFromPath(config.awsConfigFilePath);
    }
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

export function resolveRegion() {
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
    let needToSetupNewUser = true;
    if (context.exeInfo.inputParams[constants.ProviderName]) {
      const inputParams = context.exeInfo.inputParams[constants.ProviderName];
      const inputConfigSufficient =
        inputParams.configLevel === 'general' || (inputParams.configLevel === 'project' && !inputParams.config.useProfile);
      if (inputConfigSufficient) {
        needToSetupNewUser = false;
      }
    }
    if (needToSetupNewUser) {
      if (context.exeInfo.inputParams.yes) {
        throw new Error('AWS access credentials can not be found.');
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

export async function getAwsConfig(context: $TSContext) {
  const { awsConfigInfo } = context.exeInfo;
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  let awsConfig;
  if (awsConfigInfo.configLevel === 'project') {
    if (awsConfigInfo.config.useProfile) {
      awsConfig = await systemConfigManager.getProfiledAwsConfig(context, awsConfigInfo.config.profileName);
    } else {
      awsConfig = {
        accessKeyId: awsConfigInfo.config.accessKeyId,
        secretAccessKey: awsConfigInfo.config.secretAccessKey,
        region: awsConfigInfo.config.region,
      };
    }
  } else if (awsConfigInfo.configLevel === 'amplifyAdmin') {
    try {
      const appId = resolveAppId(context);
      const { idToken, IdentityId, region } = await getRefreshedTokens(appId, context.print);
      awsConfig = {
        ...(await getAdminCredentials(idToken, IdentityId, region)).Credentials,
        region,
      };
    } catch (err) {
      context.print.error('Failed to fetch Amplify Admin credentials');
      throw new Error(err);
    }
  }

  if (httpProxy) {
    awsConfig = {
      ...awsConfig,
      httpOptions: { agent: proxyAgent(httpProxy) },
    };
  }

  return awsConfig;
}
