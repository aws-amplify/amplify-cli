const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const inquirer = require('inquirer');
const awsRegions = require('./aws-regions');
const constants = require('./constants');
const configScanner = require('./configuration-scanner');
const setupNewUser = require('./setup-new-user');
const obfuscateUtil = require('./utility-obfuscate');
const systemConfigManager = require('./system-config-manager');

const defaultAWSConfig = {
  useProfile: true,
  profileName: 'default',
};

async function init(context) {
  normalizeInputParams(context);
  context.exeInfo.awsConfigInfo = {
    configLevel: 'project',
    config: defaultAWSConfig,
  };
  await newUserCheck(context);
  printInfo(context);
  context.exeInfo.awsConfigInfo.action = 'init';
  return carryOutConfigAction(context);
}

async function configure(context) {
  normalizeInputParams(context);
  context.exeInfo.awsConfigInfo = getCurrentConfig(context);
  await newUserCheck(context);
  printInfo(context);
  await setProjectConfigAction(context);
  return carryOutConfigAction(context);
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
        } else if (!normalizedInputParams.config.accessKeyId ||
            !normalizedInputParams.config.secretAccessKey ||
            !normalizedInputParams.config.region) {
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


function carryOutConfigAction(context) {
  let result;
  switch (context.exeInfo.awsConfigInfo.action) {
    case 'init':
      result = initialize(context);
      break;
    case 'create':
      result = create(context);
      break;
    case 'update':
      result = update(context);
      break;
    case 'remove':
      result = remove(context);
      break;
    default:
      result = context;
  }
  return result;
}

async function initialize(context) {
  const { awsConfigInfo } = context.exeInfo;
  if (context.exeInfo.inputParams[constants.Label]) {
    const inputParams = context.exeInfo.inputParams[constants.Label];
    Object.assign(awsConfigInfo, inputParams);
  } else if (awsConfigInfo.configLevel === 'project' &&
          !context.exeInfo.inputParams.yes) {
    await promptForProjectConfigConfirmation(context);
  }

  validateConfig(context);
  if (!awsConfigInfo.configValidated) {
    throw new Error('Invalid configuration settings');
  }
  return context;
}

function onInitSuccessful(context) {
  const { awsConfigInfo } = context.exeInfo;
  if (awsConfigInfo.configLevel === 'project') {
    persistProjectConfig(context);
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
    persistProjectConfig(context);
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
  const url =
  'https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html';
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
  const systemConfig = systemConfigManager.getFullConfig();
  if (systemConfig) {
    availableProfiles = Object.keys(systemConfig);
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
      type: 'input',
      name: 'accessKeyId',
      message: 'accessKeyId: ',
      default: awsConfigInfo.config.accessKeyId ?
        obfuscateUtil.obfuscate(awsConfigInfo.config.accessKeyId) : constants.DefaultAWSAccessKeyId,
      transformer: obfuscateUtil.transform,
    },
    {
      type: 'input',
      name: 'secretAccessKey',
      message: 'secretAccessKey: ',
      default: awsConfigInfo.config.secretAccessKey ?
        obfuscateUtil.obfuscate(awsConfigInfo.config.secretAccessKey)
        : constants.DefaultAWSSecretAccessKey,
      transformer: obfuscateUtil.transform,
    },
    {
      type: 'list',
      name: 'region',
      message: 'region: ',
      choices: awsRegions.regions,
      default: awsConfigInfo.config.region ?
        awsConfigInfo.config.region : constants.DefaultAWSRegion,
    },
  ];

  let answers;

  if (availableProfiles && availableProfiles.length > 0) {
    answers = await inquirer.prompt(useProfileConfirmation);
    awsConfigInfo.useProfile = answers.useProfile;
    if (answers.useProfile) {
      answers = await inquirer.prompt(profileName);
      awsConfigInfo.config.profileName = answers.profileName;
      return context;
    }
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
  if (awsConfigInfo.config.useProfile) {
    if (awsConfigInfo.config.profileName && awsConfigInfo.config.profileName.length > 0) {
      awsConfigInfo.configValidated = true;
    }
  } else {
    awsConfigInfo.configValidated = awsConfigInfo.config.accessKeyId &&
      awsConfigInfo.config.accessKeyId !== constants.DefaultAWSAccessKeyId &&
      awsConfigInfo.config.secretAccessKey &&
      awsConfigInfo.config.secretAccessKey !== constants.DefaultAWSSecretAccessKey &&
      awsConfigInfo.config.region && awsRegions.regions.includes(awsConfigInfo.config.region);
  }
  return context;
}

function persistProjectConfig(context) {
  const { awsConfigInfo } = context.exeInfo;

  const awsInfo = {
    useProfile: awsConfigInfo.config.useProfile,
  };

  if (awsConfigInfo.config.useProfile) {
    awsInfo.profileName = awsConfigInfo.config.profileName;
  } else {
    const awsSecrets = {
      accessKeyId: awsConfigInfo.config.accessKeyId,
      secretAccessKey: awsConfigInfo.config.secretAccessKey,
      region: awsConfigInfo.config.region,
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
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const awsInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  const jsonString = JSON.stringify(awsInfo, null, 4);
  fs.writeFileSync(awsInfoFilePath, jsonString, 'utf8');
  return context;
}

function getCurrentConfig(context) {
  let awsConfigInfo = {
    configLevel: 'general',
    config: {},
  };
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  if (fs.existsSync(configInfoFilePath)) {
    try {
      const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));
      if (configInfo.useProfile && configInfo.profileName) {
        awsConfigInfo.config.useProfile = configInfo.useProfile;
        awsConfigInfo.config.profileName = configInfo.profileName;
      } else if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
        const awsConfigInfo = JSON.parse(fs.readFileSync(configInfo.awsConfigFilePath, 'utf8'));
        awsConfigInfo.config.useProfile = false;
        awsConfigInfo.config.accessKeyId = awsConfigInfo.config.accessKeyId;
        awsConfigInfo.config.secretAccessKey = awsConfigInfo.config.secretAccessKey;
        awsConfigInfo.config.region = awsConfigInfo.config.region;
      }
      awsConfigInfo.configLevel = 'project';
    } catch (e) {
      awsConfigInfo = {
        configLevel: 'general',
        config: {},
      };
      fs.removeSync(configInfoFilePath);
    }
  }
  return awsConfigInfo;
}

function updateProjectConfig(context) {
  removeProjectConfig(context);
  persistProjectConfig(context);
  return context;
}

function removeProjectConfig(context) {
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  if (fs.existsSync(configInfoFilePath)) {
    const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));
    if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
      fs.removeSync(configInfo.awsConfigFilePath);
    }
    fs.removeSync(configInfoFilePath);
  }
  return context;
}

async function loadConfiguration(context, awsClient) {
  process.env.AWS_SDK_LOAD_CONFIG = true;
  const configSource = configScanner.run(context);
  if (configSource === 'none') {
    context.print.error('Can not resolve aws access settings.');
    throw new Error('Can not resolve aws access settings.');
  } else {
    return logProjectSpecificConfg(context, awsClient);
  }
}

async function newUserCheck(context) {
  const configSource = configScanner.run(context);
  if (configSource === 'none') {
    let needToSetupNewUser = true;
    if (context.exeInfo.inputParams[constants.Label]) {
      const inputParams = context.exeInfo.inputParams[constants.Label];
      const inputConfigSufficient = (inputParams.configLevel === 'project' && !inputParams.config.useProfile);
      if (inputConfigSufficient) {
        needToSetupNewUser = false;
      }
    }
    if (needToSetupNewUser) {
      if (context.exeInfo.inputParams.yes) {
        throw new Error('AWS access credentials can not be found.');
      } else {
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
  }
}

function logProjectSpecificConfg(context, awsClient) {
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  if (fs.existsSync(configInfoFilePath)) {
    const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));
    if (configInfo.useProfile && configInfo.profileName) {
      process.env.AWS_PROFILE = configInfo.profileName;
      const credentials = new awsClient.SharedIniFileCredentials({
        profile: configInfo.profileName,
      });
      awsClient.config.credentials = credentials;
    } else if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
      awsClient.config.loadFromPath(configInfo.awsConfigFilePath);
    }
  }
  return awsClient;
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
  loadConfiguration,
};
