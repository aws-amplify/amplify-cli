const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const inquirer = require('inquirer');
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
  context.projectConfigInfo = {
    configLevel: 'project',
    config: defaultAWSConfig,
  };
  await newUserCheck(context);
  printInfo(context);
  context.projectConfigInfo.action = 'init';

  return (await carryOutConfigAction(context));
}

async function configure(context) {
  context.projectConfigInfo = getCurrentConfig(context);
  await newUserCheck(context);
  printInfo(context);
  await setProjectConfigAction(context);
  return (await carryOutConfigAction(context));
}

async function carryOutConfigAction(context) {
  let result;
  switch (context.projectConfigInfo.action) {
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
  const { projectConfigInfo } = context;
  if (projectConfigInfo.configLevel === 'project') {
    await promptForProjectConfig(context);
  }

  validateConfig(context);
  if (!projectConfigInfo.configValidated) {
    throw new Error('Invalid configuration settings');
  }

  return context;
}

function onInitSuccessful(context) {
  if (context.projectConfigInfo.action === 'init') {
    persistConfig(context);
  }
  return context;
}

async function create(context) {
  const { projectConfigInfo } = context;
  await promptForProjectConfig(context);
  validateConfig(context);
  if (projectConfigInfo.configValidated) {
    persistConfig(context);
  } else {
    throw new Error('Invalid configuration settings');
  }
  return context;
}

async function update(context) {
  const { projectConfigInfo } = context;
  await promptForProjectConfig(context);
  validateConfig(context);
  if (projectConfigInfo.configValidated) {
    updateProjectConfig(context);
  } else {
    throw new Error('Invalid configuration settings');
  }
  return context;
}

async function remove(context) {
  const { projectConfigInfo } = context;
  await confirmProjectConfigRemoval(context);
  if (projectConfigInfo.action !== 'cancel') {
    removeProjectConfig(context);
  }
  return context;
}

function printInfo(context) {
  const url =
  'https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html';
  context.print.info('');
  context.print.info('For more information on AWS Profiles, see:');
  context.print.info(chalk.green(url));
  context.print.info('');
}

async function setProjectConfigAction(context) {
  context.projectConfigInfo.action = 'none';
  context.print.info('For the awscloudformation provider.');
  if (context.projectConfigInfo.configLevel === 'project') {
    const updateOrRemove = {
      type: 'list',
      name: 'action',
      message: 'Do you want to update or remove the project level configuration',
      choices: ['update', 'remove', 'cancel'],
      default: 'update',
    };
    const answer = await inquirer.prompt(updateOrRemove);
    context.projectConfigInfo.action = answer.action;
  } else {
    const confirmCreate = {
      type: 'confirm',
      name: 'setProjectLevelConfig',
      message: 'Do you want to set the project level configuration',
      default: true,
    };
    const answer = await inquirer.prompt(confirmCreate);
    if (answer.setProjectLevelConfig) {
      context.projectConfigInfo.action = 'create';
      context.projectConfigInfo.configLevel = 'project';
      context.projectConfigInfo.config = defaultAWSConfig;
    } else {
      context.projectConfigInfo.action = 'none';
      context.projectConfigInfo.configLevel = 'general';
    }
  }

  return context;
}

async function confirmProjectConfigRemoval(context) {
  const removeProjectComfirmation = {
    type: 'confirm',
    name: 'removeProjectConfig',
    message: 'Remove project level configuration',
    default: false,
  };
  const asnwer = await inquirer.prompt(removeProjectComfirmation);
  context.projectConfigInfo.action = asnwer.removeProjectConfig ? 'remove' : 'cancel';
  return context;
}

async function promptForProjectConfig(context) {
  const { projectConfigInfo } = context;

  let availableProfiles = [];
  const systemConfig = systemConfigManager.getFullConfig();
  if (systemConfig) {
    availableProfiles = Object.keys(systemConfig);
  }

  const useProfileConfirmation = {
    type: 'confirm',
    name: 'useProfile',
    message: 'Do you want to use an AWS profile?',
    default: projectConfigInfo.config.useProfile,
  };

  const profileName = {
    type: 'list',
    name: 'profileName',
    message: 'Please choose the profile you want to use',
    choices: availableProfiles,
    default: projectConfigInfo.config.profileName,
  };

  const configurationSettings = [
    {
      type: 'input',
      name: 'accessKeyId',
      message: 'accessKeyId: ',
      default: projectConfigInfo.config.accessKeyId ?
        obfuscateUtil.obfuscate(projectConfigInfo.config.accessKeyId) :
        constants.DefaultAWSAccessKeyId,
      transformer: obfuscateUtil.transform,
    },
    {
      type: 'input',
      name: 'secretAccessKey',
      message: 'secretAccessKey: ',
      default: projectConfigInfo.config.secretAccessKey ?
        obfuscateUtil.obfuscate(projectConfigInfo.config.secretAccessKey)
        : constants.DefaultAWSSecretAccessKey,
      transformer: obfuscateUtil.transform,
    },
    {
      type: 'list',
      name: 'region',
      message: 'region: ',
      choices: awsRegions.regions,
      default: projectConfigInfo.config.region ?
        projectConfigInfo.config.region : constants.DefaultAWSRegion,
    },
  ];

  let answers;

  if (availableProfiles && availableProfiles.length > 0) {
    answers = await inquirer.prompt(useProfileConfirmation);
    projectConfigInfo.config.useProfile = answers.useProfile;
    if (answers.useProfile) {
      answers = await inquirer.prompt(profileName);
      projectConfigInfo.config.profileName = answers.profileName;
      return context;
    }
  } else {
    projectConfigInfo.config.useProfile = false;
  }

  answers = await inquirer.prompt(configurationSettings);
  if (!obfuscateUtil.isObfuscated(answers.accessKeyId)) {
    projectConfigInfo.config.accessKeyId = answers.accessKeyId;
  }
  if (!obfuscateUtil.isObfuscated(answers.secretAccessKey)) {
    projectConfigInfo.config.secretAccessKey = answers.secretAccessKey;
  }
  projectConfigInfo.config.region = answers.region;

  return context;
}

function validateConfig(context) {
  const { projectConfigInfo } = context;
  projectConfigInfo.configValidated = false;
  if (projectConfigInfo.configLevel === 'general') {
    projectConfigInfo.configValidated = true;
  } else if (projectConfigInfo.config) {
    if (projectConfigInfo.config.useProfile) {
      if (projectConfigInfo.config.profileName && projectConfigInfo.config.profileName.length > 0) {
        projectConfigInfo.configValidated = true;
      }
    } else {
      projectConfigInfo.configValidated = projectConfigInfo.config.accessKeyId &&
        projectConfigInfo.config.accessKeyId !== constants.DefaultAWSAccessKeyId &&
        projectConfigInfo.config.secretAccessKey &&
        projectConfigInfo.config.secretAccessKey !== constants.DefaultAWSSecretAccessKey &&
        projectConfigInfo.config.region &&
        awsRegions.regions.includes(projectConfigInfo.config.region);
    }
  }
  return context;
}

function persistConfig(context) {
  const { projectConfigInfo } = context;

  const awsInfo = {
    configLevel: projectConfigInfo.configLevel,
  };

  if (projectConfigInfo.configLevel === 'general') {
    awsInfo.configLevel = 'general';
  } else {
    awsInfo.configLevel = 'project';
    if (projectConfigInfo.config.useProfile) {
      awsInfo.useProfile = true;
      awsInfo.profileName = projectConfigInfo.config.profileName;
    } else {
      awsInfo.useProfile = false;
      const awsSecrets = {
        accessKeyId: projectConfigInfo.config.accessKeyId,
        secretAccessKey: projectConfigInfo.config.secretAccessKey,
        region: projectConfigInfo.config.region,
      };
      const sharedConfigDirPath =
        path.join(context.amplify.pathManager.getHomeDotAmplifyDirPath(), constants.Label);
      fs.ensureDirSync(sharedConfigDirPath);
      const awsSecretsFileName = context.amplify.makeId(10);
      const awsSecretsFilePath = path.join(sharedConfigDirPath, awsSecretsFileName);
      const jsonString = JSON.stringify(awsSecrets, null, 4);
      fs.writeFileSync(awsSecretsFilePath, jsonString, 'utf8');

      awsInfo.awsConfigFilePath = awsSecretsFilePath;
    }
  }

  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.AWSInfoFileName);
  const jsonString = JSON.stringify(awsInfo, null, 4);
  fs.writeFileSync(configInfoFilePath, jsonString, 'utf8');
  return context;
}

function getCurrentConfig(context) {
  const projectConfigInfo = {
    configLevel: 'general',
    config: {},
  };
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.AWSInfoFileName);

  if (fs.existsSync(configInfoFilePath)) {
    try {
      const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));

      if (configInfo && configInfo.configLevel !== 'general') {
        if (configInfo.useProfile && configInfo.profileName) {
          projectConfigInfo.config.useProfile = configInfo.useProfile;
          projectConfigInfo.config.profileName = configInfo.profileName;
        } else if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
          const awsSecrets = JSON.parse(fs.readFileSync(configInfo.awsConfigFilePath, 'utf8'));
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
  persistConfig(context);
  return context;
}

function removeProjectConfig(context) {
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.AWSInfoFileName);
  const configInfo = {
    configLevel: 'general',
  };
  const jsonString = JSON.stringify(configInfo, null, 4);
  fs.writeFileSync(configInfoFilePath, jsonString, 'utf8');
}

async function loadConfiguration(context, awsClient, attatchRegion) {
  process.env.AWS_SDK_LOAD_CONFIG = true;
  const projectConfigInfo = getCurrentConfig(context);
  if (projectConfigInfo.configLevel !== 'general') {
    const { config } = projectConfigInfo;
    if (config.useProfile) {
      process.env.AWS_PROFILE = config.profileName;
      const credentials = new awsClient.SharedIniFileCredentials({
        profile: config.profileName,
      });
      awsClient.config.credentials = credentials;
    } else {
      awsClient.config.loadFromPath(config.awsConfigFilePath);
    }
  }
  if (attatchRegion) {
    awsClient.region = getRegion(projectConfigInfo);
  }
  return awsClient;
}

function getRegion(projectConfigInfo) {
  // For details of how aws region is set, check the following link
  // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html
  if (projectConfigInfo.configLevel === 'general') {
    if (process.env.AWS_REGION) {
      return process.env.AWS_REGION;
    }
    if (process.env.AMAZON_REGION) {
      return process.env.AMAZON_REGION;
    }
    const profileName = process.env.AWS_PROFILE || 'default';
    return systemConfigManager.getProfile(profileName).region;
  }
  const { config } = projectConfigInfo;
  if (config.useProfile) {
    return systemConfigManager.getProfile(config.profileName).region;
  }
  return config.region;
}

async function newUserCheck(context) {
  const configSource = scanConfig(context);
  if (!configSource) {
    context.print.info('AWS access credentials can not be found.');
    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'setupNewUser',
      message: 'Setup new user',
      default: true,
    }]);
    if (answer.setupNewUser) {
      context.newUserInfo = await setupNewUser.run(context);
    }
  }
}

function scanConfig(context) {
  let configSource = getConfigLevel(context);

  if (!configSource) {
    const systemConfigs = systemConfigManager.getFullConfig();
    if (systemConfigs && Object.keys(systemConfigs).length > 0) {
      configSource = 'profile-available';
    }
    if (systemConfigs && systemConfigs.default) {
      configSource = 'system';
    }
    if (process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        (process.env.AWS_REGION || process.env.AMAZON_REGION)) {
      configSource = 'envVar';
    }
    if ((process.env.AWS_PROFILE && systemConfigs &&
          systemConfigs[process.env.AWS_PROFILE.trim()])) {
      configSource = 'envVar-profile';
    }
  }

  return configSource;
}

function getConfigLevel(context) {
  let configLevel;
  try {
    const systemConfigs = systemConfigManager.getFullConfig();
    const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
    const configInfoFilePath = path.join(dotConfigDirPath, constants.AWSInfoFileName);
    if (fs.existsSync(configInfoFilePath)) {
      const envConfigInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));
      if (envConfigInfo) {
        // configLevel is 'general' only when it's explicitly set so
        if (envConfigInfo.configLevel === 'general') {
          configLevel = 'general';
        } else if (envConfigInfo.useProfile && envConfigInfo.profileName &&
                systemConfigs && systemConfigs[envConfigInfo.profileName]) {
          configLevel = 'project';
        } else if (envConfigInfo.awsConfigFilePath &&
          fs.existsSync(envConfigInfo.awsConfigFilePath)) {
          configLevel = 'project';
        }
      }
    }
  } catch (e) {
    // no need to do anything
  }
  return configLevel;
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
  loadConfiguration,
};
