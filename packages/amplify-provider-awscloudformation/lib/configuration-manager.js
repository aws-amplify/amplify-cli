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

async function init(context) {
  context.projectConfigInfo = {};
  await newUserCheck(context);
  printInfo(context);
  context.projectConfigInfo.action = 'init';

  return carryOutConfigAction(context);
}

async function configure(context) {
  context.projectConfigInfo = {};
  await newUserCheck(context);
  printInfo(context);
  await promptForProjectConfigUpdate(context);
  return carryOutConfigAction(context);
}

function carryOutConfigAction(context) {
  let result;
  switch (context.projectConfigInfo.action) {
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

function initialize(context) {
  return configProject(context)
    .then(validateConfig)
    .then((ctxt) => {
      if (ctxt.projectConfigInfo.configValidated) {
        return ctxt;
      }
      throw new Error('Invalid configuration settings');
    });
}

function onInitSuccessful(context) {
  if (context.projectConfigInfo.action === 'init') {
    return createProjectConfig(context);
  }
  return context;
}

function create(context) {
  return configProject(context)
    .then(validateConfig)
    .then((ctxt) => {
      if (ctxt.projectConfigInfo.configValidated) {
        createProjectConfig(ctxt);
        return ctxt;
      }
      throw new Error('Invalid configuration settings');
    });
}

function update(context) {
  return configProject(context)
    .then(validateConfig)
    .then((ctxt) => {
      if (ctxt.projectConfigInfo.configValidated) {
        updateProjectConfig(ctxt);
        return ctxt;
      }
      throw new Error('Invalid configuration settings');
    });
}

function remove(context) {
  return confirmProjectConfigRemoval(context)
    .then((ctxt) => {
      if (ctxt.projectConfigInfo.action !== 'cancel') {
        removeProjectConfig(ctxt);
      }
    });
}

function printInfo(context) {
  const url =
  'https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html';
  context.print.info('');
  context.print.info('For more information on AWS Profiles, see:');
  context.print.info(chalk.green(url));
  context.print.info('');
}

function promptForProjectConfigUpdate(context) {
  getProjectConfig(context);
  if (context.projectConfigInfo.projectConfigExists) {
    const updateOrRemove = {
      type: 'list',
      name: 'action',
      message: 'Do you want to update or remove the project level configuration',
      choices: ['update', 'remove', 'cancel'],
      default: 'update',
    };
    return inquirer.prompt(updateOrRemove)
      .then((answers) => {
        context.projectConfigInfo.action = answers.action;
        return context;
      });
  }
  context.projectConfigInfo.action = 'create';
}

function confirmProjectConfigRemoval(context) {
  const removeProjectComfirmation = {
    type: 'confirm',
    name: 'removeProjectConfig',
    message: 'Remove project level configuration',
    default: false,
  };
  return inquirer.prompt(removeProjectComfirmation)
    .then((answers) => {
      context.projectConfigInfo.action = answers.removeProjectConfig ? 'confirmed-remove' : 'cancel';
      return context;
    });
}

async function configProject(context) {
  const {
    projectConfigInfo,
    newUserInfo,
  } = context;

  let availableProfiles = [];
  const systemConfig = systemConfigManager.getFullConfig();
  if (systemConfig) {
    availableProfiles = Object.keys(systemConfig);
  }

  const useProfileConfirmation = {
    type: 'confirm',
    name: 'useProfile',
    message: 'Do you want to use an AWS profile?',
    default: projectConfigInfo.useProfile,
  };

  const profileName = {
    type: 'list',
    name: 'profileName',
    message: 'Please choose the profile you want to use',
    choices: availableProfiles,
    default: newUserInfo ? newUserInfo.profileName : availableProfiles[0],
  };

  const configurationSettings = [
    {
      type: 'input',
      name: 'accessKeyId',
      message: 'accessKeyId: ',
      default: projectConfigInfo.accessKeyId ?
        obfuscateUtil.obfuscate(projectConfigInfo.accessKeyId) : constants.DefaultAWSAccessKeyId,
      transformer: obfuscateUtil.transform,
    },
    {
      type: 'input',
      name: 'secretAccessKey',
      message: 'secretAccessKey: ',
      default: projectConfigInfo.secretAccessKey ?
        obfuscateUtil.obfuscate(projectConfigInfo.secretAccessKey)
        : constants.DefaultAWSSecretAccessKey,
      transformer: obfuscateUtil.transform,
    },
    {
      type: 'list',
      name: 'region',
      message: 'region: ',
      choices: awsRegions.regions,
      default: projectConfigInfo.region ?
        projectConfigInfo.region : constants.DefaultAWSRegion,
    },
  ];

  let answers;

  if (availableProfiles && availableProfiles.length > 0) {
    answers = await inquirer.prompt(useProfileConfirmation);
    projectConfigInfo.useProfile = answers.useProfile;
    if (answers.useProfile) {
      answers = await inquirer.prompt(profileName);
      projectConfigInfo.profileName = answers.profileName;
      return context;
    }
  }

  answers = await inquirer.prompt(configurationSettings);
  if (!obfuscateUtil.isObfuscated(answers.accessKeyId)) {
    projectConfigInfo.accessKeyId = answers.accessKeyId;
  }
  if (!obfuscateUtil.isObfuscated(answers.secretAccessKey)) {
    projectConfigInfo.secretAccessKey = answers.secretAccessKey;
  }
  projectConfigInfo.region = answers.region;
  return context;
}

function validateConfig(context) {
  const { projectConfigInfo } = context;
  projectConfigInfo.configValidated = false;
  if (projectConfigInfo.useProfile) {
    if (projectConfigInfo.profileName && projectConfigInfo.profileName.length > 0) {
      projectConfigInfo.configValidated = true;
    }
  } else {
    projectConfigInfo.configValidated = projectConfigInfo.accessKeyId &&
      projectConfigInfo.accessKeyId !== constants.DefaultAWSAccessKeyId &&
      projectConfigInfo.secretAccessKey &&
      projectConfigInfo.secretAccessKey !== constants.DefaultAWSSecretAccessKey &&
      projectConfigInfo.region && awsRegions.regions.includes(projectConfigInfo.region);
  }
  return context;
}

function createProjectConfig(context) {
  const { projectConfigInfo } = context;
  const awsConfigInfo = {
    useProfile: projectConfigInfo.useProfile,
  };

  if (projectConfigInfo.useProfile) {
    awsConfigInfo.profileName = projectConfigInfo.profileName;
  } else {
    const awsConfig = {
      accessKeyId: projectConfigInfo.accessKeyId,
      secretAccessKey: projectConfigInfo.secretAccessKey,
      region: projectConfigInfo.region,
    };
    const sharedConfigDirPath =
      path.join(context.amplify.pathManager.getHomeDotAmplifyDirPath(), constants.Label);
    fs.ensureDirSync(sharedConfigDirPath);
    const configFileName = context.amplify.makeId(10);
    const awsConfigFilePath = path.join(sharedConfigDirPath, configFileName);
    const jsonString = JSON.stringify(awsConfig, null, 4);
    fs.writeFileSync(awsConfigFilePath, jsonString, 'utf8');

    awsConfigInfo.awsConfigFilePath = awsConfigFilePath;
  }
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  const jsonString = JSON.stringify(awsConfigInfo, null, 4);
  fs.writeFileSync(configInfoFilePath, jsonString, 'utf8');
  return context;
}

function getProjectConfig(context) {
  const {
    projectConfigInfo,
  } = context;
  projectConfigInfo.projectConfigExists = false;
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  if (fs.existsSync(configInfoFilePath)) {
    try {
      const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));
      if (configInfo.useProfile && configInfo.profileName) {
        projectConfigInfo.useProfile = configInfo.useProfile;
        projectConfigInfo.profileName = configInfo.profileName;
      } else if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
        const awsConfig = JSON.parse(fs.readFileSync(configInfo.awsConfigFilePath, 'utf8'));
        projectConfigInfo.useProfile = false;
        projectConfigInfo.accessKeyId = awsConfig.accessKeyId;
        projectConfigInfo.secretAccessKey = awsConfig.secretAccessKey;
        projectConfigInfo.region = awsConfig.region;
      }
      projectConfigInfo.projectConfigExists = true;
    } catch (e) {
      fs.removeSync(configInfoFilePath);
    }
  }
  return context;
}

function updateProjectConfig(context) {
  removeProjectConfig(context);
  createProjectConfig(context);
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
    context.print.info('AWS access credentials can not be detected.');
    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'setupNewUser',
      message: 'Setup new user',
      default: true,
    }]);
    if (answer.setupNewUser) {
      await setupNewUser.run(context);
    }
  }
  return context;
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
