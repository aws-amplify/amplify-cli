const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const inquirer = require('inquirer');
const proxyAgent = require('proxy-agent');
const awsRegions = require('./aws-regions');
const constants = require('./constants');
const setupNewUser = require('./setup-new-user');
const obfuscateUtil = require('./utility-obfuscate');
const systemConfigManager = require('./system-config-manager');

const defaultAWSConfig = {
  useProfile: true,
  profileName: 'default',
};

async function init(context) {
  if (!context.exeInfo.isNewProject && doesAwsConfigExists(context)) {
    return context;
  }
  normalizeInputParams(context);
  context.exeInfo.awsConfigInfo = {
    configLevel: 'project',
    config: defaultAWSConfig,
  };
  await newUserCheck(context);
  printInfo(context);
  context.exeInfo.awsConfigInfo.action = 'init';

  return await carryOutConfigAction(context);
}

async function configure(context) {
  context.exeInfo = context.exeInfo || context.amplify.getProjectDetails();
  normalizeInputParams(context);
  context.exeInfo.awsConfigInfo = getCurrentConfig(context);
  await newUserCheck(context);
  printInfo(context);
  await setProjectConfigAction(context);
  return await carryOutConfigAction(context);
}

function doesAwsConfigExists(context) {
  let configExists = false;
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);
  const { envName } = context.exeInfo ? context.exeInfo.localEnvInfo : context.amplify.getEnv();

  if (fs.existsSync(configInfoFilePath)) {
    const envAwsInfo = context.amplify.readJsonFile(configInfoFilePath);
    if (envAwsInfo[envName]) {
      context.exeInfo = context.exeInfo || {};
      context.exeInfo.awsConfigInfo = envAwsInfo[envName];
      context.exeInfo.awsConfigInfo.config = envAwsInfo[envName];
      configExists = true;
    }
  }

  return configExists;
}

function normalizeInputParams(context) {
  let inputParams;
  if (context.exeInfo.inputParams) {
    if (context.exeInfo.inputParams[constants.Label]) {
      inputParams = context.exeInfo.inputParams[constants.Label];
    } else {
      for (let i = 0; i < constants.Aliases.length; i++) {
        const alias = constants.Aliases[i];
        if (context.exeInfo.inputParams[alias]) {
          inputParams = context.exeInfo.inputParams[alias];
          break;
        }
      }
    }
  }

  if (inputParams) {
    const normalizedInputParams = {};

    if (inputParams.configLevel && inputParams.configLevel === 'general') {
      normalizedInputParams.configLevel = 'general';
    } else {
      delete inputParams.configLevel;
      normalizedInputParams.configLevel = 'project';
      normalizedInputParams.config = inputParams;
    }

    if (normalizedInputParams.configLevel === 'project') {
      let errorMessage;
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
    context.exeInfo.inputParams[constants.Label] = normalizedInputParams;
  }
}

async function carryOutConfigAction(context) {
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

async function initialize(context) {
  const { awsConfigInfo } = context.exeInfo;
  if (context.exeInfo.inputParams && context.exeInfo.inputParams[constants.Label]) {
    const inputParams = context.exeInfo.inputParams[constants.Label];
    Object.assign(awsConfigInfo, inputParams);
  } else if (awsConfigInfo.configLevel === 'project' && (!context.exeInfo.inputParams || !context.exeInfo.inputParams.yes)) {
    await promptForProjectConfigConfirmation(context);
  }

  validateConfig(context);
  if (!awsConfigInfo.configValidated) {
    throw new Error('Invalid configuration settings');
  }

  return context;
}

function onInitSuccessful(context) {
  if (context.exeInfo.isNewEnv || !doesAwsConfigExists(context)) {
    persistLocalEnvConfig(context);
  }
  return context;
}

async function create(context) {
  const { awsConfigInfo } = context.exeInfo;
  if (context.exeInfo.inputParams[constants.Label]) {
    const inputParams = context.exeInfo.inputParams[constants.Label];
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

async function update(context) {
  const { awsConfigInfo } = context.exeInfo;
  if (context.exeInfo.inputParams[constants.Label]) {
    const inputParams = context.exeInfo.inputParams[constants.Label];
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

async function remove(context) {
  const { awsConfigInfo } = context.exeInfo;
  await confirmProjectConfigRemoval(context);
  if (awsConfigInfo.action !== 'cancel') {
    removeProjectConfig(context);
  }
  return context;
}

function printInfo(context) {
  const url = 'https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html';
  context.print.info('');
  context.print.info('For more information on AWS Profiles, see:');
  context.print.info(chalk.green(url));
  context.print.info('');
}

async function setProjectConfigAction(context) {
  if (context.exeInfo.inputParams[constants.Label]) {
    const inputParams = context.exeInfo.inputParams[constants.Label];

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
      const updateOrRemove = {
        type: 'list',
        name: 'action',
        message: 'Do you want to update or remove the project level configuration',
        choices: ['update', 'remove', 'cancel'],
        default: 'update',
      };
      const answer = await inquirer.prompt(updateOrRemove);
      context.exeInfo.awsConfigInfo.action = answer.action;
    } else {
      const confirmCreate = {
        type: 'confirm',
        name: 'setProjectLevelConfig',
        message: 'Do you want to set the project level configuration',
        default: true,
      };
      const answer = await inquirer.prompt(confirmCreate);
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

async function confirmProjectConfigRemoval(context) {
  if (!context.exeInfo.inputParams.yes) {
    const removeProjectComfirmation = {
      type: 'confirm',
      name: 'removeProjectConfig',
      message: 'Remove project level configuration',
      default: false,
    };
    const asnwer = await inquirer.prompt(removeProjectComfirmation);
    context.exeInfo.awsConfigInfo.action = asnwer.removeProjectConfig ? 'remove' : 'cancel';
  }
  return context;
}

async function promptForProjectConfigConfirmation(context) {
  const { awsConfigInfo } = context.exeInfo;

  let availableProfiles = [];
  const namedProfiles = systemConfigManager.getNamedProfiles();
  if (namedProfiles) {
    availableProfiles = Object.keys(namedProfiles);
  }

  const useProfileConfirmation = {
    type: 'confirm',
    name: 'useProfile',
    message: 'Do you want to use an AWS profile?',
    default: awsConfigInfo.config.useProfile,
  };

  const profileName = {
    type: 'list',
    name: 'profileName',
    message: 'Please choose the profile you want to use',
    choices: availableProfiles,
    default: awsConfigInfo.config.profileName,
  };

  const configurationSettings = [
    {
      type: 'password',
      mask: '*',
      name: 'accessKeyId',
      message: 'accessKeyId: ',
      default: awsConfigInfo.config.accessKeyId
        ? obfuscateUtil.obfuscate(awsConfigInfo.config.accessKeyId)
        : constants.DefaultAWSAccessKeyId,
      transformer: obfuscateUtil.transform,
    },
    {
      type: 'password',
      mask: '*',
      name: 'secretAccessKey',
      message: 'secretAccessKey: ',
      default: awsConfigInfo.config.secretAccessKey
        ? obfuscateUtil.obfuscate(awsConfigInfo.config.secretAccessKey)
        : constants.DefaultAWSSecretAccessKey,
      transformer: obfuscateUtil.transform,
    },
    {
      type: 'list',
      name: 'region',
      message: 'region: ',
      choices: awsRegions.regions,
      default: awsConfigInfo.config.region ? awsConfigInfo.config.region : constants.DefaultAWSRegion,
    },
  ];

  let answers;

  if (availableProfiles && availableProfiles.length > 0) {
    answers = await inquirer.prompt(useProfileConfirmation);
    awsConfigInfo.config.useProfile = answers.useProfile;
    if (answers.useProfile) {
      answers = await inquirer.prompt(profileName);
      awsConfigInfo.config.profileName = answers.profileName;
      return context;
    }
  } else {
    awsConfigInfo.config.useProfile = false;
  }

  answers = await inquirer.prompt(configurationSettings);
  if (!obfuscateUtil.isObfuscated(answers.accessKeyId)) {
    awsConfigInfo.config.accessKeyId = answers.accessKeyId;
  }
  if (!obfuscateUtil.isObfuscated(answers.secretAccessKey)) {
    awsConfigInfo.config.secretAccessKey = answers.secretAccessKey;
  }
  awsConfigInfo.config.region = answers.region;

  return context;
}

function validateConfig(context) {
  const { awsConfigInfo } = context.exeInfo;
  awsConfigInfo.configValidated = false;
  if (awsConfigInfo.configLevel === 'general') {
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

function persistLocalEnvConfig(context) {
  const { awsConfigInfo } = context.exeInfo;

  const awsInfo = {
    configLevel: awsConfigInfo.configLevel,
  };

  if (awsConfigInfo.configLevel === 'general') {
    awsInfo.configLevel = 'general';
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
      const sharedConfigDirPath = path.join(context.amplify.pathManager.getHomeDotAmplifyDirPath(), constants.Label);
      fs.ensureDirSync(sharedConfigDirPath);
      const awsSecretsFileName = context.amplify.makeId(10);
      const awsSecretsFilePath = path.join(sharedConfigDirPath, awsSecretsFileName);
      const jsonString = JSON.stringify(awsSecrets, null, 4);
      fs.writeFileSync(awsSecretsFilePath, jsonString, 'utf8');

      awsInfo.awsConfigFilePath = awsSecretsFilePath;
    }
  }

  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);
  const { envName } = context.exeInfo.localEnvInfo;

  let envAwsInfo = {};
  if (fs.existsSync(configInfoFilePath)) {
    envAwsInfo = context.amplify.readJsonFile(configInfoFilePath);
  }

  envAwsInfo[envName] = awsInfo;
  const jsonString = JSON.stringify(envAwsInfo, null, 4);
  fs.writeFileSync(configInfoFilePath, jsonString, 'utf8');

  return context;
}

function getCurrentConfig(context) {
  const { envName } = context.amplify.getEnvInfo();
  return getConfigForEnv(context, envName);
}

function getConfigForEnv(context, envName) {
  const projectConfigInfo = {
    configLevel: 'general',
    config: {},
  };
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);

  if (fs.existsSync(configInfoFilePath)) {
    try {
      const configInfo = context.amplify.readJsonFile(configInfoFilePath, 'utf8')[envName];

      if (configInfo && configInfo.configLevel !== 'general') {
        if (configInfo.useProfile && configInfo.profileName) {
          projectConfigInfo.config.useProfile = configInfo.useProfile;
          projectConfigInfo.config.profileName = configInfo.profileName;
        } else if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
          const awsSecrets = context.amplify.readJsonFile(configInfo.awsConfigFilePath, 'utf8');
          projectConfigInfo.config.useProfile = false;
          projectConfigInfo.config.awsConfigFilePath = configInfo.awsConfigFilePath;
          projectConfigInfo.config.accessKeyId = awsSecrets.accessKeyId;
          projectConfigInfo.config.secretAccessKey = awsSecrets.secretAccessKey;
          projectConfigInfo.config.region = awsSecrets.region;
        } else {
          throw new Error(`Corrupt file contents in ${configInfoFilePath}`);
        }
        projectConfigInfo.configLevel = 'project';
      }
    } catch (e) {
      throw e;
    }
  }
  return projectConfigInfo;
}
function updateProjectConfig(context) {
  removeProjectConfig(context);
  persistLocalEnvConfig(context);
  return context;
}

function removeProjectConfig(context) {
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);
  if (fs.existsSync(configInfoFilePath)) {
    const { envName } = context.amplify.getEnvInfo();
    const configInfo = context.amplify.readJsonFile(configInfoFilePath, 'utf8');
    if (configInfo[envName]) {
      if (configInfo[envName].awsConfigFilePath && fs.existsSync(configInfo[envName].awsConfigFilePath)) {
        fs.removeSync(configInfo[envName].awsConfigFilePath);
      }
      configInfo[envName] = {
        configLevel: 'general',
      };
    }
    const jsonString = JSON.stringify(configInfo, null, 4);
    fs.writeFileSync(configInfoFilePath, jsonString, 'utf8');
  }
}

async function loadConfiguration(context) {
  const { envName } = context.amplify.getEnvInfo();
  const config = await loadConfigurationForEnv(context, envName);
  return config;
}
function loadConfigFromPath(context, profilePath) {
  if (fs.existsSync(profilePath)) {
    const config = context.amplify.readJsonFile(profilePath);
    if (config.accessKeyId && config.secretAccessKey && config.region) {
      return config;
    }
  }
  throw new Error(`Invalid config ${profilePath}`);
}

async function loadConfigurationForEnv(context, env) {
  const projectConfigInfo = getConfigForEnv(context, env);
  if (projectConfigInfo.configLevel === 'project') {
    const { config } = projectConfigInfo;
    let awsConfig;
    if (config.useProfile) {
      awsConfig = await systemConfigManager.getProfiledAwsConfig(context, config.profileName);
    } else {
      awsConfig = loadConfigFromPath(context, config.awsConfigFilePath);
    }
    return awsConfig;
  }
}

async function resetCache(context) {
  const projectConfigInfo = getCurrentConfig(context);
  if (projectConfigInfo.configLevel === 'project') {
    const { config } = projectConfigInfo;
    if (config.useProfile) {
      await systemConfigManager.resetCache(context, config.profileName);
    }
  }
}

function resolveRegion() {
  // For details of how aws region is set, check the following link
  // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html
  let region;
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

async function newUserCheck(context) {
  const configSource = scanConfig(context);
  if (!configSource) {
    let needToSetupNewUser = true;
    if (context.exeInfo.inputParams[constants.Label]) {
      const inputParams = context.exeInfo.inputParams[constants.Label];
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
        const answer = await inquirer.prompt([
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

function scanConfig(context) {
  let configSource = getConfigLevel(context);
  if (!configSource) {
    const namedProfiles = systemConfigManager.getNamedProfiles();
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

function getConfigLevel(context) {
  let configLevel;
  try {
    const namedProfiles = systemConfigManager.getNamedProfiles();
    const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
    const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);
    if (fs.existsSync(configInfoFilePath)) {
      const { envName } = context.amplify.getEnvInfo();
      const envConfigInfo = context.amplify.readJsonFile(configInfoFilePath)[envName];
      if (envConfigInfo) {
        // configLevel is 'general' only when it's explicitly set so
        if (envConfigInfo.configLevel === 'general') {
          configLevel = 'general';
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

async function getAwsConfig(context) {
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
  }

  if (httpProxy) {
    awsConfig = {
      ...awsConfig,
      httpOptions: { agent: proxyAgent(httpProxy) },
    };
  }

  return awsConfig;
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
  loadConfiguration,
  resetCache,
  resolveRegion,
  loadConfigurationForEnv,
  getAwsConfig,
};
